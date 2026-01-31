import asyncio
import os
from services.db import db
from dotenv import load_dotenv

load_dotenv()

async def list_tenants():
    await db.connect()
    try:
        print("\n--- TENANTS ---")
        tenants = await db.fetch_rows('SELECT "id", "name", "slug" FROM "Tenant"')
        for t in tenants:
            print(dict(t))

        print("\n--- PRODUCTS COUNT BY TENANT ---")
        products = await db.fetch_rows('SELECT "tenantId", COUNT(*) as count FROM "Product" GROUP BY "tenantId"')
        for p in products:
            print(dict(p))

    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(list_tenants())
