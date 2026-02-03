import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import uuid
from datetime import datetime, timedelta

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def seed_clean_flow():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 1. Get Tenant
        tenant = await conn.fetchrow('SELECT id FROM "Tenant" WHERE slug = \'storeai\'')
        if not tenant:
            print("Tenant storeai not found.")
            return
        tenant_id = tenant['id']

        # 2. Get Admin User
        admin = await conn.fetchrow('SELECT id FROM "User" WHERE email LIKE \'admin@storeai.com\'')
        admin_id = admin['id'] if admin else None

        # 3. Ensure Category
        category_id = await conn.fetchval('SELECT id FROM "Category" WHERE "tenantId" = $1 AND name = \'Platform Hardware\'', tenant_id)
        if not category_id:
            category_id = await conn.fetchval('''
                INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt")
                VALUES ($1, 'Platform Hardware', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        # 4. Ensure Supplier
        supplier_id = await conn.fetchval('SELECT id FROM "Supplier" WHERE "tenantId" = $1 AND email = \'support@globalnet.com\'', tenant_id)
        if not supplier_id:
            supplier_id = await conn.fetchval('''
                INSERT INTO "Supplier" (id, name, email, contact, address, status, "tenantId", "createdAt", "updatedAt")
                VALUES ($1, 'Global Network Solutions', 'support@globalnet.com', '+1-555-0199', '123 Tech Ave, Silicon Valley', 'ACTIVE', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        # 5. Create Product (Zero initial stock)
        product_id = str(uuid.uuid4())
        sku = f"NET-CORE-{datetime.now().strftime('%M%S')}"
        await conn.execute('''
            INSERT INTO "Product" (id, sku, name, description, price, "costPrice", "stockQuantity", "tenantId", "categoryId", unit, "lowStockThreshold", "updatedAt", "createdAt")
            VALUES ($1, $2, 'Core Fiber Switch', 'Enterprise grade fiber switch', 2500.0, 1800.0, 0, $3, $4, 'pcs', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', product_id, sku, tenant_id, category_id)

        # 6. Create Warehouse
        warehouse_id = await conn.fetchval('SELECT id FROM "Warehouse" WHERE "tenantId" = $1 AND "isDefault" = true', tenant_id)
        if not warehouse_id:
            warehouse_id = await conn.fetchval('''
                INSERT INTO "Warehouse" (id, name, location, "tenantId", "isDefault", "updatedAt", "createdAt")
                VALUES ($1, 'Regional Hub', 'Sector 7', $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        # 7. Create Purchase Order (PO)
        po_id = str(uuid.uuid4())
        po_number = f"PO-INV-{datetime.now().strftime('%y%m%d%H%M')}"
        await conn.execute('''
            INSERT INTO "Order" (id, "orderNumber", status, "approvalStatus", "approvedById", "totalAmount", "taxAmount", "supplierId", "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, 'APPROVED', 'APPROVED', $3, 18000.0, 0.0, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', po_id, po_number, admin_id, supplier_id, tenant_id)

        # 8. Create PO Item
        await conn.execute('''
            INSERT INTO "OrderItem" (id, quantity, "receivedQuantity", "unitPrice", "orderId", "productId")
            VALUES ($1, 10, 10, 1800.0, $2, $3)
        ''', str(uuid.uuid4()), po_id, product_id)

        # 9. Create Goods Receipt (GRN) - This completes the flow
        grn_id = str(uuid.uuid4())
        grn_number = f"GRN-{po_number}"
        await conn.execute('''
            INSERT INTO "GoodsReceipt" (id, "grnNumber", "orderId", "warehouseId", "notes")
            VALUES ($1, $2, $3, $4, 'Auto-seeded inventory flow')
        ''', grn_id, grn_number, po_id, warehouse_id)

        # 10. Update Stock and create Batch
        await conn.execute('''
            INSERT INTO "Stock" (id, quantity, "warehouseId", "productId", "batchNumber", "updatedAt")
            VALUES ($1, 10, $2, $3, 'BATCH-001', CURRENT_TIMESTAMP)
        ''', str(uuid.uuid4()), warehouse_id, product_id)

        await conn.execute('''
            INSERT INTO "ProductBatch" (id, "batchNumber", "productId", "quantityReceived", "quantityAvailable", "costPrice", status, "updatedAt", "createdAt")
            VALUES ($1, 'BATCH-001', $2, 10, 10, 1800.0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', str(uuid.uuid4()), product_id)

        # Update Master Product Stock
        await conn.execute('UPDATE "Product" SET "stockQuantity" = 10 WHERE id = $1', product_id)

        print(f"Inventory flow seeded successfully! Product SKU: {sku}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_clean_flow())
