import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import random

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def seed_all_tenants():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        tenants = await conn.fetch('SELECT id, slug, name FROM "Tenant"')
        print(f"Found {len(tenants)} tenants.")
        
        products = [
            {"name": "Standard Laptop", "sku": "LAP-001", "price": 1200, "cost": 800},
            {"name": "Generic Mouse", "sku": "MOU-001", "price": 25, "cost": 10},
            {"name": "Office Chair", "sku": "CHR-001", "price": 150, "cost": 90}
        ]
        
        for tenant in tenants:
            if tenant['slug'] == 'storeai':
                continue # Already has data
            
            # Check if already has products
            count = await conn.fetchval('SELECT COUNT(*) FROM "Product" WHERE "tenantId" = $1', tenant['id'])
            if count > 0:
                print(f"Tenant {tenant['slug']} already has {count} products. Skipping.")
                continue
                
            # Seed one random product
            p = random.choice(products)
            sku = f"{tenant['slug'].upper()}-{p['sku']}"
            
            print(f"Seeding {p['name']} for {tenant['slug']}...")
            
            # 1. Category (Required)
            category_id = await conn.fetchval('SELECT id FROM "Category" WHERE "tenantId" = $1 LIMIT 1', tenant['id'])
            if not category_id:
                category_id = await conn.fetchval("""
                    INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), 'General Goods', $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                """, tenant['id'])

            # 2. Product
            product_id = await conn.fetchval("""
                INSERT INTO "Product" (id, sku, name, "price", "costPrice", "stockQuantity", "tenantId", unit, "lowStockThreshold", "avgDailySales", "leadTimeDays", "categoryId", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, 50, $5, 'pcs', 5, 0, 7, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            """, sku, p['name'], p['price'], p['cost'], tenant['id'], category_id)
            
            # 3. Warehouse
            warehouse_id = await conn.fetchval('SELECT id FROM "Warehouse" WHERE "tenantId" = $1 AND "isDefault" = true', tenant['id'])
            if not warehouse_id:
                warehouse_id = await conn.fetchval("""
                    INSERT INTO "Warehouse" (id, name, "tenantId", "isDefault", "location", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), 'Main Warehouse', $1, true, 'Headquarters', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                """, tenant['id'])
            
            # 4. Stock
            await conn.execute("""
                INSERT INTO "Stock" (id, "productId", "warehouseId", quantity, "batchNumber", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, 50, 'INITIAL', CURRENT_TIMESTAMP)
            """, product_id, warehouse_id)
            
            # 5. Batch
            await conn.execute("""
                INSERT INTO "ProductBatch" (id, "productId", "batchNumber", "quantityReceived", "quantityAvailable", "costPrice", status, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), $1, 'INITIAL', 50, 50, $2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """, product_id, p['cost'])
            
        print("Seeding complete.")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_all_tenants())
