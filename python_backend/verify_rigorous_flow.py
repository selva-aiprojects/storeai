import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def verify_rigorous():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        row = await conn.fetchrow('''
            SELECT 
                p.name as product, 
                p.sku, 
                o."orderNumber" as po_no, 
                g."grnNumber" as grn_no, 
                e."firstName" || ' ' || e."lastName" as received_by,
                d.name as department
            FROM "Product" p 
            JOIN "OrderItem" oi ON p.id = oi."productId" 
            JOIN "Order" o ON oi."orderId" = o.id 
            JOIN "GoodsReceipt" g ON o.id = g."orderId" 
            JOIN "Employee" e ON g."receivedById" = e.id 
            JOIN "Department" d ON e."departmentId" = d.id
            WHERE p."tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'storeai')
        ''')
        if row:
            print(f"VERIFICATION SUCCESSFUL:")
            print(f"- Product: {row['product']} ({row['sku']})")
            print(f"- PO No: {row['po_no']}")
            print(f"- GRN No: {row['grn_no']}")
            print(f"- Received By: {row['received_by']} ({row['department']})")
        else:
            print("No data found for rigorous flow.")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(verify_rigorous())
