import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def list_tables():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [r[0] for r in rows]
        keywords = ['stock', 'inventory', 'ledger', 'move', 'hist', 'log']
        relevant = [t for t in tables if any(k in t.lower() for k in keywords)]
        print(f"Relevant Tables: {sorted(relevant)}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(list_tables())
