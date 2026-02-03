import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import json
from decimal import Decimal

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Find products where Product.stockQuantity != sum(Stock.quantity)
        query = """
            SELECT p.id, p.name, p.sku, p."stockQuantity", 
                   COALESCE(SUM(s.quantity), 0) as "warehouseStock"
            FROM "Product" p
            LEFT JOIN "Stock" s ON p.id = s."productId"
            GROUP BY p.id, p.name, p.sku, p."stockQuantity"
            HAVING p."stockQuantity" != COALESCE(SUM(s.quantity), 0)
        """
        rows = await conn.fetch(query)
        print(f"Found {len(rows)} products with sync issues:")
        for r in rows:
            print(f"  SKU: {r['sku']:10} | Name: {r['name']:20} | ProdQty: {r['stockQuantity']:5} | WHQty: {r['warehouseStock']:5}")
            
        # Also, check ANY product where WHQty > 0
        wh_stock = await conn.fetch("""
            SELECT p.name, p.sku, s.quantity, s."warehouseId", t.slug
            FROM "Stock" s
            JOIN "Product" p ON s."productId" = p.id
            JOIN "Tenant" t ON p."tenantId" = t.id
            WHERE s.quantity > 0
        """)
        print("\nProducts with stock in Warehouse table:")
        for r in wh_stock:
            print(f"  Tenant: {r['slug']:15} | SKU: {r['sku']:10} | Qty: {r['quantity']:5} | Name: {r['name']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
