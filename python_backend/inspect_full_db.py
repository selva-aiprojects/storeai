import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def inspect():
    conn = await asyncpg.connect(DATABASE_URL)
    tables = await conn.fetch("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
    for t in tables:
        tname = t['tablename']
        cols = await conn.fetch(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{tname}'")
        print(f"Table: {tname}")
        for c in cols:
            print(f"  - {c['column_name']} ({c['data_type']})")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(inspect())
