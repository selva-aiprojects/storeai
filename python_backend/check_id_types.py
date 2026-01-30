import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def check_columns():
    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch("""
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name IN ('Sale', 'Product', 'Order')
        AND column_name = 'id'
    """)
    for r in rows:
        print(f"Table: {r['table_name']}, Column: {r['column_name']}, Type: {r['data_type']}")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_columns())
