import asyncpg
import asyncio
import os
from dotenv import load_dotenv

load_dotenv('main/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

async def check_sales():
    conn = await asyncpg.connect(DATABASE_URL)
    
    tenant = await conn.fetchrow('SELECT id FROM "Tenant" WHERE slug = $1', 'storeai')
    tenant_id = tenant['id']
    
    print("SALES DATA CHECK")
    print("=" * 60)
    
    sales = await conn.fetch(
        'SELECT "invoiceNo", "totalAmount", "isPaid", "gstAmount", "createdAt" FROM "Sale" WHERE "tenantId" = $1',
        tenant_id
    )
    
    print(f"\nTotal Sales: {len(sales)}")
    for s in sales:
        print(f"  Invoice: {s['invoiceNo']}")
        print(f"  Amount: ${s['totalAmount']}")
        print(f"  GST: ${s['gstAmount']}")
        print(f"  Paid? {s['isPaid']}")
        print(f"  Date: {s['createdAt']}")
        print()
    
    unpaid_count = sum(1 for s in sales if not s['isPaid'])
    print(f"Unpaid Sales (Receivables): {unpaid_count}")
    
    print("\n" + "=" * 60)
    print("GST LOG CHECK")
    print("=" * 60)
    
    gst_logs = await conn.fetch('SELECT * FROM "GSTLog" WHERE "tenantId" = $1', tenant_id)
    print(f"\nGST Log Records: {len(gst_logs)}")
    
    if len(gst_logs) == 0:
        print("  [PROBLEM] No GST logs found!")
        print("  Expected: GST logs should be created when sales/purchases happen")
    else:
        for g in gst_logs:
            print(f"  Type: {g['type']}, Amount: ${g['amount']}, Date: {g['date']}")
    
    await conn.close()

asyncio.run(check_sales())
