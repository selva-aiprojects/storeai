import asyncpg
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('main/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

async def check_data():
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("=" * 60)
    print("TENANT CHECK")
    print("=" * 60)
    
    # Check all tenants
    tenants = await conn.fetch('SELECT id, name, slug, status FROM "Tenant"')
    print(f"\nFound {len(tenants)} tenant(s):")
    for t in tenants:
        print(f"  - ID: {t['id']}")
        print(f"    Name: {t['name']}")
        print(f"    Slug: {t['slug']}")
        print(f"    Status: {t['status']}")
        print()
    
    print("=" * 60)
    print("PRODUCT CHECK")
    print("=" * 60)
    
    # Check products per tenant
    for t in tenants:
        products = await conn.fetch(
            'SELECT id, name, sku, "tenantId" FROM "Product" WHERE "tenantId" = $1 AND "isDeleted" = false LIMIT 5',
            t['id']
        )
        print(f"\nTenant '{t['name']}' ({t['slug']}) has {len(products)} products:")
        for p in products:
            print(f"  - {p['name']} (SKU: {p['sku']})")
    
    print("\n" + "=" * 60)
    print("STOCK CHECK")
    print("=" * 60)
    
    # Check stock levels
    for t in tenants:
        stock = await conn.fetch(
            'SELECT p.name, s.quantity FROM "Stock" s JOIN "Product" p ON s."productId" = p.id WHERE p."tenantId" = $1 LIMIT 5',
            t['id']
        )
        print(f"\nTenant '{t['name']}' stock levels:")
        for s in stock:
            print(f"  - {s['name']}: {s['quantity']} units")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_data())
