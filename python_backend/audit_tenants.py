import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv('main/.env')
DATABASE_URL = os.getenv("DATABASE_URL")

async def audit_ownership():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print(f"{'Tenant Slug':<20} | {'Product Count':<15} | {'Total Stock'}")
        print("-" * 50)
        
        query = """
            SELECT 
                t.slug, 
                t.id as tenant_id,
                COUNT(p.id) as product_count,
                SUM(p."stockQuantity") as total_stock
            FROM "Tenant" t
            LEFT JOIN "Product" p ON t.id = p."tenantId"
            GROUP BY t.slug, t.id
            ORDER BY product_count DESC;
        """
        rows = await conn.fetch(query)
        for r in rows:
            print(f"{r['slug']:<20} | {r['product_count']:<15} | {r['total_stock'] or 0}")
            
        print("\nDetail for 'storeai':")
        storeai_rows = await conn.fetch('SELECT name, sku, "stockQuantity" FROM "Product" WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE slug = \'storeai\')')
        for r in storeai_rows:
            print(f"  - {r['name']} ({r['sku']}): {r['stockQuantity']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(audit_ownership())
