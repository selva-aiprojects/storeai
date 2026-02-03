import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print(f"{'SKU':<15} | {'In':<5} | {'Out':<5} | {'Type':<10} | {'Date'}")
        print("-" * 60)
        
        rows = await conn.fetch("""
            SELECT p.sku, sl."quantityIn", sl."quantityOut", sl."transactionType", sl."transactionDate"
            FROM "StockLedger" sl
            JOIN "Product" p ON sl."productId" = p.id
            WHERE sl."transactionDate" > NOW() - INTERVAL '7 days'
            ORDER BY sl."transactionDate" DESC
        """)
        
        for r in rows:
            print(f"{r['sku']:<15} | {r['quantityIn']:<5} | {r['quantityOut']:<5} | {r['transactionType']:<10} | {r['transactionDate']}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
