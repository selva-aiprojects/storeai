import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        tables = ['Product', 'Stock', 'ProductBatch', 'StockLedger', 'InventoryDocumentItem']
        for table in tables:
            rows = await conn.fetch(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
            print(f"[{table}]")
            for r in rows:
                print(f"  {r['column_name']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
