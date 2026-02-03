import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import json
from datetime import datetime
from decimal import Decimal

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

class E(json.JSONEncoder):
    def default(self, o):
        if hasattr(o, "isoformat"): return o.isoformat()
        if isinstance(o, Decimal): return float(o)
        return super().default(o)

async def trace_sku(sku):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print(f"--- TRACING SKU: {sku} ---")
        
        # 1. Product Table
        products = await conn.fetch("SELECT * FROM \"Product\" WHERE sku = $1", sku)
        print(f"\n[Product Table] Found {len(products)} records")
        for p in products:
            p_dict = dict(p)
            print(f"  ID: {p_dict['id']} | Name: {p_dict['name']} | Stock: {p_dict['stockQuantity']} | Tenant: {p_dict['tenantId']}")
            
            p_id = p_dict['id']
            
            # 2. Stock Table
            stocks = await conn.fetch("SELECT * FROM \"Stock\" WHERE \"productId\" = $1", p_id)
            print(f"  [Stock Table] Found {len(stocks)} records")
            for s in stocks:
                print(f"    Warehouse: {s['warehouseId']} | Qty: {s['quantity']}")
            
            # 3. ProductBatch Table
            batches = await conn.fetch("SELECT * FROM \"ProductBatch\" WHERE \"productId\" = $1", p_id)
            print(f"  [ProductBatch] Found {len(batches)} records")
            for b in batches:
                print(f"    Batch: {b.get('batchNumber', 'N/A')} | Qty: {b.get('quantity', 0)} | Expiry: {b.get('expiryDate', 'N/A')}")

            # 4. StockLedger Table
            ledger = await conn.fetch("SELECT * FROM \"StockLedger\" WHERE \"productId\" = $1 ORDER BY \"transactionDate\" DESC LIMIT 10", p_id)
            print(f"  [StockLedger] Found {len(ledger)} recent records")
            for l in ledger:
                print(f"    Date: {l['transactionDate']} | Type: {l['transactionType']} | In: {l['quantityIn']} | Out: {l['quantityOut']} | Bal: {l['balanceQuantity']}")

        # 5. Global Search for SKU in all tables if possible?
        # Let's just check OrderItem
        orders = await conn.fetch("SELECT oi.*, o.\"orderNumber\", o.status FROM \"OrderItem\" oi JOIN \"Order\" o ON oi.\"orderId\" = o.id JOIN \"Product\" p ON oi.\"productId\" = p.id WHERE p.sku = $1", sku)
        print(f"\n[Orders] Found {len(orders)} order items for this SKU")
        for o in orders:
            print(f"  Order: {o['orderNumber']} | Qty: {o['quantity']} | Status: {o['status']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(trace_sku('SW-001'))
    asyncio.run(trace_sku('SRV-001'))
