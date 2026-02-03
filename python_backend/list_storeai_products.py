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
            SELECT sku, name, "stockQuantity" 
            FROM "Product" 
            WHERE "tenantId" = 'd648adeb-cb77-4678-912d-0a5f6122e5dd'
        """)
        for r in rows:
            print(f"SKU: {r['sku']:15} | Name: {r['name']:30} | Qty: {r['stockQuantity']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
