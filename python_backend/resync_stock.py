import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import uuid

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def resync_stock():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 1. Find all products that have batches
        p_ids = await conn.fetch('SELECT DISTINCT "productId" FROM "ProductBatch"')
        
        print(f"Checking {len(p_ids)} products for batch sync...")
        
        for row in p_ids:
            p_id = row['productId']
            
            # Sum available quantity from batches
            batch_sum = await conn.fetchval('SELECT SUM("quantityAvailable") FROM "ProductBatch" WHERE "productId" = $1', p_id) or 0
            
            # Update Product table
            await conn.execute('UPDATE "Product" SET "stockQuantity" = $1 WHERE id = $2', batch_sum, p_id)
            print(f"  Product {p_id} updated to {batch_sum}")
            
            # Update Stock table (Warehouse aggregate)
            # For simplicity, we'll put everything into the first warehouse found for that tenant, 
            # or use the warehouseId from the batch if it exists?
            # Let's check ProductBatch columns again. inwardDate, poId, batchNumber... no warehouseId in ProductBatch?
            # Wait, list_columns.py said ProductBatch has poId, status... no warehouseId.
            # But ProductBatch has warehouseLocation? 
            
            # Let's just update existing Stock records or create one in a default warehouse.
            # Find a warehouse for this product's tenant
            tenant_id = await conn.fetchval('SELECT "tenantId" FROM "Product" WHERE id = $1', p_id)
            warehouse_id = await conn.fetchval('SELECT id FROM "Warehouse" WHERE "tenantId" = $1 LIMIT 1', tenant_id)
            
            if warehouse_id:
                # Upsert into Stock
                # Constraint is usually (warehouseId, productId, batchNumber)
                # But if we want a global warehouse aggregate, we might just use one record per warehouse/product?
                # Actually, Stock table has batchNumber too.
                
                # Let's sync EACH batch to the Stock table.
                batches = await conn.fetch('SELECT "batchNumber", "quantityAvailable" FROM "ProductBatch" WHERE "productId" = $1', p_id)
                for b in batches:
                    await conn.execute("""
                        INSERT INTO "Stock" (id, quantity, "warehouseId", "productId", "batchNumber", "updatedAt")
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        ON CONFLICT ("warehouseId", "productId", "batchNumber") 
                        DO UPDATE SET quantity = EXCLUDED.quantity, "updatedAt" = NOW()
                    """, str(uuid.uuid4()), b['quantityAvailable'], warehouse_id, p_id, b['batchNumber'])
                
                print(f"  Stock table synced for {len(batches)} batches.")

        print("Resync complete.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(resync_stock())
