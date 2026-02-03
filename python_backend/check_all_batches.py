import asyncio
from services.db import db

async def check_all_batches():
    print("--- ALL POSITIVE QUANTITY BATCHES ---")
    
    batches = await db.fetch_rows("""
        SELECT pb.*, p.name, p.sku, t.slug as tenant_slug
        FROM "ProductBatch" pb
        JOIN "Product" p ON pb."productId" = p.id
        JOIN "Tenant" t ON p."tenantId" = t.id
        WHERE pb."balanceQuantity" > 0
    """)
    
    if not batches:
        print("No batches found with balanceQuantity > 0.")
    else:
        for b in batches:
            print(f"Tenant: {b['tenant_slug']:15} | SKU: {b['sku']:10} | Qty: {b['balanceQuantity']:5} | Batch: {b.get('batchNumber', 'N/A')} | Prod: {b['name']}")

if __name__ == "__main__":
    asyncio.run(check_all_batches())
