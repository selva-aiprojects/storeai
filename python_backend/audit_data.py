import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print(f"{'Tenant Slug':<30} | {'Product Count':<15}")
        print("-" * 50)
        
        query = """
            SELECT 
                t.slug, 
                COUNT(p.id) as product_count
            FROM "Tenant" t
            LEFT JOIN "Product" p ON t.id = p."tenantId"
            GROUP BY t.slug
            ORDER BY product_count DESC;
        """
        rows = await conn.fetch(query)
        for r in rows:
            print(f"{r['slug']:<30} | {r['product_count']:<15}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
