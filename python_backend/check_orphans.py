import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch('SELECT * FROM "ProductBatch" WHERE "productId" NOT IN (SELECT id FROM "Product")')
        print(f"Orphaned Batches: {len(rows)}")
        
        # Also check batches where productId is NULL
        null_p = await conn.fetch('SELECT * FROM "ProductBatch" WHERE "productId" IS NULL')
        print(f"Batches with NULL productId: {len(null_p)}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
