import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def check_triggers():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("""
            SELECT tgname 
            FROM pg_trigger 
            WHERE tgrelid = '"User"'::regclass
        """)
        print(f"Triggers on User: {rows}")
        
        # Also check Employee
        rows = await conn.fetch("""
            SELECT tgname 
            FROM pg_trigger 
            WHERE tgrelid = '"Employee"'::regclass
        """)
        print(f"Triggers on Employee: {rows}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_triggers())
