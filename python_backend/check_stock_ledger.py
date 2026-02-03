import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def check_sl():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'StockLedger'")
        print("StockLedger Columns:")
        for r in rows:
            print(f"- {r['column_name']} ({r['data_type']})")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_sl())
