import asyncpg
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('main/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

async def check_schema_and_data():
    conn = await asyncpg.connect(DATABASE_URL)
    
    tenant = await conn.fetchrow('SELECT id FROM "Tenant" WHERE slug = $1', 'storeai')
    tenant_id = tenant['id']
    
    print("CHECKING WHY FINANCE PAGES SHOW NO DATA")
    print("=" * 70)
    
    # 1. Check Sales table structure
    print("\n1. SALES TABLE COLUMNS:")
    columns = await conn.fetch(
        """SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = 'Sale' 
           ORDER BY ordinal_position"""
    )
    for col in columns:
        print(f"   - {col['column_name']}: {col['data_type']}")
    
    # 2. Check actual sales data
    print("\n2. SALES FOR STOREAI CORPORATE HUB:")
    sales = await conn.fetch(
        'SELECT "id", "invoiceNo", "totalAmount", "taxAmount", "isPaid", "createdAt" FROM "Sale" WHERE "tenantId" = $1',
        tenant_id
    )
    
    print(f"   Total sales: {len(sales)}")
    for s in sales:
        print(f"\n   Invoice: {s['invoiceNo']}")
        print(f"   Amount: ${s['totalAmount']}")
        print(f"   Tax: ${s.get('taxAmount', 'N/A')}")
        print(f"   isPaid: {s['isPaid']}")
    
    unpaid = [s for s in sales if not s['isPaid']]
    print(f"\n   → UNPAID SALES (Liability/Receivables): {len(unpaid)}")
    
    if len(unpaid) == 0:
        print("   [PROBLEM] All sales are marked as PAID!")
        print("   This is why Liability Tracker shows 0")
    
    # 3. Check GSTLog table
    print("\n3. GST LOG TABLE:")
    gst_table_exists = await conn.fetchval(
        """SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'GSTLog'
        )"""
    )
    
    if gst_table_exists:
        gst_logs = await conn.fetch('SELECT * FROM "GSTLog" WHERE "tenantId" = $1', tenant_id)
        print(f"   GST records: {len(gst_logs)}")
        if len(gst_logs) == 0:
            print("   [PROBLEM] No GST logs! This is why GST Compliance shows 0")
    else:
        print("   [PROBLEM] GSTLog table doesn't exist!")
    
    await conn.close()

asyncio.run(check_schema_and_data())
