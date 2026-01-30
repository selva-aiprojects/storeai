import asyncio
import uuid
import random
from datetime import datetime, timedelta
from decimal import Decimal
import os
import sys
import bcrypt

# Add current directory to path so we can import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.db import db

async def seed_master_data():
    print("ARCHITECT SEED: Starting Synthetic Data Generation...", flush=True)
    
    # 0. AUTH & PLAN SETUP
    # Plan
    plan_id = str(uuid.uuid4())
    await db.execute("""
        INSERT INTO "Plan" (id, name, price, "billingCycle", features, "updatedAt")
        VALUES ($1, 'PRO', 99.0, 'MONTHLY', '{"maxUsers": 20, "aiPredictions": true}', NOW())
        ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, "updatedAt" = NOW()
    """, plan_id)
    p_rows = await db.fetch_rows("SELECT id FROM \"Plan\" WHERE name = 'PRO'")
    plan_id = p_rows[0]['id']

    # Role
    role_id = str(uuid.uuid4())
    await db.execute("""
        INSERT INTO "Role" (id, name, code)
        VALUES ($1, 'Super Admin', 'SUPER_ADMIN')
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    """, role_id)
    r_rows = await db.fetch_rows("SELECT id FROM \"Role\" WHERE code = 'SUPER_ADMIN'")
    role_id = r_rows[0]['id']

    # User
    password = "AdminPassword123!"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
    user_id = str(uuid.uuid4())
    await db.execute("""
        INSERT INTO "User" (id, email, password, "firstName", "lastName", role, "updatedAt")
        VALUES ($1, 'admin@storeai.com', $2, 'Alex', 'Master', 'SUPER_ADMIN', NOW())
        ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "updatedAt" = NOW()
    """, user_id, hashed)
    u_rows = await db.fetch_rows("SELECT id FROM \"User\" WHERE email = 'admin@storeai.com'")
    user_id = u_rows[0]['id']

    # Permissions Setup
    permissions = [
        {"code": "dashboard:view", "name": "View Dashboard", "cat": "DASHBOARD"},
        {"code": "inventory:read", "name": "View Inventory", "cat": "INVENTORY"},
        {"code": "inventory:write", "name": "Modify Inventory", "cat": "INVENTORY"},
        {"code": "sales:read", "name": "View Sales", "cat": "SALES"},
        {"code": "sales:write", "name": "Generate Sales", "cat": "SALES"},
        {"code": "hr:read", "name": "View Personnel", "cat": "HR"},
        {"code": "hr:write", "name": "Manage Personnel", "cat": "HR"},
        {"code": "accounts:read", "name": "View Accounts", "cat": "FINANCE"},
        {"code": "accounts:write", "name": "Manage Accounts", "cat": "FINANCE"},
        {"code": "reports:view", "name": "View Reports", "cat": "REPORTS"},
        {"code": "crm:read", "name": "View CRM", "cat": "CRM"},
        {"code": "crm:write", "name": "Manage CRM", "cat": "CRM"},
        {"code": "orders:read", "name": "View Purchase Orders", "cat": "PROCUREMENT"},
        {"code": "orders:write", "name": "Manage Purchase Orders", "cat": "PROCUREMENT"},
        {"code": "users:manage", "name": "Manage Users", "cat": "ADMIN"},
        {"code": "tenants:manage", "name": "Manage Organizations", "cat": "ADMIN"}
    ]

    for p in permissions:
        p_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "Permission" (id, code, name, category)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category
        """, p_id, p['code'], p['name'], p['cat'])

    # Link all permissions to SUPER_ADMIN role
    mapping_rows = await db.fetch_rows("""
        SELECT p.id as p_id, r.id as r_id 
        FROM "Permission" p, "Role" r 
        WHERE r.code = 'SUPER_ADMIN'
    """)
    for row in mapping_rows:
        await db.execute("""
            INSERT INTO "_PermissionToRole" ("A", "B")
            VALUES ($1, $2)
            ON CONFLICT ("A", "B") DO NOTHING
        """, row['p_id'], row['r_id'])

    print(f"Auth Seeded: admin@storeai.com (Locked with {len(permissions)} permissions)", flush=True)

    # 1. TENANT SETUP
    tenant_id = str(uuid.uuid4())
    slug = "master-store"
    
    await db.execute("""
        INSERT INTO "Tenant" (id, name, slug, status, "createdAt", "updatedAt", "planId")
        VALUES ($1, 'Master Validation Store', $2, 'ACTIVE', NOW(), NOW(), $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW(), "planId" = $3
    """, tenant_id, slug, plan_id)
    
    # Get the ID if it already existed
    t_rows = await db.fetch_rows("SELECT id FROM \"Tenant\" WHERE slug = $1", slug)
    tenant_id = t_rows[0]['id']
    print(f"Using Tenant: {slug} (ID: {tenant_id})", flush=True)

    # Link User to Tenant
    await db.execute("""
        INSERT INTO "UserTenant" ("userId", "tenantId", "roleId")
        VALUES ($1, $2, $3)
        ON CONFLICT ("userId", "tenantId") DO NOTHING
    """, user_id, tenant_id, role_id)

    # 2. WAREHOUSE SETUP
    wh_id = str(uuid.uuid4())
    await db.execute("""
        INSERT INTO "Warehouse" (id, name, location, "isDefault", "tenantId", "createdAt", "updatedAt")
        VALUES ($1, 'Main Distribution Center', 'Sector 5, Industrial Area', true, $2, NOW(), NOW())
        ON CONFLICT ("tenantId", name) DO UPDATE SET location = EXCLUDED.location
    """, wh_id, tenant_id)
    
    wh_rows = await db.fetch_rows("SELECT id FROM \"Warehouse\" WHERE \"tenantId\" = $1 AND name = 'Main Distribution Center'", tenant_id)
    wh_id = wh_rows[0]['id']
    print(f"Using Warehouse: {wh_id}", flush=True)

    # 3. CATEGORIES & PRODUCTS
    category_data = [
        {"name": "Electronics", "desc": "Gadgets and tech"},
        {"name": "Apparel", "desc": "Clothing and fashion"},
        {"name": "Groceries", "desc": "Daily essentials"}
    ]
    
    categories = []
    for cd in category_data:
        cat_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "Category" (id, name, description, "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT ("tenantId", name) DO UPDATE SET description = EXCLUDED.description
        """, cat_id, cd['name'], cd['desc'], tenant_id)
        
        c_rows = await db.fetch_rows("SELECT id FROM \"Category\" WHERE \"tenantId\" = $1 AND name = $2", tenant_id, cd['name'])
        categories.append({"id": c_rows[0]['id'], "name": cd['name']})
        
    products = []
    for cat in categories:
        for i in range(1, 4):
            p_id = str(uuid.uuid4())
            sku = f"{cat['name'][:3].upper()}-{100 + i}"
            price = random.uniform(500, 5000)
            cost = price * 0.7
            await db.execute("""
                INSERT INTO "Product" (id, sku, name, price, "costPrice", "gstRate", "stockQuantity", "categoryId", "tenantId", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, 18.0, 0, $6, $7, NOW(), NOW())
                ON CONFLICT ("tenantId", sku) DO NOTHING
            """, p_id, sku, f"{cat['name']} Item {i}", price, cost, cat['id'], tenant_id)
            
            p_rows = await db.fetch_rows("SELECT id, price, \"costPrice\" as cost, name FROM \"Product\" WHERE \"tenantId\" = $1 AND sku = $2", tenant_id, sku)
            products.append(dict(p_rows[0]))
            
    print(f"Seeded Categories and Products", flush=True)

    # 4. HR: DEPARTMENTS & EMPLOYEES
    department_names = ["Operations", "Sales"]
    employees = []
    for d_name in department_names:
        dep_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "Department" (id, name, "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT ("tenantId", name) DO NOTHING
        """, dep_id, d_name, tenant_id)
        
        d_rows = await db.fetch_rows("SELECT id FROM \"Department\" WHERE \"tenantId\" = $1 AND name = $2", tenant_id, d_name)
        dep_id = d_rows[0]['id']
        
        for i in range(1, 3):
            emp_id = str(uuid.uuid4())
            ext_id = f"EMP-{d_name[:3].upper()}-{100+i}"
            salary = random.uniform(25000, 60000)
            await db.execute("""
                INSERT INTO "Employee" (id, "employeeId", "firstName", "lastName", designation, "joiningDate", salary, "departmentId", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                ON CONFLICT ("employeeId") DO NOTHING
            """, emp_id, ext_id, f"{d_name} Staff", str(i), "Associate", datetime.now() - timedelta(days=365), salary, dep_id)
            
            e_rows = await db.fetch_rows("SELECT id, salary, \"firstName\" || ' ' || \"lastName\" as name FROM \"Employee\" WHERE \"employeeId\" = $1", ext_id)
            employees.append(dict(e_rows[0]))
            
    print(f"Seeded Departments and Employees", flush=True)

    # 5. SUPPLY CHAIN: SUPPLIERS & POs
    suppliers = []
    for i in range(1, 3):
        s_id = str(uuid.uuid4())
        email = f"sales@supplier{i}.com"
        await db.execute("""
            INSERT INTO "Supplier" (id, name, email, "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            ON CONFLICT ("tenantId", email) DO NOTHING
        """, s_id, f"Global Supplier {i}", email, tenant_id)
        
        s_rows = await db.fetch_rows("SELECT id FROM \"Supplier\" WHERE \"tenantId\" = $1 AND email = $2", tenant_id, email)
        suppliers.append(s_rows[0]['id'])
    
    # Create POs if not already seeded for this period
    existing_pos = await db.fetch_val("SELECT count(*) FROM \"Order\" WHERE \"tenantId\" = $1", tenant_id)
    if existing_pos < 5:
        for i in range(5):
            po_id = str(uuid.uuid4())
            po_no = f"PO-2026-{1000+i}"
            supplier = random.choice(suppliers)
            await db.execute("""
                INSERT INTO "Order" (id, "orderNumber", status, "approvalStatus", "totalAmount", "supplierId", "tenantId", "createdAt", "updatedAt")
                VALUES ($1, $2, 'RECEIVED', 'APPROVED', 0, $3, $4, $5, $5)
            """, po_id, po_no, supplier, tenant_id, datetime.now() - timedelta(days=20-i))
            
            total_val = 0
            for p in random.sample(products, 2):
                qty = random.randint(50, 200)
                await db.execute("""
                    INSERT INTO "OrderItem" (id, quantity, "receivedQuantity", "unitPrice", "orderId", "productId")
                    VALUES ($1, $2, $2, $3, $4, $5)
                """, str(uuid.uuid4()), qty, p['cost'], po_id, p['id'])
                
                # Update Stock
                await db.execute("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" + $1 WHERE id = $2", qty, p['id'])
                
                # Add/Update Warehouse Stock
                await db.execute("""
                    INSERT INTO "Stock" (id, quantity, "warehouseId", "productId", "updatedAt")
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT ("warehouseId", "productId", "batchNumber") DO UPDATE SET quantity = "Stock".quantity + $2
                """, str(uuid.uuid4()), qty, wh_id, p['id'])
                
                total_val += qty * p['cost']
                
            await db.execute("UPDATE \"Order\" SET \"totalAmount\" = $1 WHERE id = $2", total_val, po_id)
            
            # Log to Daybook as Expense (Outflow)
            await db.execute("""
                INSERT INTO "Daybook" (id, type, description, credit, "referenceId", "tenantId", status, "date")
                VALUES ($1, 'EXPENSE', $2, $3, $4, $5, 'POSTED', $6)
            """, str(uuid.uuid4()), f"PO Payment: {po_no}", total_val, po_id, tenant_id, datetime.now() - timedelta(days=20-i))

    print("Seeded POs, Stock, and corresponding Daybook entries", flush=True)

    # 6. SALES: CUSTOMERS & TRANSACTIONS
    customers = []
    for i in range(1, 4):
        c_id = str(uuid.uuid4())
        name = f"Client {i}"
        await db.execute("""
            INSERT INTO "Customer" (id, name, "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT ("tenantId", name) DO NOTHING
        """, c_id, name, tenant_id)
        
        c_rows = await db.fetch_rows("SELECT id FROM \"Customer\" WHERE \"tenantId\" = $1 AND name = $2", tenant_id, name)
        customers.append(c_rows[0]['id'])
        
    existing_sales = await db.fetch_val("SELECT count(*) FROM \"Sale\" WHERE \"tenantId\" = $1", tenant_id)
    if existing_sales < 10:
        for i in range(15):
            sale_id = str(uuid.uuid4())
            inv_no = f"INV-2026-{2000+i}"
            cust = random.choice(customers)
            is_paid = (i % 3 != 0)
            days_ago = random.randint(0, 45)
            dt = datetime.now() - timedelta(days=days_ago)
            
            await db.execute("""
                INSERT INTO "Sale" (id, "invoiceNo", "totalAmount", "taxAmount", "customerId", "tenantId", "isPaid", "createdAt", "updatedAt", "dueDate")
                VALUES ($1, $2, 0, 0, $3, $4, $5, $6, $6, $7)
            """, sale_id, inv_no, cust, tenant_id, is_paid, dt, dt + timedelta(days=15))
            
            total_sale = 0
            tax_total = 0
            for p in random.sample(products, 2):
                qty = random.randint(1, 5)
                line_val = qty * p['price']
                line_tax = line_val * 0.18
                await db.execute("""
                    INSERT INTO "SaleItem" (id, quantity, "unitPrice", "taxAmount", "saleId", "productId")
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, str(uuid.uuid4()), qty, p['price'], line_tax, sale_id, p['id'])
                
                # Update Stock
                await db.execute("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" - $1 WHERE id = $2", qty, p['id'])
                
                total_sale += line_val + line_tax
                tax_total += line_tax
                
            await db.execute("UPDATE \"Sale\" SET \"totalAmount\" = $1, \"taxAmount\" = $2 WHERE id = $3", total_sale, tax_total, sale_id)
            
            if is_paid:
                await db.execute("""
                    INSERT INTO "Daybook" (id, type, description, debit, "referenceId", "tenantId", status, "date")
                    VALUES ($1, 'INCOME', $2, $3, $4, $5, 'POSTED', $6)
                """, str(uuid.uuid4()), f"Sales Revenue: {inv_no}", total_sale, sale_id, tenant_id, dt)
                
            await db.execute("""
                INSERT INTO "GSTLog" (id, type, amount, "referenceId", "tenantId", "isPaid")
                VALUES ($1, 'OUTPUT', $2, $3, $4, $5)
            """, str(uuid.uuid4()), tax_total, sale_id, tenant_id, is_paid)

    print("Seeded Sales, Aging Data, and Revenue entries", flush=True)

    # 7. HR: ATTENDANCE & PAYROLL
    for emp in employees:
        # Check attendance
        exists = await db.fetch_val("SELECT count(*) FROM \"Attendance\" WHERE \"employeeId\" = $1", emp['id'])
        if exists < 10:
            for d in range(30):
                att_id = str(uuid.uuid4())
                dt = datetime.now().date() - timedelta(days=d)
                status = 'PRESENT' if d % 7 != 0 else 'ABSENT'
                await db.execute("""
                    INSERT INTO "Attendance" (id, "employeeId", date, status)
                    VALUES ($1, $2, $3, $4)
                """, att_id, emp['id'], dt, status)
                
            payroll_id = str(uuid.uuid4())
            net = emp['salary'] * 0.95
            await db.execute("""
                INSERT INTO "Payroll" (id, "employeeId", month, amount, "totalPayout", status, "updatedAt")
                VALUES ($1, $2, 'January', $3, $4, 'PAID', NOW())
            """, payroll_id, emp['id'], emp['salary'], net)
            
            await db.execute("""
                INSERT INTO "Daybook" (id, type, description, debit, "referenceId", "tenantId", status, "date")
                VALUES ($1, 'EXPENSE', $2, $3, $4, $5, 'POSTED', $6)
            """, str(uuid.uuid4()), f"Payroll Jan 2026: {emp['name']}", net, payroll_id, tenant_id, datetime.now())

    print("Seeded Attendance and Payroll records", flush=True)

    # 8. FINANCE: RECURRING & RETURNS
    await db.execute("""
        INSERT INTO "RecurringExpense" (id, name, "baseAmount", category, "isActive", "tenantId")
        VALUES ($1, 'Office Rent', 50000, 'RENT', true, $2),
               ($3, 'Software Subscriptions', 12000, 'TECH', true, $2)
        ON CONFLICT ("tenantId", name) DO NOTHING
    """, str(uuid.uuid4()), tenant_id, str(uuid.uuid4()))
    
    sample_sale = await db.fetch_rows("SELECT id, \"invoiceNo\", \"totalAmount\" FROM \"Sale\" WHERE \"isPaid\" = true AND \"tenantId\" = $1 LIMIT 1", tenant_id)
    if sample_sale:
        s = sample_sale[0]
        # Check if already has a return
        ret_exists = await db.fetch_val("SELECT 1 FROM \"SalesReturn\" WHERE \"saleId\" = $1", s['id'])
        if not ret_exists:
            return_id = str(uuid.uuid4())
            refund = float(s['totalAmount']) * 0.5
            await db.execute("""
                INSERT INTO "SalesReturn" (id, "saleId", "totalRefund", "tenantId", "returnDate")
                VALUES ($1, $2, $3, $4, NOW())
            """, return_id, s['id'], refund, tenant_id)
            
            await db.execute("""
                INSERT INTO "Daybook" (id, type, description, debit, "referenceId", "tenantId", status)
                VALUES ($1, 'EXPENSE', $2, $3, $4, $5, 'POSTED')
            """, str(uuid.uuid4()), f"Refund: {s['invoiceNo']}", refund, return_id, tenant_id)

    print("Seeded Recurring Expenses and Sales Returns", flush=True)
    print("-" * 50, flush=True)
    print(f"ARCHITECT SEED COMPLETE: Tenant Slug: {slug}", flush=True)
    print("-" * 50, flush=True)

if __name__ == "__main__":
    asyncio.run(seed_master_data())
