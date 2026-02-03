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
        print(f"\n--- {table_name} ---")
        cols = [f"{r['column_name']} ({r['data_type']})" for r in rows]
        print(", ".join(cols))
    finally:
        await conn.close()

async def main():
    for table in ['ProductBatch', 'Stock', 'Product', 'StockLedger']:
        await list_columns(table)

if __name__ == "__main__":
    asyncio.run(main())
