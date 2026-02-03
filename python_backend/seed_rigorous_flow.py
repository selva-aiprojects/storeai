import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import uuid
from datetime import datetime

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def seed_rigorous_flow():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 0. Get Tenant
        tenant = await conn.fetchrow('SELECT id FROM "Tenant" WHERE slug = \'storeai\'')
        if not tenant:
            print("Tenant storeai not found.")
            return
        tenant_id = tenant['id']

        # 1. Cleanup existing storeai data for a truly clean flow
        print("Cleaning up existing storeai data...")
        p_ids = await conn.fetch('SELECT id FROM "Product" WHERE "tenantId" = $1', tenant_id)
        if p_ids:
            ids = [r['id'] for r in p_ids]
            await conn.execute('DELETE FROM "Stock" WHERE "productId" = ANY($1)', ids)
            await conn.execute('DELETE FROM "ProductBatch" WHERE "productId" = ANY($1)', ids)
            await conn.execute('DELETE FROM "GoodsReceiptItem" WHERE "productId" = ANY($1)', ids)
            await conn.execute('DELETE FROM "OrderItem" WHERE "productId" = ANY($1)', ids)
            await conn.execute('DELETE FROM "Product" WHERE id = ANY($1)', ids)

        # 2. Setup Organization (Department & Procurement Team)
        print("Setting up Procurement Team...")
        dept_id = await conn.fetchval('SELECT id FROM "Department" WHERE name = \'Procurement\' AND \"tenantId\" = $1', tenant_id)
        if not dept_id:
            dept_id = await conn.fetchval('''
                INSERT INTO "Department" (id, name, "tenantId", "updatedAt", "createdAt")
                VALUES ($1, 'Procurement', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        emp_id = await conn.fetchval('SELECT id FROM "Employee" WHERE "firstName" = \'James\' AND \"departmentId\" = $1', dept_id)
        if not emp_id:
            emp_id = await conn.fetchval('''
                INSERT INTO "Employee" (id, "employeeId", "firstName", "lastName", designation, "joiningDate", status, salary, "departmentId", "updatedAt", "createdAt")
                VALUES ($1, 'EMP-PROC-001', 'James', 'Wilson', 'Procurement Officer', CURRENT_TIMESTAMP, 'ACTIVE', 4500.0, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), dept_id)

        # 3. Setup Logistics Baseline (Warehouse & Category)
        warehouse = await conn.fetchrow('SELECT id FROM "Warehouse" WHERE "tenantId" = $1 AND "isDefault" = true', tenant_id)
        warehouse_id = warehouse['id'] if warehouse else None
        if not warehouse_id:
            warehouse_id = await conn.fetchval('''
                INSERT INTO "Warehouse" (id, name, location, "tenantId", "isDefault", "updatedAt", "createdAt")
                VALUES ($1, 'Central Fulfillment Center', 'Industrial Zone B', $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        cat_id = await conn.fetchval('SELECT id FROM "Category" WHERE name = \'Enterprise Networking\' AND \"tenantId\" = $1', tenant_id)
        if not cat_id:
            cat_id = await conn.fetchval('''
                INSERT INTO "Category" (id, name, "tenantId", "updatedAt", "createdAt")
                VALUES ($1, 'Enterprise Networking', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        # 4. Setup Supply Chain (Supplier & Product)
        supplier_id = await conn.fetchval('SELECT id FROM "Supplier" WHERE email = \'orders@intel-pro.com\' AND \"tenantId\" = $1', tenant_id)
        if not supplier_id:
            supplier_id = await conn.fetchval('''
                INSERT INTO "Supplier" (id, name, email, contact, status, "tenantId", "updatedAt", "createdAt")
                VALUES ($1, 'IntelPro Systems', 'orders@intel-pro.com', '+1-800-INTEL', 'ACTIVE', $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            ''', str(uuid.uuid4()), tenant_id)

        p_id = str(uuid.uuid4())
        sku = "IP-SW-48P"
        await conn.execute('''
            INSERT INTO "Product" (id, sku, name, description, price, "costPrice", "tenantId", "categoryId", unit, "lowStockThreshold", "updatedAt", "createdAt")
            VALUES ($1, $2, '48-Port Pro Switch', 'Managed Gigabit Ethernet Switch', 1200.0, 850.0, $3, $4, 'pcs', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', p_id, sku, tenant_id, cat_id)

        # 5. The Workflow: Purchase Order (PO)
        print("Creating Purchase Order...")
        po_id = str(uuid.uuid4())
        po_no = f"PO-HQ-{datetime.now().strftime('%y%m%d%f')[:10]}"
        await conn.execute('''
            INSERT INTO "Order" (id, "orderNumber", status, "approvalStatus", "totalAmount", "taxAmount", "supplierId", "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, 'APPROVED', 'APPROVED', 8500.0, 0.0, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', po_id, po_no, supplier_id, tenant_id)

        await conn.execute('''
            INSERT INTO "OrderItem" (id, quantity, "receivedQuantity", "unitPrice", "orderId", "productId")
            VALUES ($1, 10, 10, 850.0, $2, $3)
        ''', str(uuid.uuid4()), po_id, p_id)

        # 6. The Workflow: Goods Receipt (GRN) Received by Procurement Team
        print(f"Generating GRN (Received by James Wilson)...")
        grn_id = str(uuid.uuid4())
        grn_no = f"GRN-{po_no}"
        await conn.execute('''
            INSERT INTO "GoodsReceipt" (id, "grnNumber", "orderId", "warehouseId", "receivedById", "notes")
            VALUES ($1, $2, $3, $4, $5, 'Shipment verified. No damages reported.')
        ''', grn_id, grn_no, po_id, warehouse_id, emp_id)

        await conn.execute('''
            INSERT INTO "GoodsReceiptItem" (id, quantity, "goodsReceiptId", "productId", "batchNumber")
            VALUES ($1, 10, $2, $3, 'BATCH-INTEL-001')
        ''', str(uuid.uuid4()), grn_id, p_id)

        # 7. Finalize Inventory (Stock & Batch)
        await conn.execute('''
            INSERT INTO "Stock" (id, quantity, "warehouseId", "productId", "batchNumber", "updatedAt")
            VALUES ($1, 10, $2, $3, 'BATCH-INTEL-001', CURRENT_TIMESTAMP)
        ''', str(uuid.uuid4()), warehouse_id, p_id)

        await conn.execute('''
            INSERT INTO "ProductBatch" (id, "batchNumber", "productId", "quantityReceived", "quantityAvailable", "costPrice", status, "updatedAt", "createdAt")
            VALUES ($1, 'BATCH-INTEL-001', $2, 10, 10, 850.0, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', str(uuid.uuid4()), p_id)

        await conn.execute('UPDATE "Product" SET "stockQuantity" = 10 WHERE id = $1', p_id)

        print(f"\nSUCCESS: Rigorous Inventory Flow Seeded.")
        print(f"Product: {sku}")
        print(f"PO Number: {po_no}")
        print(f"Received By: James Wilson (Procurement Team)")
        print(f"Warehouse: Central Fulfillment Center")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(seed_rigorous_flow())
