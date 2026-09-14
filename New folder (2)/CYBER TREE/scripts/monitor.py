import os
import json
import sqlite3
from datetime import datetime, timedelta
from db_client import DBClient

# Expected run intervals in hours
JOB_WINDOWS = {
    "collect": 8,     # Runs every 6 hours, window 8h
    "process": 14,    # Runs every 12 hours, window 14h
    "relate": 26,     # Runs every 24 hours, window 26h
    "maintain": 180,  # Runs weekly, window 7.5 days
}

def run():
    db = DBClient()
    job_id = db.log_job("monitor", datetime.utcnow(), status="running")
    
    report = {
        "timestamp": datetime.utcnow().isoformat(),
        "status": "healthy",
        "jobs": {},
        "alerts": []
    }
    
    try:
        # Check jobs
        job_names = ["collect", "process", "relate", "maintain", "ingest_mitre", "ingest_nvd", "ingest_cisa", "ingest_capec", "ingest_cwe"]
        
        for name in job_names:
            last_run = None
            
            if db.use_supabase:
                res = db.client.table("job_logs").select("*").eq("job_name", name).order("started_at", desc=True).limit(1).execute()
                if res.data:
                    last_run = res.data[0]
            else:
                conn = sqlite3.connect(db.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM job_logs WHERE job_name = ? ORDER BY started_at DESC LIMIT 1", (name,))
                row = cursor.fetchone()
                if row:
                    last_run = dict(row)
                conn.close()
                
            if not last_run:
                report["jobs"][name] = {"status": "never_run", "last_run": None}
                # Seeding jobs can be never run if not triggered, but core workflows should run
                if name in JOB_WINDOWS:
                    report["alerts"].append(f"Job {name} has never run.")
                    report["status"] = "degraded"
                continue
                
            started_at = datetime.fromisoformat(last_run["started_at"].replace("Z", "+00:00")).replace(tzinfo=None)
            status = last_run["status"]
            
            # Check if it failed
            if status == "failed":
                report["alerts"].append(f"Job {name} failed on its last run (Started: {started_at.isoformat()}). Error: {last_run.get('error_message')}")
                report["status"] = "degraded"
                
            # Check window
            if name in JOB_WINDOWS:
                window_hours = JOB_WINDOWS[name]
                if datetime.utcnow() - started_at > timedelta(hours=window_hours):
                    report["alerts"].append(f"Job {name} hasn't run in the expected window of {window_hours} hours. Last run: {started_at.isoformat()}.")
                    report["status"] = "degraded"
                    
            report["jobs"][name] = {
                "status": status,
                "last_run": started_at.isoformat(),
                "rows_collected": last_run.get("rows_collected", 0),
                "rows_processed": last_run.get("rows_processed", 0),
                "error_message": last_run.get("error_message")
            }
            
        # Write status file to public/status.json for Next.js to serve
        # If public dir doesn't exist, we create it
        public_dir = "public"
        if not os.path.exists(public_dir):
            os.makedirs(public_dir)
            
        status_path = os.path.join(public_dir, "status.json")
        with open(status_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
            
        print(f"Health check completed. System status: {report['status'].upper()}. Alerts: {len(report['alerts'])}")
        
        # Send Slack Webhook if configured and status is degraded
        webhook_url = os.getenv("ALERT_WEBHOOK_URL")
        if webhook_url and report["status"] == "degraded" and report["alerts"]:
            print("Sending alert notifications to Slack...")
            import httpx
            payload = {
                "text": f"🚨 *CYBER TREE Pipeline Alert* 🚨\nSystem status: *DEGRADED*\n\n" + \
                        "\n".join([f"• {alert}" for alert in report["alerts"]])
            }
            try:
                resp = httpx.post(webhook_url, json=payload, timeout=10.0)
                if resp.status_code == 200:
                    print("Slack alert sent successfully.")
                else:
                    print(f"Failed to send Slack alert. Status: {resp.status_code}, Response: {resp.text}")
            except Exception as se:
                print(f"Error sending Slack notification: {se}")
        
        # Log completion
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="success",
            notes=f"System status: {report['status']}. Alerts: {len(report['alerts'])}"
        )
        
    except Exception as e:
        print(f"Error during health monitoring: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
