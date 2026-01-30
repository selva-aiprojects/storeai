import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def check():
    conn = await asyncpg.connect(DATABASE_URL)
    cols = await conn.fetch("""
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'Daybook'
    """)
    print("Daybook Columns:")
    for c in cols:
        print(f"- {c['column_name']}: {c['data_type']} ({c['udt_name']})")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
