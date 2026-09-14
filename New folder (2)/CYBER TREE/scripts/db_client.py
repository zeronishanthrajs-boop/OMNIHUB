import os
import sqlite3
import json
import uuid
import atexit
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class DBClient:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.use_supabase = bool(self.supabase_url and self.supabase_key)
        self.nodes_queue = []
        self.rels_queue = []
        self.external_id_to_id = {}
        
        if self.use_supabase:
            from supabase import create_client
            self.client = create_client(self.supabase_url, self.supabase_key)
            print("Connected to Supabase DB.")
            # Register automatic flush on script exit
            atexit.register(self.flush)
            
            # Load existing nodes to map external_id -> id
            try:
                limit = 1000
                offset = 0
                while True:
                    res = self.client.table("nodes").select("id, external_id").range(offset, offset + limit - 1).execute()
                    if not res.data:
                        break
                    for row in res.data:
                        ext_id = row.get("external_id")
                        if ext_id:
                            self.external_id_to_id[ext_id] = row["id"]
                    if len(res.data) < limit:
                        break
                    offset += limit
                print(f"Loaded {len(self.external_id_to_id)} existing external IDs from Supabase.")
            except Exception as e:
                print(f"Warning: Could not pre-load external IDs: {e}")
        else:
            self.db_path = os.getenv("SQLITE_DB_PATH", "cyber_tree_local.db")
            print(f"Supabase credentials not found. Falling back to local SQLite DB: {self.db_path}")
            self._init_sqlite()

    def _init_sqlite(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS raw_sources (
            id TEXT PRIMARY KEY,
            source_url TEXT NOT NULL,
            source_name TEXT NOT NULL,
            raw_content TEXT,
            collected_at TEXT,
            processed INTEGER DEFAULT 0,
            processing_error TEXT,
            checksum TEXT UNIQUE
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            node_type TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT,
            content TEXT,
            tags TEXT,
            confidence REAL DEFAULT 0.5,
            source_url TEXT,
            source_name TEXT,
            created_at TEXT,
            updated_at TEXT,
            embedding TEXT,
            external_id TEXT,
            metadata TEXT
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS relationships (
            id TEXT PRIMARY KEY,
            from_node_id TEXT,
            to_node_id TEXT,
            relationship TEXT NOT NULL,
            confidence REAL DEFAULT 0.5,
            evidence TEXT,
            created_at TEXT,
            FOREIGN KEY(from_node_id) REFERENCES nodes(id),
            FOREIGN KEY(to_node_id) REFERENCES nodes(id)
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            category TEXT,
            reliability REAL DEFAULT 0.5,
            total_articles INTEGER DEFAULT 0,
            last_checked TEXT,
            is_active INTEGER DEFAULT 1,
            notes TEXT
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            hypothesis TEXT NOT NULL,
            related_nodes TEXT,
            confidence REAL DEFAULT 0.3,
            status TEXT DEFAULT 'pending',
            evidence_for TEXT,
            evidence_against TEXT,
            created_at TEXT,
            resolved_at TEXT
        )
        """)
        
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_logs (
            id TEXT PRIMARY KEY,
            job_name TEXT NOT NULL,
            started_at TEXT,
            finished_at TEXT,
            status TEXT,
            rows_collected INTEGER DEFAULT 0,
            rows_processed INTEGER DEFAULT 0,
            error_message TEXT,
            notes TEXT
        )
        """)
        
        conn.commit()
        conn.close()

    def _get_sqlite_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    # Raw Sources Table
    def insert_raw_source(self, data: dict):
        if self.use_supabase:
            try:
                res = self.client.table("raw_sources").insert(data).execute()
                return res.data[0] if res.data else None
            except Exception as e:
                # Handle duplicate checksum error gracefully
                if "duplicate key value" in str(e) or "checksum" in str(e):
                    return None
                raise e
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            record_id = data.get("id") or str(uuid.uuid4())
            try:
                cursor.execute(
                    "INSERT INTO raw_sources (id, source_url, source_name, raw_content, collected_at, processed, checksum) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        record_id,
                        data["source_url"],
                        data["source_name"],
                        data.get("raw_content"),
                        data.get("collected_at") or datetime.utcnow().isoformat(),
                        1 if data.get("processed") else 0,
                        data["checksum"]
                    )
                )
                conn.commit()
                data_copy = dict(data)
                data_copy["id"] = record_id
                return data_copy
            except sqlite3.IntegrityError:
                # Duplicate checksum
                return None
            finally:
                conn.close()

    def get_unprocessed_raw_sources(self, limit=500):
        if self.use_supabase:
            res = self.client.table("raw_sources").select("*").eq("processed", False).limit(limit).execute()
            return res.data
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM raw_sources WHERE processed = 0 LIMIT ?", (limit,))
            rows = [dict(r) for r in cursor.fetchall()]
            for r in rows:
                r["processed"] = False
            conn.close()
            return rows

    def mark_raw_source_processed(self, source_id, error=None):
        if self.use_supabase:
            update_data = {"processed": True}
            if error:
                update_data["processing_error"] = str(error)
            self.client.table("raw_sources").update(update_data).eq("id", source_id).execute()
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            if error:
                cursor.execute("UPDATE raw_sources SET processed = 1, processing_error = ? WHERE id = ?", (str(error), source_id))
            else:
                cursor.execute("UPDATE raw_sources SET processed = 1 WHERE id = ?", (source_id,))
            conn.commit()
            conn.close()

    # Nodes Table
    def insert_node(self, node: dict):
        ext_id = node.get("external_id")
        if ext_id and ext_id in self.external_id_to_id:
            node_id = self.external_id_to_id[ext_id]
        else:
            node_id = node.get("id") or str(uuid.uuid4())
            if ext_id:
                self.external_id_to_id[ext_id] = node_id
        node["id"] = node_id
        
        # Serialize lists/dicts for SQLite
        tags_str = json.dumps(node.get("tags") or [])
        metadata_str = json.dumps(node.get("metadata") or {})
        embedding_str = json.dumps(node.get("embedding")) if node.get("embedding") else None
        
        if self.use_supabase:
            # Prepare payload for Supabase
            payload = {
                "id": node_id,
                "node_type": node["node_type"],
                "title": node["title"],
                "summary": node.get("summary"),
                "content": node.get("content"),
                "tags": node.get("tags") or [],
                "confidence": node.get("confidence", 0.5),
                "source_url": node.get("source_url"),
                "source_name": node.get("source_name"),
                "external_id": node.get("external_id"),
                "metadata": node.get("metadata") or {}
            }
            if node.get("embedding"):
                payload["embedding"] = node["embedding"]
            
            self.nodes_queue.append(payload)
            if len(self.nodes_queue) >= 500:
                self.flush_nodes()
            return node_id
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            
            # Check for conflict on external_id
            existing_id = None
            if node.get("external_id"):
                cursor.execute("SELECT id FROM nodes WHERE external_id = ?", (node["external_id"],))
                row = cursor.fetchone()
                if row:
                    existing_id = row[0]
            
            now_str = datetime.utcnow().isoformat()
            if existing_id:
                cursor.execute(
                    """UPDATE nodes SET 
                       node_type = ?, title = ?, summary = ?, content = ?, tags = ?, 
                       confidence = ?, source_url = ?, source_name = ?, updated_at = ?, 
                       embedding = ?, metadata = ? 
                       WHERE id = ?""",
                    (
                        node["node_type"],
                        node["title"],
                        node.get("summary"),
                        node.get("content"),
                        tags_str,
                        node.get("confidence", 0.5),
                        node.get("source_url"),
                        node.get("source_name"),
                        now_str,
                        embedding_str,
                        metadata_str,
                        existing_id
                    )
                )
                node_id = existing_id
            else:
                cursor.execute(
                    """INSERT INTO nodes 
                       (id, node_type, title, summary, content, tags, confidence, source_url, source_name, created_at, updated_at, embedding, external_id, metadata) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        node_id,
                        node["node_type"],
                        node["title"],
                        node.get("summary"),
                        node.get("content"),
                        tags_str,
                        node.get("confidence", 0.5),
                        node.get("source_url"),
                        node.get("source_name"),
                        node.get("created_at") or now_str,
                        node.get("updated_at") or now_str,
                        embedding_str,
                        node.get("external_id"),
                        metadata_str
                    )
                )
            conn.commit()
            conn.close()
            return node_id

    def insert_nodes_batch(self, nodes_list: list):
        inserted_ids = []
        for node in nodes_list:
            node_id = self.insert_node(node)
            inserted_ids.append(node_id)
        self.flush_nodes()
        return inserted_ids

    # Relationships Table
    def insert_relationship(self, rel: dict):
        rel_id = rel.get("id") or str(uuid.uuid4())
        
        if self.use_supabase:
            payload = {
                "id": rel_id,
                "from_node_id": rel["from_node_id"],
                "to_node_id": rel["to_node_id"],
                "relationship": rel["relationship"],
                "confidence": rel.get("confidence", 0.5),
                "evidence": rel.get("evidence")
            }
            self.rels_queue.append(payload)
            if len(self.rels_queue) >= 500:
                self.flush_rels()
            return rel_id
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            
            # Check if relationship already exists
            cursor.execute(
                "SELECT id FROM relationships WHERE from_node_id = ? AND to_node_id = ? AND relationship = ?",
                (rel["from_node_id"], rel["to_node_id"], rel["relationship"])
            )
            row = cursor.fetchone()
            if row:
                rel_id = row[0]
            else:
                cursor.execute(
                    "INSERT INTO relationships (id, from_node_id, to_node_id, relationship, confidence, evidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        rel_id,
                        rel["from_node_id"],
                        rel["to_node_id"],
                        rel["relationship"],
                        rel.get("confidence", 0.5),
                        rel.get("evidence"),
                        rel.get("created_at") or datetime.utcnow().isoformat()
                    )
                )
                conn.commit()
            conn.close()
            return rel_id

    def insert_relationships_batch(self, rels_list: list):
        inserted_ids = []
        for rel in rels_list:
            if rel.get("from_node_id") and rel.get("to_node_id"):
                rel_id = self.insert_relationship(rel)
                inserted_ids.append(rel_id)
        self.flush_rels()
        return inserted_ids

    def flush_nodes(self):
        if not self.nodes_queue:
            return
        print(f"Flushing {len(self.nodes_queue)} nodes to Supabase...")
        # Deduplicate batch queue by ID, keeping the latest state of each node
        deduped = {}
        for node in self.nodes_queue:
            deduped[node["id"]] = node
        nodes_batch = list(deduped.values())
        try:
            self.client.table("nodes").upsert(nodes_batch, on_conflict="id").execute()
        except Exception as e:
            print(f"Error flushing nodes batch: {e}. Trying single inserts...")
            for node in nodes_batch:
                try:
                    self.client.table("nodes").upsert(node, on_conflict="id").execute()
                except Exception as ex:
                    print(f"Failed to insert node {node.get('title')}: {ex}")
        self.nodes_queue = []

    def flush_rels(self):
        # Always flush nodes first to ensure foreign keys exist
        self.flush_nodes()
        if not self.rels_queue:
            return
        print(f"Flushing {len(self.rels_queue)} relationships to Supabase...")
        # Deduplicate batch queue by ID, keeping the latest state of each relationship
        deduped = {}
        for rel in self.rels_queue:
            deduped[rel["id"]] = rel
        rels_batch = list(deduped.values())
        try:
            self.client.table("relationships").upsert(rels_batch, on_conflict="id").execute()
        except Exception as e:
            print(f"Error flushing relationships batch: {e}. Trying single inserts...")
            for rel in rels_batch:
                try:
                    self.client.table("relationships").upsert(rel, on_conflict="id").execute()
                except Exception as ex:
                    print(f"Failed to insert relationship: {ex}")
        self.rels_queue = []

    def flush(self):
        self.flush_nodes()
        self.flush_rels()

    # Query methods
    def get_node_by_external_id(self, external_id: str, node_type: str = None):
        if self.use_supabase:
            # Check memory cache first
            if external_id in self.external_id_to_id:
                node_id = self.external_id_to_id[external_id]
                return self.get_node_by_id(node_id)
                
            query = self.client.table("nodes").select("*").eq("external_id", external_id)
            if node_type:
                query = query.eq("node_type", node_type)
            res = query.execute()
            if res.data:
                # Cache it
                self.external_id_to_id[external_id] = res.data[0]["id"]
                return res.data[0]
            return None
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            if node_type:
                cursor.execute("SELECT * FROM nodes WHERE external_id = ? AND node_type = ?", (external_id, node_type))
            else:
                cursor.execute("SELECT * FROM nodes WHERE external_id = ?", (external_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                r = dict(row)
                r["tags"] = json.loads(r["tags"] or "[]")
                r["metadata"] = json.loads(r["metadata"] or "{}")
                r["embedding"] = json.loads(r["embedding"]) if r["embedding"] else None
                return r
            return None

    def get_node_by_id(self, node_id: str):
        if self.use_supabase:
            res = self.client.table("nodes").select("*").eq("id", node_id).execute()
            return res.data[0] if res.data else None
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM nodes WHERE id = ?", (node_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                r = dict(row)
                r["tags"] = json.loads(r["tags"] or "[]")
                r["metadata"] = json.loads(r["metadata"] or "{}")
                r["embedding"] = json.loads(r["embedding"]) if r["embedding"] else None
                return r
            return None

    def get_all_nodes(self, limit=1000):
        if self.use_supabase:
            if limit <= 1000:
                res = self.client.table("nodes").select("*").limit(limit).execute()
                data = res.data if res.data else []
            else:
                all_nodes = []
                offset = 0
                page_size = 1000
                while len(all_nodes) < limit:
                    current_limit = min(page_size, limit - len(all_nodes))
                    res = self.client.table("nodes").select("*").range(offset, offset + current_limit - 1).execute()
                    if not res.data:
                        break
                    all_nodes.extend(res.data)
                    if len(res.data) < current_limit:
                        break
                    offset += current_limit
                data = all_nodes
            
            # Parse embedding string if it is returned as a string
            for r in data:
                if r.get("embedding") and isinstance(r["embedding"], str):
                    try:
                        r["embedding"] = json.loads(r["embedding"])
                    except Exception:
                        r["embedding"] = [float(x) for x in r["embedding"].strip('[]{}').split(',') if x.strip()]
            return data
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM nodes LIMIT ?", (limit,))
            rows = [dict(r) for r in cursor.fetchall()]
            for r in rows:
                r["tags"] = json.loads(r["tags"] or "[]")
                r["metadata"] = json.loads(r["metadata"] or "{}")
                r["embedding"] = json.loads(r["embedding"]) if r["embedding"] else None
            conn.close()
            return rows

    def count_nodes(self):
        if self.use_supabase:
            res = self.client.table("nodes").select("id", count="exact").limit(1).execute()
            return res.count if res.count is not None else len(res.data)
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM nodes")
            count = cursor.fetchone()[0]
            conn.close()
            return count

    def count_relationships(self):
        if self.use_supabase:
            res = self.client.table("relationships").select("id", count="exact").limit(1).execute()
            return res.count if res.count is not None else len(res.data)
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM relationships")
            count = cursor.fetchone()[0]
            conn.close()
            return count

    # Job Logs
    def log_job(self, job_name: str, started_at: datetime, status: str = "running", rows_collected=0, rows_processed=0, error_message=None, notes=None):
        log_id = str(uuid.uuid4())
        payload = {
            "id": log_id,
            "job_name": job_name,
            "started_at": started_at.isoformat(),
            "status": status,
            "rows_collected": rows_collected,
            "rows_processed": rows_processed,
            "error_message": error_message,
            "notes": notes
        }
        
        if self.use_supabase:
            try:
                self.client.table("job_logs").insert(payload).execute()
            except Exception as e:
                print(f"Error logging job to Supabase: {e}")
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO job_logs (id, job_name, started_at, status, rows_collected, rows_processed, error_message, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (log_id, job_name, payload["started_at"], status, rows_collected, rows_processed, error_message, notes)
            )
            conn.commit()
            conn.close()
        return log_id

    def update_job_log(self, log_id, finished_at: datetime, status, rows_collected=0, rows_processed=0, error_message=None, notes=None):
        payload = {
            "finished_at": finished_at.isoformat(),
            "status": status,
            "rows_collected": rows_collected,
            "rows_processed": rows_processed,
            "error_message": error_message,
            "notes": notes
        }
        
        if self.use_supabase:
            try:
                self.client.table("job_logs").update(payload).eq("id", log_id).execute()
            except Exception as e:
                print(f"Error updating job log in Supabase: {e}")
        else:
            conn = self._get_sqlite_conn()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE job_logs SET finished_at = ?, status = ?, rows_collected = ?, rows_processed = ?, error_message = ?, notes = ? WHERE id = ?",
                (payload["finished_at"], status, rows_collected, rows_processed, error_message, notes, log_id)
            )
            conn.commit()
            conn.close()
