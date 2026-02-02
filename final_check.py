import asyncio
import os
from dotenv import load_dotenv
import asyncpg

async def check_sales():
    load_dotenv('main/.env')
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("--- SALES DATES ---")
    rows = await conn.fetch('SELECT "createdAt" FROM "Sale" ORDER BY "createdAt" DESC LIMIT 10')
    if not rows:
        print("No sales found.")
    for r in rows:
        print(r['createdAt'])
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_sales())
