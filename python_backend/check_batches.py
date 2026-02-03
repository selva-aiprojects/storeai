import asyncio
from services.db import db

async def check_batches():
    print("--- PRODUCT BATCH CHECK ---")
    target_skus = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
    
    for sku in target_skus:
        p_row = await db.fetch_rows('SELECT id, name FROM "Product" WHERE sku = $1', sku)
        if p_row:
            p = p_row[0]
            batches = await db.fetch_rows('SELECT * FROM "ProductBatch" WHERE "productId" = $1', p['id'])
            print(f"\nSKU: {sku} | Name: {p['name']}")
            if batches:
                for b in batches:
                    print(f"  Batch: {b.get('batchNumber', 'N/A')} | Qty: {b.get('quantity', 0)} | Expiry: {b.get('expiryDate', 'N/A')}")
            else:
                print("  No batches found.")
        else:
            print(f"\nSKU: {sku} | NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_batches())
