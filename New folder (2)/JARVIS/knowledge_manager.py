# ════════════════════════════════════════
# FILE: knowledge_manager.py
# PURPOSE: Offline-first ChromaDB knowledge ingestion, retrieval, and source catalog.
# MODIFIES: memory/knowledge/, memory/sources.db
# ════════════════════════════════════════

from __future__ import annotations

import csv
import hashlib
import logging
import os
import sqlite3
from datetime import datetime
from typing import Any

import requests
from bs4 import BeautifulSoup

from config_loader import config_manager, rel_path
from memory_guard import begin_model_call, end_model_call

log = logging.getLogger("jarvis.knowledge")
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")


class KnowledgeManager:
    def __init__(self, knowledge_dir: str | None = None, sources_db: str | None = None):
        self.knowledge_dir = knowledge_dir or rel_path(config_manager.get("memory.knowledge_dir", "memory/knowledge"))
        self.sources_db = sources_db or rel_path(config_manager.get("memory.sources_db", "memory/sources.db"))
        os.makedirs(self.knowledge_dir, exist_ok=True)
        os.makedirs(os.path.dirname(self.sources_db), exist_ok=True)
        self.collection = None
        self.status = "loading"
        self._init_sources_db()
        self._init_chroma()

    def _connect_sources(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.sources_db, timeout=30, check_same_thread=False)
        conn.execute("PRAGMA busy_timeout=30000")
        conn.execute("PRAGMA journal_mode=WAL")
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sources_db(self) -> None:
        with self._connect_sources() as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS sources "
                "(id TEXT PRIMARY KEY, name TEXT, category TEXT, chunk_count INTEGER, ingested_at TEXT)"
            )
            conn.commit()

    def _init_chroma(self) -> None:
        try:
            import chromadb
            from chromadb.config import Settings

            client = chromadb.PersistentClient(
                path=self.knowledge_dir,
                settings=Settings(anonymized_telemetry=False),
            )
            self.collection = client.get_or_create_collection(name="jarvis_knowledge", embedding_function=None)
            self.status = "ready"
            log.info("ChromaDB knowledge collection ready.")
        except Exception as exc:
            self.status = "error"
            self.collection = None
            log.error("ChromaDB initialization failed: %s", exc, exc_info=True)

    def ingest_text(self, text: str, source: str, category: str = "general") -> int:
        clean_text = " ".join(str(text).split())
        if not clean_text:
            return 0
        chunks = self._chunk_text(clean_text, 512, 64)
        ids: list[str] = []
        documents: list[str] = []
        metadatas: list[dict[str, Any]] = []
        embeddings: list[list[float]] = []
        ingested_at = datetime.utcnow().isoformat(timespec="seconds")
        for index, chunk in enumerate(chunks):
            chunk_id = hashlib.sha256(f"{source}:{index}:{chunk[:64]}".encode("utf-8")).hexdigest()
            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append({"source": source, "category": category, "ingested_at": ingested_at, "chunk_index": index})
            embeddings.append(self._embed(chunk))
        if self.collection:
            try:
                self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
            except Exception as exc:
                log.error("Chroma upsert failed: %s", exc, exc_info=True)
        self._save_source(source, category, len(chunks), ingested_at)
        log.info("Ingested %d chunks from %s", len(chunks), source)
        return len(chunks)

    def ingest_file(self, path: str) -> int:
        try:
            resolved = self._resolve_file(path)
            if not resolved:
                return 0
            ext = os.path.splitext(resolved)[1].lower()
            if ext in {".txt", ".md", ".json"}:
                with open(resolved, "r", encoding="utf-8", errors="ignore") as handle:
                    text = handle.read()
            elif ext == ".csv":
                text = self._read_csv(resolved)
            elif ext == ".pdf":
                text = self._read_pdf(resolved)
            elif ext == ".docx":
                text = self._read_docx(resolved)
            else:
                with open(resolved, "r", encoding="utf-8", errors="ignore") as handle:
                    text = handle.read()
            return self.ingest_text(text, os.path.basename(resolved), ext.lstrip(".") or "file")
        except Exception as exc:
            log.error("File ingestion failed: %s", exc, exc_info=True)
            return 0

    def ingest_url(self, url: str) -> int:
        try:
            response = requests.get(url, timeout=10, headers={"User-Agent": "JARVIS/3.0"})
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "aside", "form"]):
                tag.decompose()
            main = soup.find("main") or soup.find("article") or soup.body or soup
            text = main.get_text(" ", strip=True)
            return self.ingest_text(text, url, "web")
        except Exception as exc:
            log.error("URL ingestion failed for %s: %s", url, exc, exc_info=True)
            return 0

    def query_knowledge(self, question: str, top_k: int = 5) -> list[dict[str, Any]]:
        if not self.collection:
            return []
        try:
            embedding = self._embed(question)
            results = self.collection.query(query_embeddings=[embedding], n_results=top_k)
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0] if results.get("distances") else [0] * len(docs)
            return [
                {"text": doc, "metadata": meta or {}, "score": distance}
                for doc, meta, distance in zip(docs, metas, distances)
                if doc
            ]
        except Exception as exc:
            log.error("Knowledge query failed: %s", exc, exc_info=True)
            return []

    def search_web_and_learn(self, query: str) -> str:
        try:
            url = "https://duckduckgo.com/html/"
            response = requests.post(url, data={"q": query}, timeout=10, headers={"User-Agent": "JARVIS/3.0"})
            soup = BeautifulSoup(response.text, "html.parser")
            links = []
            for anchor in soup.select("a.result__a"):
                href = anchor.get("href")
                if href and href.startswith("http"):
                    links.append(href)
                if len(links) >= 3:
                    break
            for link in links:
                self.ingest_url(link)
            chunks = self.query_knowledge(query, 5)
            return "\n".join(item["text"] for item in chunks)
        except Exception as exc:
            log.error("Search web and learn failed: %s", exc, exc_info=True)
            return ""

    def list_sources(self) -> list[dict[str, Any]]:
        with self._connect_sources() as conn:
            rows = conn.execute("SELECT * FROM sources ORDER BY ingested_at DESC").fetchall()
        return [dict(row) for row in rows]

    def delete_source(self, source_id: str) -> bool:
        try:
            with self._connect_sources() as conn:
                conn.execute("DELETE FROM sources WHERE id=?", (source_id,))
                conn.commit()
            return True
        except Exception as exc:
            log.error("Delete source failed: %s", exc, exc_info=True)
            return False

    def total_chunks(self) -> int:
        try:
            if self.collection:
                return int(self.collection.count())
        except Exception as exc:
            log.error("Chunk count failed: %s", exc, exc_info=True)
        return 0

    def _embed(self, text: str) -> list[float]:
        try:
            host = config_manager.get("brain.ollama_host", "http://127.0.0.1:11434").rstrip("/")
            begin_model_call()
            try:
                response = requests.post(
                    f"{host}/api/embeddings",
                    json={"model": "nomic-embed-text", "prompt": text},
                    timeout=30,
                )
                response.raise_for_status()
                embedding = response.json().get("embedding")
            finally:
                end_model_call()
            if isinstance(embedding, list) and embedding:
                return [float(value) for value in embedding]
        except Exception as exc:
            log.error("Ollama embedding failed, using hash embedding: %s", exc)
        return self._hash_embedding(text)

    @staticmethod
    def _hash_embedding(text: str, dims: int = 768) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        return [((digest[i % len(digest)] / 255.0) * 2.0) - 1.0 for i in range(dims)]

    @staticmethod
    def _chunk_text(text: str, chunk_tokens: int, overlap: int) -> list[str]:
        words = text.split()
        chunks = []
        step = max(1, chunk_tokens - overlap)
        for start in range(0, len(words), step):
            chunk = " ".join(words[start : start + chunk_tokens]).strip()
            if chunk:
                chunks.append(chunk)
        return chunks

    def _save_source(self, name: str, category: str, chunk_count: int, ingested_at: str) -> None:
        source_id = hashlib.sha256(name.encode("utf-8")).hexdigest()
        with self._connect_sources() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO sources(id, name, category, chunk_count, ingested_at) VALUES (?, ?, ?, ?, ?)",
                (source_id, name, category, chunk_count, ingested_at),
            )
            conn.commit()

    @staticmethod
    def _resolve_file(path: str) -> str:
        candidates = [
            path,
            os.path.join(os.path.expanduser("~"), path),
            rel_path(path),
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                return os.path.abspath(candidate)
        return ""

    @staticmethod
    def _read_csv(path: str) -> str:
        rows = []
        with open(path, "r", encoding="utf-8", errors="ignore", newline="") as handle:
            for row in csv.reader(handle):
                rows.append(" | ".join(row))
        return "\n".join(rows)

    @staticmethod
    def _read_pdf(path: str) -> str:
        from pdfminer.high_level import extract_text

        return extract_text(path)

    @staticmethod
    def _read_docx(path: str) -> str:
        from docx import Document

        doc = Document(path)
        return "\n".join(paragraph.text for paragraph in doc.paragraphs)
