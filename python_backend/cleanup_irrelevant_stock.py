import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def cleanup_stock():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 1. Identify products shown in the screenshot
        skus = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL380']
        rows = await conn.fetch('''
            SELECT p.id, p.name, p.sku, t.name as tenant_name, t.slug 
            FROM "Product" p 
            JOIN "Tenant" t ON p."tenantId" = t.id 
            WHERE p.sku = ANY($1)
        ''', skus)
        
        print("Found following products:")
        for r in rows:
            print(f"- {r['name']} ({r['sku']}) belongs to {r['tenant_name']} (slug: {r['slug']})")

        # 2. User wants to remove irrelevant stock. 
        # If they belong to 'storeai' and user wants a clean flow, let's delete them.
        ids_to_delete = [r['id'] for r in rows if r['slug'] == 'storeai']
        
        if ids_to_delete:
            print(f"Deleting {len(ids_to_delete)} products from storeai...")
            # Delete dependent records first (Stock, Batches, etc)
            await conn.execute('DELETE FROM "Stock" WHERE "productId" = ANY($1)', ids_to_delete)
            await conn.execute('DELETE FROM "ProductBatch" WHERE "productId" = ANY($1)', ids_to_delete)
            await conn.execute('DELETE FROM "Product" WHERE id = ANY($1)', ids_to_delete)
            print("Cleanup complete.")
        else:
            print("No matching products found for storeai.")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(cleanup_stock())
