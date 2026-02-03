import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def verify():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch('''
            SELECT p.name, p.sku, p."stockQuantity", c.name as cat_name
            FROM "Product" p
            LEFT JOIN "Category" c ON p."categoryId" = c.id
            WHERE p."tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'storeai')
            AND p."isDeleted" = false
        ''')
        print(f"Current products for storeai ({len(rows)}):")
        for r in rows:
            print(f"- {r['name']} ({r['sku']}): {r['stockQuantity']} pcs in {r['cat_name']}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(verify())
