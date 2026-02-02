import asyncpg
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('main/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

async def verify_data_integrity():
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("=" * 70)
    print("DATABASE INTEGRITY CHECK FOR STOREAI CORPORATE HUB")
    print("=" * 70)
    
    # Get StoreAI Corporate Hub tenant info
    tenant = await conn.fetchrow(
        'SELECT id, name, slug, status FROM "Tenant" WHERE slug = $1',
        'storeai'
    )
    
    if not tenant:
        print("[ERROR] 'storeai' tenant not found!")
        await conn.close()
        return
    
    tenant_id = tenant['id']
    print(f"\n[OK] Tenant Found:")
    print(f"   ID: {tenant_id}")
    print(f"   Name: {tenant['name']}")
    print(f"   Status: {tenant['status']}")
    
    print("\n" + "=" * 70)
    print("FOREIGN KEY VALIDATION")
    print("=" * 70)
    
    # Check Products
    products = await conn.fetch(
        'SELECT id, name, sku, "categoryId", "tenantId" FROM "Product" WHERE "tenantId" = $1 AND "isDeleted" = false',
        tenant_id
    )
    print(f"\n1. Products: {len(products)} found")
    for p in products:
        # Check if category exists
        if p['categoryId']:
            cat = await conn.fetchrow('SELECT name FROM "Category" WHERE id = $1', p['categoryId'])
            if cat:
                print(f"   [OK] {p['name']} -> Category: {cat['name']}")
            else:
                print(f"   [ERROR] {p['name']} -> MISSING Category ID: {p['categoryId']}")
        else:
            print(f"   [WARN] {p['name']} -> No category assigned")
    
    # Check Stock
    print(f"\n2. Stock Levels:")
    stock = await conn.fetch(
        '''SELECT s.*, p.name as product_name 
           FROM "Stock" s 
           JOIN "Product" p ON s."productId" = p.id 
           WHERE p."tenantId" = $1''',
        tenant_id
    )
    print(f"   {len(stock)} stock records found")
    for s in stock:
        print(f"   [OK] {s['product_name']}: {s['quantity']} units")
    
    # Check orphaned stock (stock without valid product)
    orphaned_stock = await conn.fetch(
        '''SELECT s.* FROM "Stock" s 
           LEFT JOIN "Product" p ON s."productId" = p.id 
           WHERE p.id IS NULL'''
    )
    if orphaned_stock:
        print(f"   [ERROR] {len(orphaned_stock)} orphaned stock records found!")
    else:
        print(f"   [OK] No orphaned stock records")
    
    # Check Sales
    print(f"\n3. Sales:")
    sales = await conn.fetch(
        'SELECT id, "invoiceNo", "totalAmount", "customerId" FROM "Sale" WHERE "tenantId" = $1 LIMIT 5',
        tenant_id
    )
    print(f"   {len(sales)} sales records found")
    for sale in sales:
        customer = await conn.fetchrow('SELECT name FROM "Customer" WHERE id = $1', sale['customerId'])
        if customer:
            print(f"   [OK] Invoice {sale['invoiceNo']} -> Customer: {customer['name']}")
        else:
            print(f"   [ERROR] Invoice {sale['invoiceNo']} -> MISSING Customer")
    
    # Check SaleItems
    print(f"\n4. Sale Items:")
    sale_items = await conn.fetch(
        '''SELECT si.*, p.name as product_name, s."invoiceNo"
           FROM "SaleItem" si
           JOIN "Sale" s ON si."saleId" = s.id
           JOIN "Product" p ON si."productId" = p.id
           WHERE s."tenantId" = $1
           LIMIT 5''',
        tenant_id
    )
    print(f"   {len(sale_items)} sale item records found")
    for item in sale_items:
        print(f"   [OK] Invoice {item['invoiceNo']} -> Product: {item['product_name']} (Qty: {item['quantity']})")
    
    # Check for orphaned sale items
    orphaned_items = await conn.fetch(
        '''SELECT si.* FROM "SaleItem" si
           LEFT JOIN "Sale" s ON si."saleId" = s.id
           WHERE s.id IS NULL'''
    )
    if orphaned_items:
        print(f"   [ERROR] {len(orphaned_items)} orphaned sale items found!")
    else:
        print(f"   [OK] No orphaned sale items")
    
    # Check Employees & Departments
    print(f"\n5. Employees:")
    employees = await conn.fetch(
        '''SELECT e.*, d.name as dept_name 
           FROM "Employee" e
           LEFT JOIN "Department" d ON e."departmentId" = d.id
           WHERE e."tenantId" = $1
           LIMIT 5''',
        tenant_id
    )
    print(f"   {len(employees)} employee records found")
    for emp in employees:
        if emp['dept_name']:
            print(f"   [OK] {emp['firstName']} {emp['lastName']} -> Dept: {emp['dept_name']}")
        else:
            print(f"   [WARN] {emp['firstName']} {emp['lastName']} -> No department assigned")
    
    print("\n" + "=" * 70)
    print("TENANT DATA ISOLATION CHECK")
    print("=" * 70)
    
    # Check if products have correct tenantId
    wrong_tenant_products = await conn.fetch(
        'SELECT name, "tenantId" FROM "Product" WHERE "tenantId" != $1 AND "isDeleted" = false',
        tenant_id
    )
    if wrong_tenant_products:
        print(f"   [WARN] Found {len(wrong_tenant_products)} products in other tenants")
    else:
        print(f"   [OK] All products belong to correct tenant")
    
    # Summary counts
    print("\n" + "=" * 70)
    print("DATA SUMMARY FOR STOREAI CORPORATE HUB")
    print("=" * 70)
    
    summary = {
        "Products": await conn.fetchval('SELECT COUNT(*) FROM "Product" WHERE "tenantId" = $1 AND "isDeleted" = false', tenant_id),
        "Categories": await conn.fetchval('SELECT COUNT(*) FROM "Category" WHERE "tenantId" = $1', tenant_id),
        "Stock Records": await conn.fetchval('SELECT COUNT(*) FROM "Stock" s JOIN "Product" p ON s."productId" = p.id WHERE p."tenantId" = $1', tenant_id),
        "Customers": await conn.fetchval('SELECT COUNT(*) FROM "Customer" WHERE "tenantId" = $1', tenant_id),
        "Sales": await conn.fetchval('SELECT COUNT(*) FROM "Sale" WHERE "tenantId" = $1', tenant_id),
        "Sale Items": await conn.fetchval('SELECT COUNT(*) FROM "SaleItem" si JOIN "Sale" s ON si."saleId" = s.id WHERE s."tenantId" = $1', tenant_id),
        "Employees": await conn.fetchval('SELECT COUNT(*) FROM "Employee" WHERE "tenantId" = $1', tenant_id),
        "Departments": await conn.fetchval('SELECT COUNT(*) FROM "Department" WHERE "tenantId" = $1', tenant_id),
    }
    
    for key, value in summary.items():
        print(f"   {key}: {value}")
    
    await conn.close()
    print("\n[OK] Database integrity check complete!\n")

if __name__ == "__main__":
    asyncio.run(verify_data_integrity())


async def verify_data_integrity():
    conn = await asyncpg.connect(DATABASE_URL)
    
    print("=" * 70)
    print("DATABASE INTEGRITY CHECK FOR STOREAI CORPORATE HUB")
    print("=" * 70)
    
    # Get StoreAI Corporate Hub tenant info
    tenant = await conn.fetchrow(
        'SELECT id, name, slug, status FROM "Tenant" WHERE slug = $1',
        'storeai'
    )
    
    if not tenant:
        print("❌ ERROR: 'storeai' tenant not found!")
        await conn.close()
        return
    
    tenant_id = tenant['id']
    print(f"\n✅ Tenant Found:")
    print(f"   ID: {tenant_id}")
    print(f"   Name: {tenant['name']}")
    print(f"   Status: {tenant['status']}")
    
    print("\n" + "=" * 70)
    print("FOREIGN KEY VALIDATION")
    print("=" * 70)
    
    # Check Products
    products = await conn.fetch(
        'SELECT id, name, sku, "categoryId", "tenantId" FROM "Product" WHERE "tenantId" = $1 AND "isDeleted" = false',
        tenant_id
    )
    print(f"\n1. Products: {len(products)} found")
    for p in products:
        # Check if category exists
        if p['categoryId']:
            cat = await conn.fetchrow('SELECT name FROM "Category" WHERE id = $1', p['categoryId'])
            if cat:
                print(f"   ✅ {p['name']} → Category: {cat['name']}")
            else:
                print(f"   ❌ {p['name']} → MISSING Category ID: {p['categoryId']}")
        else:
            print(f"   ⚠️  {p['name']} → No category assigned")
    
    # Check Stock
    print(f"\n2. Stock Levels:")
    stock = await conn.fetch(
        '''SELECT s.*, p.name as product_name 
           FROM "Stock" s 
           JOIN "Product" p ON s."productId" = p.id 
           WHERE p."tenantId" = $1''',
        tenant_id
    )
    print(f"   {len(stock)} stock records found")
    for s in stock:
        print(f"   ✅ {s['product_name']}: {s['quantity']} units")
    
    # Check orphaned stock (stock without valid product)
    orphaned_stock = await conn.fetch(
        '''SELECT s.* FROM "Stock" s 
           LEFT JOIN "Product" p ON s."productId" = p.id 
           WHERE p.id IS NULL'''
    )
    if orphaned_stock:
        print(f"   ❌ {len(orphaned_stock)} orphaned stock records found!")
    else:
        print(f"   ✅ No orphaned stock records")
    
    # Check Sales
    print(f"\n3. Sales:")
    sales = await conn.fetch(
        'SELECT id, "invoiceNo", "totalAmount", "customerId" FROM "Sale" WHERE "tenantId" = $1 LIMIT 5',
        tenant_id
    )
    print(f"   {len(sales)} sales records found")
    for sale in sales:
        customer = await conn.fetchrow('SELECT name FROM "Customer" WHERE id = $1', sale['customerId'])
        if customer:
            print(f"   ✅ Invoice {sale['invoiceNo']} → Customer: {customer['name']}")
        else:
            print(f"   ❌ Invoice {sale['invoiceNo']} → MISSING Customer")
    
    # Check SaleItems
    print(f"\n4. Sale Items:")
    sale_items = await conn.fetch(
        '''SELECT si.*, p.name as product_name, s."invoiceNo"
           FROM "SaleItem" si
           JOIN "Sale" s ON si."saleId" = s.id
           JOIN "Product" p ON si."productId" = p.id
           WHERE s."tenantId" = $1
           LIMIT 5''',
        tenant_id
    )
    print(f"   {len(sale_items)} sale item records found")
    for item in sale_items:
        print(f"   ✅ Invoice {item['invoiceNo']} → Product: {item['product_name']} (Qty: {item['quantity']})")
    
    # Check for orphaned sale items
    orphaned_items = await conn.fetch(
        '''SELECT si.* FROM "SaleItem" si
           LEFT JOIN "Sale" s ON si."saleId" = s.id
           WHERE s.id IS NULL'''
    )
    if orphaned_items:
        print(f"   ❌ {len(orphaned_items)} orphaned sale items found!")
    else:
        print(f"   ✅ No orphaned sale items")
    
    # Check Employees & Departments
    print(f"\n5. Employees:")
    employees = await conn.fetch(
        '''SELECT e.*, d.name as dept_name 
           FROM "Employee" e
           LEFT JOIN "Department" d ON e."departmentId" = d.id
           WHERE e."tenantId" = $1
           LIMIT 5''',
        tenant_id
    )
    print(f"   {len(employees)} employee records found")
    for emp in employees:
        if emp['dept_name']:
            print(f"   ✅ {emp['firstName']} {emp['lastName']} → Dept: {emp['dept_name']}")
        else:
            print(f"   ⚠️  {emp['firstName']} {emp['lastName']} → No department assigned")
    
    print("\n" + "=" * 70)
    print("TENANT DATA ISOLATION CHECK")
    print("=" * 70)
    
    # Check if products have correct tenantId
    wrong_tenant_products = await conn.fetch(
        'SELECT name, "tenantId" FROM "Product" WHERE "tenantId" != $1 AND "isDeleted" = false',
        tenant_id
    )
    if wrong_tenant_products:
        print(f"   ⚠️  Found {len(wrong_tenant_products)} products in other tenants")
    else:
        print(f"   ✅ All products belong to correct tenant")
    
    # Summary counts
    print("\n" + "=" * 70)
    print("DATA SUMMARY FOR STOREAI CORPORATE HUB")
    print("=" * 70)
    
    summary = {
        "Products": await conn.fetchval('SELECT COUNT(*) FROM "Product" WHERE "tenantId" = $1 AND "isDeleted" = false', tenant_id),
        "Categories": await conn.fetchval('SELECT COUNT(*) FROM "Category" WHERE "tenantId" = $1', tenant_id),
        "Stock Records": await conn.fetchval('SELECT COUNT(*) FROM "Stock" s JOIN "Product" p ON s."productId" = p.id WHERE p."tenantId" = $1', tenant_id),
        "Customers": await conn.fetchval('SELECT COUNT(*) FROM "Customer" WHERE "tenantId" = $1', tenant_id),
        "Sales": await conn.fetchval('SELECT COUNT(*) FROM "Sale" WHERE "tenantId" = $1', tenant_id),
        "Sale Items": await conn.fetchval('SELECT COUNT(*) FROM "SaleItem" si JOIN "Sale" s ON si."saleId" = s.id WHERE s."tenantId" = $1', tenant_id),
        "Employees": await conn.fetchval('SELECT COUNT(*) FROM "Employee" WHERE "tenantId" = $1', tenant_id),
        "Departments": await conn.fetchval('SELECT COUNT(*) FROM "Department" WHERE "tenantId" = $1', tenant_id),
    }
    
    for key, value in summary.items():
        print(f"   {key}: {value}")
    
    await conn.close()
    print("\n✅ Database integrity check complete!\n")

if __name__ == "__main__":
    asyncio.run(verify_data_integrity())
