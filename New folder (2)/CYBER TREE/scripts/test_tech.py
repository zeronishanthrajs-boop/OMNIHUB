import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"DEBUG URL: {SUPABASE_URL}")

def connect_supabase():
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    client = connect_supabase()
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    # Query nodes of type 'technology'
    res = (
        client.table("nodes")
        .select("id, title, created_at, tags")
        .eq("node_type", "technology")
        .execute()
    )
    
    techs = res.data or []
    print(f"Found {len(techs)} technologies:")
    for t in techs[:10]:
        print(f"- {t['title']} (ID: {t['id']}, Created: {t['created_at']})")

if __name__ == "__main__":
    main()
