import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        targets = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
        print(f"{'SKU':<15} | {'Type':<10} | {'In':<5} | {'Out':<5} | {'Bal':<5} | {'Date'}")
        print("-" * 70)
        
        rows = await conn.fetch("""
            SELECT p.sku, sl."transactionType", sl."quantityIn", sl."quantityOut", sl."balanceQuantity", sl."transactionDate"
            FROM "StockLedger" sl
            JOIN "Product" p ON sl."productId" = p.id
            WHERE p.sku = ANY($1)
            ORDER BY sl."transactionDate" DESC
        """, targets)
        
        for r in rows:
            print(f"{r['sku']:<15} | {r['transactionType']:<10} | {r['quantityIn']:<5} | {r['quantityOut']:<5} | {r['balanceQuantity']:<5} | {r['transactionDate']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
