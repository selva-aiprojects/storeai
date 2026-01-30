import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def check():
    conn = await asyncpg.connect(DATABASE_URL)
    tables = await conn.fetch("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
    print("Tables:", [t['tablename'] for t in tables])
    
    types = await conn.fetch("SELECT typname FROM pg_type WHERE typcategory = 'E'")
    print("Enums:", [t['typname'] for t in types])
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
