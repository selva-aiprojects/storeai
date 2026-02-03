import asyncio
from services.db import db
from datetime import datetime
from decimal import Decimal

async def check_grn_stock():
    print("--- GRN & WAREHOUSE STOCK CHECK ---")
    
    # Check for recent GRNs
    grns = await db.fetch_rows("""
        SELECT gr."grnNumber", o."orderNumber", gr."warehouseId"
        FROM "GoodsReceipt" gr
        JOIN "Order" o ON gr."orderId" = o.id
        LIMIT 10
    """)
    print("\n[RECENT GRNs]")
    for gr in grns:
        print(f"GRN: {gr['grnNumber']} | PO: {gr['orderNumber']} | Warehouse: {gr['warehouseId']}")
        
    # Check for Warehouse Stock
    stocks = await db.fetch_rows("""
        SELECT p.name, p.sku, s.quantity, s."warehouseId"
        FROM "Stock" s
        JOIN "Product" p ON s."productId" = p.id
        WHERE s.quantity > 0
    """)
    print("\n[WAREHOUSE STOCK (Quantity > 0)]")
    for s in stocks:
        print(f"Product: {s['name']:30} | SKU: {s['sku']:10} | Qty: {s['quantity']:5} | Warehouse: {s['warehouseId']}")

if __name__ == "__main__":
    asyncio.run(check_grn_stock())
