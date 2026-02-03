import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch('SELECT id, slug, name FROM "Tenant"')
        with open('full_tenants_list.txt', 'w') as f:
            for r in rows:
                f.write(f"{r['id']} | {r['slug']} | {r['name']}\n")
        print(f"Dumped {len(rows)} tenants.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
