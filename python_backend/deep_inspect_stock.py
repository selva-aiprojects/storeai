import asyncio
from services.db import db
import json
from datetime import datetime
from decimal import Decimal

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

async def inspect_stock():
    print("--- DEEP STOCK INSPECTION ---")
    
    # 1. List Products with 0 stock but being mentioned
    products = await db.fetch_rows("""
        SELECT p.id, p.name, p.sku, p."stockQuantity", c.name as category, p."tenantId"
        FROM "Product" p
        JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."stockQuantity" = 0 OR p.name ILIKE '%Switch%' OR p.name ILIKE '%Rack%' OR p.name ILIKE '%Cisco%' OR p.name ILIKE '%HPE%'
    """)
    
    results = []
    for p in products:
        p_dict = dict(p)
        p_id = p_dict['id']
        
        # 2. Check Stock table
        stock_records = await db.fetch_rows('SELECT * FROM "Stock" WHERE "productId" = $1', p_id)
        p_dict['stock_table'] = [dict(s) for s in stock_records]
        
        # 3. Check StockLedger
        ledger_records = await db.fetch_rows('SELECT * FROM "StockLedger" WHERE "productId" = $1 ORDER BY "transactionDate" DESC LIMIT 5', p_id)
        p_dict['stock_ledger'] = [dict(l) for l in ledger_records]
        
        # 4. Check OrderItems (to see if they were ordered)
        order_items = await db.fetch_rows("""
            SELECT oi.*, o."orderNumber", o.status 
            FROM "OrderItem" oi 
            JOIN "Order" o ON oi."orderId" = o.id 
            WHERE oi."productId" = $1
        """, p_id)
        p_dict['orders'] = [dict(oi) for oi in order_items]
        
        results.append(p_dict)
    
    print(json.dumps(results, indent=2, cls=CustomEncoder))

if __name__ == "__main__":
    asyncio.run(inspect_stock())
