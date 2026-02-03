import asyncio
from services.db import db
from decimal import Decimal

async def diagnose():
    print("--- FULL ERP DIAGNOSTIC ---")
    
    # 1. Tenants
    tenants = await db.fetch_rows('SELECT id, slug, name FROM "Tenant"')
    print("\n[TENANTS]")
    tenant_map = {}
    for t in tenants:
        tenant_map[t['id']] = t['slug']
        print(f"Slug: {t['slug']:20} | ID: {t['id']} | Name: {t['name']}")
        
    # 2. Product Count by Tenant
    p_counts = await db.fetch_rows('SELECT "tenantId", COUNT(*) as count FROM "Product" GROUP BY "tenantId"')
    print("\n[PRODUCT COUNTS BY TENANT]")
    for p in p_counts:
        slug = tenant_map.get(p['tenantId'], "Unknown")
        print(f"Slug: {slug:20} | Products: {p['count']}")
        
    # 3. Stock Summary by Tenant
    s_counts = await db.fetch_rows('SELECT "tenantId", SUM("stockQuantity") as total_stock FROM "Product" GROUP BY "tenantId"')
    print("\n[TOTAL STOCK BY TENANT]")
    for s in s_counts:
        slug = tenant_map.get(s['tenantId'], "Unknown")
        print(f"Slug: {slug:20} | Stock: {s['total_stock']}")
        
    # 4. Check for items in the screenshot (SKU: SW-001, SRV-001, NET-C9200, SRV-DL38D)
    target_skus = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
    print("\n[TARGET PRODUCT INSPECTION]")
    for sku in target_skus:
        p_row = await db.fetch_rows('SELECT id, name, "stockQuantity", "tenantId" FROM "Product" WHERE sku = $1', sku)
        if p_row:
            p = p_row[0]
            slug = tenant_map.get(p['tenantId'], "Unknown")
            print(f"SKU: {sku:10} | Name: {p['name']:30} | Stock: {p['stockQuantity']:5} | Tenant: {slug}")
            
            # Check StockLedger for this product
            ledger = await db.fetch_rows('SELECT SUM("quantityIn") as total_in, SUM("quantityOut") as total_out FROM "StockLedger" WHERE "productId" = $1', p['id'])
            if ledger:
                l = ledger[0]
                print(f"  -> Ledger: IN={l['total_in'] or 0}, OUT={l['total_out'] or 0}")
        else:
            print(f"SKU: {sku:10} | NOT FOUND")

if __name__ == "__main__":
    asyncio.run(diagnose())
