import asyncio
from services.db import db

async def check_all_stock():
    print("--- ALL POSITIVE STOCK PRODUCTS ---")
    
    # Get tenants
    tenants = await db.fetch_rows('SELECT id, slug, name FROM "Tenant"')
    tenant_map = {t['id']: t['slug'] for t in tenants}
    
    # Get products with stock > 0
    products = await db.fetch_rows("""
        SELECT p.name, p.sku, p."stockQuantity", p."tenantId", c.name as category
        FROM "Product" p
        JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."stockQuantity" > 0
    """)
    
    if not products:
        print("No products found with stock > 0 in Product table.")
    else:
        for p in products:
            slug = tenant_map.get(p['tenantId'], "Unknown")
            print(f"Tenant: {slug:20} | SKU: {p['sku']:10} | Qty: {p['stockQuantity']:5} | Name: {p['name']}")

    # Check for TARGET SKUs specifically in ANY tenant regardless of stock
    print("\n--- TARGET SKU SEARCH ---")
    target_skus = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
    for sku in target_skus:
        p_row = await db.fetch_rows('SELECT p.id, p.name, p."stockQuantity", p."tenantId" FROM "Product" p WHERE p.sku = $1', sku)
        if p_row:
            for p in p_row:
                slug = tenant_map.get(p['tenantId'], "Unknown")
                print(f"SKU: {sku:10} | Tenant: {slug:20} | Stock: {p['stockQuantity']:5} | Name: {p['name']}")
        else:
            print(f"SKU: {sku:10} | NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_all_stock())
