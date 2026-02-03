import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("""
            SELECT t.slug, p."tenantId", COUNT(*) 
            FROM "Product" p 
            JOIN "Tenant" t ON p."tenantId" = t.id 
            GROUP BY t.slug, p."tenantId"
        """)
        for r in rows:
            print(f"Tenant: {r['slug']:15} | ID: {r['tenantId']} | Products: {r['count']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
