import asyncio
from services.db import db
from services.rag import rag_service

async def migrate():
    print("--- Migrating Data ---")
    await db.connect()
    
    # Get target tenant (StoreAI)
    target_slug = "storeai"
    rows = await db.fetch_rows('SELECT id, slug FROM "Tenant" WHERE slug ILIKE $1', target_slug)
    if not rows:
        print(f"Target tenant '{target_slug}' not found! Available:")
        all_t = await db.fetch_rows('SELECT slug FROM "Tenant"')
        print([t['slug'] for t in all_t])
        return
    
    target_id = rows[0]['id']
    print(f"Target '{rows[0]['slug']}' ID: {target_id}")
    
    print("Updating Products...")
    await db.execute('UPDATE "Product" SET "tenantId" = $1', target_id)
    
    print("Updating Categories...")
    await db.execute('UPDATE "Category" SET "tenantId" = $1', target_id)
    
    print("Data migration complete.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(migrate())
