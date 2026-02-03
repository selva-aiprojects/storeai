import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def trace(sku):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print(f"\n=== TRACE: {sku} ===")
        p = await conn.fetchrow('SELECT id, "stockQuantity" FROM "Product" WHERE sku = $1', sku)
        if not p:
            print("NOT FOUND")
            return
        
        print(f"Product.stockQuantity: {p['stockQuantity']}")
        
        stocks = await conn.fetch('SELECT quantity, "warehouseId", "batchNumber" FROM "Stock" WHERE "productId" = $1', p['id'])
        print(f"Stock Table rows: {len(stocks)}")
        for s in stocks:
            print(f"  Warehouse: {s['warehouseId']} | Batch: {s['batchNumber']} | Qty: {s['quantity']}")
            
        batches = await conn.fetch('SELECT "batchNumber", "quantityAvailable" FROM "ProductBatch" WHERE "productId" = $1', p['id'])
        print(f"ProductBatch rows: {len(batches)}")
        for b in batches:
            print(f"  Batch: {b['batchNumber']} | Qty: {b['quantityAvailable']}")

    finally:
        await conn.close()

async def main():
    for sku in ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']:
        await trace(sku)

if __name__ == "__main__":
    asyncio.run(main())
