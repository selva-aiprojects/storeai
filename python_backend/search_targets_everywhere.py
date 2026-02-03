import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        targets = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL380', 'SRV-DL38D']
        print(f"{'SKU':<15} | {'Tenant':<15} | {'Qty':<5} | {'Name'}")
        print("-" * 60)
        
        rows = await conn.fetch("""
            SELECT p.sku, p.name, p."stockQuantity", t.slug
            FROM "Product" p
            JOIN "Tenant" t ON p."tenantId" = t.id
            WHERE p.sku = ANY($1)
        """, targets)
        
        for r in rows:
            print(f"{r['sku']:<15} | {r['slug']:<15} | {r['stockQuantity']:<5} | {r['name']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
