import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def diagnose():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # 1. Tenants
        tenants = await conn.fetch('SELECT id, name, slug FROM "Tenant"')
        print("--- ALL TENANTS ---")
        t_map = {}
        for t in tenants:
            t_map[t['id']] = t['slug']
            print(f"Slug: {t['slug']:20} | ID: {t['id']}")
            
        # 2. Products with stock > 0
        products = await conn.fetch("""
            SELECT p.name, p.sku, p."stockQuantity", p."tenantId"
            FROM "Product" p
            WHERE p."stockQuantity" > 0 OR p.sku IN ('SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D')
            ORDER BY p."tenantId"
        """)
        print("\n--- PRODUCT STOCK STATUS ---")
        for p in products:
            slug = t_map.get(p['tenantId'], "Unknown")
            print(f"Tenant: {slug:20} | SKU: {p['sku']:10} | Qty: {p['stockQuantity']:5} | Name: {p['name']}")
            
        # 3. Recent StockLedger entries (last 50)
        ledger = await conn.fetch("""
            SELECT sl.*, p.sku, p.name
            FROM "StockLedger" sl
            JOIN "Product" p ON sl."productId" = p.id
            ORDER BY sl."transactionDate" DESC
            LIMIT 20
        """)
        print("\n--- RECENT STOCK MOVEMENT ---")
        for l in ledger:
            print(f"Date: {l['transactionDate']} | SKU: {l['sku']:10} | Type: {l['transactionType']:10} | In: {l['quantityIn']:4} | Out: {l['quantityOut']:4} | Bal: {l['balanceQuantity']:4}")
            
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(diagnose())
