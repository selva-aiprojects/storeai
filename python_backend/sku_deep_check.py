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

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        targets = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
        print(f"Investigating SKUs: {targets}")
        
        for sku in targets:
            print(f"\n>>> {sku} <<<")
            p_rows = await conn.fetch('SELECT * FROM "Product" WHERE sku = $1', sku)
            if not p_rows:
                print("  NOT FOUND in Product table")
                continue
            
            for p in p_rows:
                p_id = p['id']
                print(f"  Product ID: {p_id} | Name: {p['name']} | StockQuantity: {p['stockQuantity']} | Tenant: {p['tenantId']}")
                
                # Check Stock table
                s_rows = await conn.fetch('SELECT * FROM "Stock" WHERE "productId" = $1', p_id)
                print(f"  Stock Table Records: {len(s_rows)}")
                for s in s_rows:
                    print(f"    Warehouse: {s['warehouseId']} | Qty: {s['quantity']}")
                
                # Check ProductBatch
                b_rows = await conn.fetch('SELECT * FROM "ProductBatch" WHERE "productId" = $1', p_id)
                print(f"  ProductBatch Records: {len(b_rows)}")
                for b in b_rows:
                    print(f"    Batch: {b.get('batchNumber', 'N/A')} | Qty: {b.get('quantity', 0)} | Bal: {b.get('balanceQuantity', 'N/A')}")
                
                # Check StockLedger (last 5)
                l_rows = await conn.fetch('SELECT * FROM "StockLedger" WHERE "productId" = $1 ORDER BY "transactionDate" DESC LIMIT 5', p_id)
                print(f"  StockLedger Records: {len(l_rows)}")
                for l in l_rows:
                    print(f"    {l['transactionDate']} | {l['transactionType']} | In: {l['quantityIn']} | Out: {l['quantityOut']} | Bal: {l['balanceQuantity']}")

        # ALSO: Search for these names in ANY tenant
        names = ['Enterprise Switch', 'High-End Server Rack', 'Cisco Catalyst 9200L', 'HPE ProLiant DL380 Gen11']
        print("\n\nSearching by Name across all tenants:")
        for name in names:
            n_rows = await conn.fetch('SELECT id, name, sku, "stockQuantity", "tenantId" FROM "Product" WHERE name ILIKE $1', f"%{name}%")
            for nr in n_rows:
                print(f"  Found: {nr['name']} | SKU: {nr['sku']} | Qty: {nr['stockQuantity']} | Tenant: {nr['tenantId']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
