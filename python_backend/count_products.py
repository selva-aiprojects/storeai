
import asyncio
from services.db import db
import json

async def count_products():
    print("--- PRODUCT COUNTS BY TENANT ---")
    query = 'SELECT "tenantId", COUNT(*) as count FROM "Product" GROUP BY "tenantId"'
    try:
        rows = await db.fetch_rows(query)
        for row in rows:
            print(f"Tenant: {row['tenantId']} | Count: {row['count']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(count_products())
