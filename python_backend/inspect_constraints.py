import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def inspect_constraints():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        tables = ['Tenant', 'Warehouse', 'Category', 'Product', 'User', 'ChartOfAccounts']
        for table in tables:
            print(f"\n--- Constraints for {table} ---")
            rows = await conn.fetch(f"""
                SELECT conname, pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE contype IN ('u', 'p') AND conrelid = '"{table}"'::regclass
            """)
            for r in rows:
                print(f"{r['conname']}: {r['pg_get_constraintdef']}")
            
            print(f"--- Indexes for {table} ---")
            idx_rows = await conn.fetch(f"""
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = '{table}'
            """)
            for r in idx_rows:
                print(f"{r['indexname']}: {r['indexdef']}")
                
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(inspect_constraints())
