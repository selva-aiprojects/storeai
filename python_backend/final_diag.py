import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Tenants
        tenants = await conn.fetch('SELECT id, name, slug FROM "Tenant"')
        print("=== TENANTS ===")
        t_map = {}
        for r in tenants:
            t_map[r['id']] = r['slug']
            print(f"ID: {r['id']} | Slug: {r['slug']} | Name: {r['name']}")
            
        # Products with stock > 0
        products = await conn.fetch('SELECT id, name, sku, "stockQuantity", "tenantId" FROM "Product" WHERE "stockQuantity" > 0')
        print("\n=== PRODUCTS WITH STOCK > 0 ===")
        if not products:
            print("No products with stock > 0")
        else:
            for p in products:
                slug = t_map.get(p['tenantId'], "Unknown")
                print(f"Tenant: {slug:15} | SKU: {p['sku']:10} | Qty: {p['stockQuantity']:5} | Name: {p['name']}")
                
        # Products matching user screenshot
        targets = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
        print("\n=== TARGET PRODUCTS STATUS ===")
        for sku in targets:
            rows = await conn.fetch('SELECT id, name, "stockQuantity", "tenantId" FROM "Product" WHERE sku = $1', sku)
            if not rows:
                print(f"SKU: {sku} | NOT FOUND")
            for r in rows:
                slug = t_map.get(r['tenantId'], "Unknown")
                print(f"SKU: {sku:10} | Tenant: {slug:15} | Qty: {r['stockQuantity']:5} | Name: {r['name']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
