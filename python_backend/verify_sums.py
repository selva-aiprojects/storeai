import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        targets = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
        print(f"{'SKU':<15} | {'Product Qty':<12} | {'Stock(WH) Sum':<15} | {'Batch Sum':<12}")
        print("-" * 60)
        
        for sku in targets:
            p = await conn.fetchrow('SELECT id, "stockQuantity" FROM "Product" WHERE sku = $1', sku)
            if not p:
                print(f"{sku:<15} | NOT FOUND")
                continue
            
            p_id = p['id']
            p_qty = p['stockQuantity']
            
            s_sum = await conn.fetchval('SELECT SUM(quantity) FROM "Stock" WHERE "productId" = $1', p_id) or 0
            b_sum = await conn.fetchval('SELECT SUM("quantityAvailable") FROM "ProductBatch" WHERE "productId" = $1', p_id) or 0
            
            print(f"{sku:<15} | {p_qty:<12} | {s_sum:<15} | {b_sum:<12}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
