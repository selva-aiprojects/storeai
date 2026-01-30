import asyncio
from services.db import db

async def diagnose():
    print("=== TENANT DATA DIAGNOSIS ===\n")
    
    # Check tenants
    print("1. Available Tenants:")
    tenants = await db.fetch_rows('SELECT "id", "slug", "name" FROM "Tenant"')
    for t in tenants:
        print(f"   - {dict(t)['slug']} (ID: {dict(t)['id']})")
    
    # Check products by tenant
    print("\n2. Products by Tenant:")
    product_counts = await db.fetch_rows('SELECT COUNT(*) as cnt, "tenantId" FROM "Product" GROUP BY "tenantId"')
    for p in product_counts:
        d = dict(p)
        print(f"   - Tenant {d['tenantId']}: {d['cnt']} products")
    
    # Check if storeai has products
    print("\n3. StoreAI Tenant Products:")
    storeai_products = await db.fetch_rows('SELECT COUNT(*) as cnt FROM "Product" WHERE "tenantId" = \'storeai\'')
    count = dict(storeai_products[0])['cnt'] if storeai_products else 0
    print(f"   - Products for 'storeai': {count}")
    
    # Sample product
    print("\n4. Sample Product:")
    sample = await db.fetch_rows('SELECT "name", "tenantId", "stockQuantity", "lowStockThreshold" FROM "Product" LIMIT 1')
    if sample:
        s = dict(sample[0])
        print(f"   - {s['name']} (Tenant: {s['tenantId']}, Stock: {s['stockQuantity']}/{s['lowStockThreshold']})")

asyncio.run(diagnose())
