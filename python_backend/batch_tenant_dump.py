import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import json

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 1. Tenants to file
        tenants = await conn.fetch('SELECT id, slug, name FROM "Tenant"')
        with open('tenants_list.txt', 'w') as f:
            for r in tenants:
                f.write(f"{r['id']} | {r['slug']} | {r['name']}\n")
        
        # 2. Batches with quantityAvailable > 0
        batches = await conn.fetch("""
            SELECT pb.*, p.name as prod_name, p.sku
            FROM "ProductBatch" pb
            JOIN "Product" p ON pb."productId" = p.id
            WHERE pb."quantityAvailable" > 0
        """)
        print(f"Found {len(batches)} batches with available quantity.")
        with open('positive_batches.txt', 'w') as f:
            for b in batches:
                f.write(f"SKU: {b['sku']} | Batch: {b['batchNumber']} | Qty: {b['quantityAvailable']} | Prod: {b['prod_name']}\n")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
