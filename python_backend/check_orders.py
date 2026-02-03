import asyncio
from services.db import db

async def check_orders():
    print("--- PENDING ORDERS CHECK ---")
    target_skus = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
    
    for sku in target_skus:
        p_row = await db.fetch_rows('SELECT id, name FROM "Product" WHERE sku = $1', sku)
        if p_row:
            p = p_row[0]
            orders = await db.fetch_rows("""
                SELECT oi.quantity, o."orderNumber", o.status, o."tenantId"
                FROM "OrderItem" oi
                JOIN "Order" o ON oi."orderId" = o.id
                WHERE oi."productId" = $1
            """, p['id'])
            print(f"\nSKU: {sku} | Name: {p['name']}")
            if orders:
                for o in orders:
                    print(f"  Order: {o['orderNumber']} | Qty: {o['quantity']} | Status: {o['status']}")
            else:
                print("  No orders found.")
        else:
            print(f"\nSKU: {sku} | NOT FOUND")

if __name__ == "__main__":
    asyncio.run(check_orders())
