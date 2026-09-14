import os
import json
import tarfile
import httpx
import sqlite3
from datetime import datetime
from db_client import DBClient

def run():
    db = DBClient()
    job_id = db.log_job("backup", datetime.utcnow(), status="running")
    
    try:
        backup_dir = "backups"
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
            
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
        tar_filename = f"cyber-tree-backup-{timestamp}.tar.gz"
        tar_filepath = os.path.join(backup_dir, tar_filename)
        
        tables = ["nodes", "relationships", "predictions", "sources", "job_logs"]
        dumped_files = []
        node_count = 0
        
        for table in tables:
            json_filepath = os.path.join(backup_dir, f"{table}.json")
            
            # Fetch data from DB
            if db.use_supabase:
                res = db.client.table(table).select("*").execute()
                data = res.data
            else:
                conn = sqlite3.connect(db.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(f"SELECT * FROM {table}")
                data = [dict(r) for r in cursor.fetchall()]
                conn.close()
                
            if table == "nodes":
                node_count = len(data)
                
            with open(json_filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
                
            dumped_files.append(json_filepath)
            
        # Compress
        print(f"Compressing tables into {tar_filepath}...")
        with tarfile.open(tar_filepath, "w:gz") as tar:
            for filepath in dumped_files:
                tar.add(filepath, arcname=os.path.basename(filepath))
                
        # Clean up individual JSON files
        for filepath in dumped_files:
            os.remove(filepath)
            
        # Get size
        backup_size = os.path.getsize(tar_filepath)
        print(f"Backup file created: {tar_filepath} ({backup_size} bytes)")
        
        # Upload to GitHub release if GITHUB_TOKEN and GITHUB_REPOSITORY are set
        github_token = os.getenv("GITHUB_TOKEN")
        github_repo = os.getenv("GITHUB_REPOSITORY") # e.g. "username/cyber-tree"
        
        uploaded = False
        if github_token and github_repo:
            tag = f"BACKUP-{datetime.utcnow().strftime('%Y-%m')}"
            headers = {
                "Authorization": f"token {github_token}",
                "Accept": "application/vnd.github.v3+json"
            }
            client = httpx.Client(headers=headers)
            
            # Check if release already exists
            release_url = f"https://api.github.com/repos/{github_repo}/releases/tags/{tag}"
            print(f"Checking for GitHub release {tag}...")
            r = client.get(release_url)
            
            if r.status_code == 404:
                # Create release
                print(f"Creating new GitHub release {tag}...")
                create_url = f"https://api.github.com/repos/{github_repo}/releases"
                payload = {
                    "tag_name": tag,
                    "target_commitish": "main",
                    "name": f"Backup {datetime.utcnow().strftime('%B %Y')}",
                    "body": f"Automated database backup for Cyber Tree system. Generated on {datetime.utcnow().isoformat()}.",
                    "draft": False,
                    "prerelease": False
                }
                r = client.post(create_url, json=payload)
                r.raise_for_status()
                release_data = r.json()
            else:
                r.raise_for_status()
                release_data = r.json()
                
            release_id = release_data["id"]
            
            # Upload asset
            upload_url = f"https://uploads.github.com/repos/{github_repo}/releases/{release_id}/assets?name={tar_filename}"
            print(f"Uploading backup asset to GitHub release...")
            with open(tar_filepath, "rb") as f:
                r = client.post(
                    upload_url,
                    content=f.read(),
                    headers={"Content-Type": "application/gzip"}
                )
            r.raise_for_status()
            print("Successfully uploaded backup asset to GitHub release!")
            uploaded = True
        else:
            print("GITHUB_TOKEN or GITHUB_REPOSITORY not set. Skipping GitHub Release upload.")
            
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            rows_collected=node_count,
            notes=f"Backup file size: {backup_size} bytes. Nodes backed up: {node_count}. Uploaded to GitHub: {uploaded}."
        )
        
    except Exception as e:
        print(f"Error during backup job: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
