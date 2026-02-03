import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("--- TARGET SKU STATUS ---")
        targets = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
        for sku in targets:
            p = await conn.fetchrow('SELECT id, name, "stockQuantity" FROM "Product" WHERE sku = $1', sku)
            if p:
                print(f"SKU: {sku:10} | Name: {p['name']:30} | Stock: {p['stockQuantity']}")
                # Check Batch
                batches = await conn.fetch('SELECT "batchNumber", "quantityAvailable" FROM "ProductBatch" WHERE "productId" = $1', p['id'])
                for b in batches:
                    print(f"  Batch: {b['batchNumber']} | Avail: {b['quantityAvailable']}")
            else:
                print(f"SKU: {sku:10} | NOT FOUND")

        print("\n--- PRODUCTS WITH POSITIVE STOCK ---")
        rows = await conn.fetch("""
            SELECT p.name, p.sku, p."stockQuantity", t.slug 
            FROM "Product" p 
            JOIN "Tenant" t ON p."tenantId" = t.id 
            WHERE p."stockQuantity" > 0
        """)
        for r in rows:
            print(f"T: {r['slug']:15} | SKU: {r['sku']:10} | Qty: {r['stockQuantity']:5} | Name: {r['name']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
