import asyncio
from services.db import db
import json
from datetime import datetime

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

async def list_tenants():
    try:
        rows = await db.fetch_rows('SELECT id, name, slug FROM "Tenant"')
        results = [dict(row) for row in rows]
        print("--- TENANTS ---")
        for res in results:
            print(f"ID: {res['id']} | Name: {res['name']} | Slug: {res['slug']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_tenants())
