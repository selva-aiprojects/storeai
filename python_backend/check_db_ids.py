import asyncio
from services.db import db

async def check():
    print("--- Connecting ---")
    await db.connect()
    
    print("\n--- Tenants (Clean) ---")
    tenants = await db.fetch_rows('SELECT id, name, slug FROM "Tenant"')
    for t in tenants:
        print(f"SLUG: {t['slug']} | ID: {t['id']}")
        
    print("\n--- Product Count by Tenant ---")
    counts = await db.fetch_rows('SELECT "tenantId", COUNT(*) as count FROM "Product" GROUP BY "tenantId"')
    for c in counts:
        print(dict(c))
        
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(check())
