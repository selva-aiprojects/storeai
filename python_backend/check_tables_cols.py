import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def check_cols():
    conn = await asyncpg.connect(DATABASE_URL)
    tables = ['GoodsReceipt', 'Order', 'OrderItem', 'PurchaseReturn', 'PurchaseReturnItem']
    try:
        for t in tables:
            rows = await conn.fetch(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}'")
            print(f"\n{t} Columns:")
            for r in rows:
                print(f"- {r['column_name']} ({r['data_type']})")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_cols())
