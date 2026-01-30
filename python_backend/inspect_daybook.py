import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def inspect_daybook():
    conn = await asyncpg.connect(DATABASE_URL)
    cols = await conn.fetch("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Daybook'")
    print("Table: Daybook")
    for c in cols:
        print(f"  - {c['column_name']} ({c['data_type']})")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(inspect_daybook())
