import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def list_columns(table_name):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
        print(f"--- COLUMNS FOR {table_name} ---")
        for r in rows:
            print(f"{r['column_name']} ({r['data_type']})")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(list_columns('ProductBatch'))
    asyncio.run(list_columns('Stock'))
    asyncio.run(list_columns('StockLedger'))
    asyncio.run(list_columns('Product'))
