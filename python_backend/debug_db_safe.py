import asyncio
import os
import json
from services.db import db
from dotenv import load_dotenv

load_dotenv()

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        return str(obj)

async def list_tenants():
    await db.connect()
    try:
        tenants = await db.fetch_rows('SELECT "id", "name", "slug" FROM "Tenant"')
        products = await db.fetch_rows('SELECT "tenantId", COUNT(*) as count FROM "Product" GROUP BY "tenantId"')
        
        output = {
            "tenants": [dict(t) for t in tenants],
            "product_counts": [dict(p) for p in products]
        }
        
        with open("db_output_safe.txt", "w", encoding="utf-8") as f:
            json.dump(output, f, cls=CustomEncoder, indent=2)
            
        print("Done writing db_output_safe.txt")

    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(list_tenants())
