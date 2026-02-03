import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Check all products in s-v1770087734 tenant (dcb8bb0f-71ae-4843-b1e3-e8e24dbe8882)
        tenant_id = 'dcb8bb0f-71ae-4843-b1e3-e8e24dbe8882'
        rows = await conn.fetch('SELECT p.name, p.sku, p."stockQuantity", c.name as cat_name FROM "Product" p JOIN "Category" c ON p."categoryId" = c.id WHERE p."tenantId" = $1', tenant_id)
        
        print(f"Products in tenant {tenant_id}:")
        for r in rows:
            print(f"  SKU: {r['sku']:10} | Qty: {r['stockQuantity']:5} | Cat: {r['cat_name']:20} | Name: {r['name']}")
            
        # Check for ANY product with stock > 0 in the whole DB
        all_rows = await conn.fetch('SELECT p.name, p.sku, p."stockQuantity", t.slug FROM "Product" p JOIN "Tenant" t ON p."tenantId" = t.id WHERE p."stockQuantity" > 0')
        print("\nAll products with stock > 0:")
        for r in all_rows:
            print(f"  Tenant: {r['slug']:15} | SKU: {r['sku']:10} | Qty: {r['stockQuantity']:5} | Name: {r['name']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
