import asyncio
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
import asyncpg
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.db import db
from services.finance import finance_service
from services.inventory import inventory_service

async def verify():
    await db.connect()
    try:
        prefix = f"v{int(datetime.now().timestamp())}"
        tenant_id = str(uuid.uuid4())
        
        # 1. Tenant
        await db.execute("""INSERT INTO "Tenant" (id, name, slug, status, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())""", tenant_id, f"T-{prefix}", f"s-{prefix}")
        print("PASS: Tenant")

        # 2. Account
        await db.execute("""INSERT INTO "ChartOfAccounts" (id, name, code, "accountType", "accountGroup", "openingBalance", "currentBalance", "tenantId", "createdAt", "updatedAt", "isActive", "isSystemAccount") VALUES ($1, 'Cash', $2, 'ASSET', 'CURRENT_ASSETS', 1000, 1000, $3, NOW(), NOW(), true, true)""", str(uuid.uuid4()), f"C-{prefix}", tenant_id)
        print("PASS: ChartOfAccounts")

        # 3. Warehouse (Fixed location)
        wh_id = str(uuid.uuid4())
        await db.execute("""INSERT INTO "Warehouse" (id, name, location, "tenantId", "createdAt", "updatedAt", "isDefault") VALUES ($1, $2, 'Main Street', $3, NOW(), NOW(), true)""", wh_id, f"WH-{prefix}", tenant_id)
        cat_id = str(uuid.uuid4())
        await db.execute("""INSERT INTO "Category" (id, name, "tenantId", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())""", cat_id, f"CAT-{prefix}", tenant_id)
        print("PASS: WH & CAT")

        # 4. Product
        p_id = str(uuid.uuid4())
        await db.execute("""INSERT INTO "Product" (id, sku, name, price, "costPrice", "gstRate", "tenantId", "categoryId", "stockQuantity", "updatedAt", "createdAt", "reorderPoint", "reorderQuantity", "leadTimeDays", "avgDailySales", "transportationCost", "isDeleted", "isBatchTracked", "lowStockThreshold", "unit") VALUES ($1, $2, 'W', 100, 70, 18, $3, $4, 0, NOW(), NOW(), 1, 1, 1, 1, 0, false, false, 1, 'EA')""", p_id, f"SK-{prefix}", tenant_id, cat_id)
        print("PASS: Product")

        # 5. User & Employe
        u_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "updatedAt", "createdAt", "isActive", "isDeleted") 
            VALUES ($1, $2, 'p', 'F', 'L', 'ADMIN', NOW(), NOW(), true, false)
        """, u_id, f"u-{prefix}@a.com")
        print("PASS: User")

        dept_id = str(uuid.uuid4())
        await db.execute("""INSERT INTO "Department" (id, name, "tenantId", "createdAt", "updatedAt", "isDeleted") VALUES ($1, 'Admin', $2, NOW(), NOW(), false)""", dept_id, tenant_id)
        
        emp_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "Employee" (id, "userId", "departmentId", "firstName", "lastName", status, "createdAt", "updatedAt", "isDeleted", "employeeId", "designation", "joiningDate", "salary")
            VALUES ($1, $2, $3, 'F', 'L', 'ACTIVE', NOW(), NOW(), false, $4, 'Manager', NOW(), 50000)
        """, emp_id, u_id, dept_id, f"EMP-{prefix}")
        print("PASS: Employee")

        # 6. Workflow
        s_id = str(uuid.uuid4())
        await db.execute("""INSERT INTO "Supplier" (id, name, email, "tenantId", "createdAt", "updatedAt") VALUES ($1, 'S', $2, $3, NOW(), NOW())""", s_id, f"s-{prefix}@a.com", tenant_id)
        
        c_id = str(uuid.uuid4())
        await db.execute("""INSERT INTO "Customer" (id, name, "tenantId", "createdAt", "updatedAt") VALUES ($1, 'C', $2, NOW(), NOW())""", c_id, tenant_id)

        # PO & GRN
        po = await inventory_service.create_purchase_order(s_id, [{"productId": p_id, "quantity": 10, "unitPrice": 70}], tenant_id, performed_by=u_id)
        await inventory_service.process_goods_receipt(po['orderId'], [{"productId": p_id, "quantity": 10}], wh_id, tenant_id, performed_by=emp_id)
        print("PASS: PO & GRN")
        
        # SALE
        sale_id = str(uuid.uuid4())
        # Note: Sale schema might have changed? I'll check schema or assume standard.
        # Step 486 Sale Schema: igstAmount, discountAmount, roundOff, isHomeDelivery, totalAmount, isDeleted, createdAt, updatedAt, dueDate, isPaid, taxAmount, id, tenantId, customerId, invoiceNo, status
        await db.execute("""
            INSERT INTO "Sale" (id, "invoiceNo", "totalAmount", "taxAmount", "customerId", "tenantId", "isPaid", "createdAt", "updatedAt", "status", "isDeleted", "igstAmount", "discountAmount", "roundOff", "isHomeDelivery") 
            VALUES ($1, $2, 118, 18, $3, $4, true, NOW(), NOW(), 'COMPLETED', false, 0, 0, 0, false)
        """, sale_id, f"INV-{prefix}", c_id, tenant_id)
        
        await db.execute("""
            INSERT INTO "SaleItem" (id, quantity, "unitPrice", "taxAmount", "saleId", "productId", "igst", "cgst", "sgst") 
            VALUES ($1, 1, 100, 18, $2, $3, 0, 9, 9)
        """, str(uuid.uuid4()), sale_id, p_id)
        
        await db.execute("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" - 1 WHERE id = $1", p_id)
        
        await finance_service.record_sale(sale_id, tenant_id, performed_by=u_id)
        print("PASS: Sale Recorded")

        # 7. Reports
        db_rows = await finance_service.get_daybook(tenant_id)
        print(f"DEBUG: Daybook Rows: {len(db_rows)}")
        for r in db_rows:
            print(f" - {r['type']}: {r['description']} | Dr: {r.get('debit')} Cr: {r.get('credit')}")

        pl = await finance_service.get_profit_loss(tenant_id)
        print(f"VERIFICATION SUCCESS: Profit={pl['netProfit']}")
        
        tb = await finance_service.get_trial_balance(tenant_id)
        print(f"PASS: Trial Balance Generated with {len(tb)} accounts.")

    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(verify())
