import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch('SELECT id, name, slug FROM "Tenant"')
        print("--- TENANTS ---")
        for r in rows:
            print(f"ID: {r['id']} | Slug: {r['slug']} | Name: {r['name']}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
