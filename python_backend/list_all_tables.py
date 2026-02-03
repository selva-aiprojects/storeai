import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def list_all_tables():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [r[0] for r in rows]
        print("--- ALL TABLES ---")
        for t in sorted(tables):
            print(t)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(list_all_tables())
