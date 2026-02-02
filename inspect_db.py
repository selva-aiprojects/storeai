import asyncio
import os
import json
from dotenv import load_dotenv
import asyncpg

async def inspect():
    load_dotenv('main/.env')
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("--- TENANTS ---")
    tenants = await conn.fetch('SELECT id, name, slug FROM "Tenant"')
    for t in tenants:
        print(dict(t))
        
    print("\n--- PRODUCT COUNTS ---")
    counts = await conn.fetch('SELECT "tenantId", COUNT(*) FROM "Product" GROUP BY "tenantId"')
    for c in counts:
        print(dict(c))
        
    await conn.close()

if __name__ == "__main__":
    asyncio.run(inspect())
