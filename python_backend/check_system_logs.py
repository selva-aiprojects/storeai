import asyncio
from services.db import db
from datetime import datetime
import json

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return super().default(obj)

async def check_logs():
    print("--- ACTIVITY & AUDIT LOG CHECK ---")
    
    # Check ActivityLog
    activities = await db.fetch_rows('SELECT * FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT 10')
    print("\n[RECENT ACTIVITY LOGS]")
    for act in activities:
        print(f"[{act['createdAt']}] {act.get('action', 'N/A')} | {act.get('entityType', 'N/A')} | {act.get('description', 'N/A')}")
        
    # Check AuditLog
    audits = await db.fetch_rows('SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10')
    print("\n[RECENT AUDIT LOGS]")
    for aud in audits:
        print(f"[{aud['createdAt']}] {aud.get('action', 'N/A')} | {aud.get('tableName', 'N/A')} | {aud.get('recordId', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(check_logs())
