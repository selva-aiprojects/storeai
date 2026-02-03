import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        keywords = ['ProLiant', 'Switch', 'Server', 'Catalyst']
        print(f"{'SKU':<15} | {'Tenant':<15} | {'Qty':<5} | {'Name'}")
        print("-" * 60)
        
        for k in keywords:
            rows = await conn.fetch(f"""
                SELECT p.sku, p.name, p."stockQuantity", t.slug
                FROM "Product" p
                JOIN "Tenant" t ON p."tenantId" = t.id
                WHERE p.name ILIKE '%{k}%'
            """)
            for r in rows:
                print(f"{r['sku']:<15} | {r['slug']:<15} | {r['stockQuantity']:<5} | {r['name']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
