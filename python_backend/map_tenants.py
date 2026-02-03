import asyncio
from services.db import db

async def map_tenants():
    rows = await db.fetch_rows('SELECT id, name, slug FROM "Tenant"')
    print("--- TENANT MAPPING ---")
    for row in rows:
        print(f"ID: {row['id']} | Slug: {row['slug']} | Name: {row['name']}")

if __name__ == "__main__":
    asyncio.run(map_tenants())
