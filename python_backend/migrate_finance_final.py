import asyncio
import asyncpg
import os
import uuid
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    print("Starting Finance & Accounting Migration (TEXT ID Version)...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        async with conn.transaction():
            # 1. Update Existing Tables
            print("Updating Sale & Order tables...")
            await conn.execute("ALTER TABLE \"Order\" ADD COLUMN IF NOT EXISTS \"gstAmount\" DECIMAL(10,2) DEFAULT 0")
            await conn.execute("ALTER TABLE \"Sale\" ADD COLUMN IF NOT EXISTS \"gstAmount\" DECIMAL(10,2) DEFAULT 0")
            await conn.execute("ALTER TABLE \"Sale\" ADD COLUMN IF NOT EXISTS \"dueDate\" TIMESTAMP")

            # 2. Create New Finance Tables (using TEXT for IDs)
            print("Creating Financial tables...")
            
            # Note: We don't use REFERENCES with different types, but here they are both TEXT
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "SalesReturn" (
                    "id" TEXT PRIMARY KEY,
                    "saleId" TEXT NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
                    "returnDate" TIMESTAMP DEFAULT now(),
                    "totalRefund" DECIMAL(10,2) NOT NULL,
                    "transportDeduction" DECIMAL(10,2) DEFAULT 0,
                    "packagingDeduction" DECIMAL(10,2) DEFAULT 0,
                    "gstDeduction" DECIMAL(10,2) DEFAULT 0,
                    "condition" TEXT DEFAULT 'EXCELLENT',
                    "notes" TEXT,
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "SalesReturnItem" (
                    "id" TEXT PRIMARY KEY,
                    "salesReturnId" TEXT NOT NULL REFERENCES "SalesReturn"("id") ON DELETE CASCADE,
                    "productId" TEXT NOT NULL REFERENCES "Product"("id"),
                    "quantity" INTEGER NOT NULL,
                    "refundAmount" DECIMAL(10,2) NOT NULL
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "Daybook" (
                    "id" TEXT PRIMARY KEY,
                    "date" TIMESTAMP DEFAULT now(),
                    "type" TEXT NOT NULL,
                    "description" TEXT,
                    "debit" DECIMAL(10,2) DEFAULT 0,
                    "credit" DECIMAL(10,2) DEFAULT 0,
                    "referenceId" TEXT,
                    "status" TEXT DEFAULT 'PENDING_APPROVAL',
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "RecurringExpense" (
                    "id" TEXT PRIMARY KEY,
                    "name" TEXT NOT NULL,
                    "baseAmount" DECIMAL(10,2) NOT NULL,
                    "category" TEXT,
                    "isActive" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "GSTLog" (
                    "id" TEXT PRIMARY KEY,
                    "type" TEXT NOT NULL,
                    "amount" DECIMAL(10,2) NOT NULL,
                    "referenceId" TEXT,
                    "date" TIMESTAMP DEFAULT now(),
                    "isPaid" BOOLEAN DEFAULT false
                )
            """)

            # 3. Seed Recurring Expenses with TEXT IDs
            print("Seeding default recurring expenses...")
            expenses = [
                ('Rent', 5000.00, 'Operations'),
                ('Electricity', 450.00, 'Utilities'),
                ('Water', 80.00, 'Utilities'),
                ('Warehouse Charges', 1200.00, 'Logistics'),
                ('Staff Salary (Base)', 15000.00, 'HR')
            ]
            for name, amount, cat in expenses:
                existing = await conn.fetchval("SELECT 1 FROM \"RecurringExpense\" WHERE name = $1", name)
                if not existing:
                    new_id = str(uuid.uuid4())
                    await conn.execute("""
                        INSERT INTO "RecurringExpense" (id, name, "baseAmount", category)
                        VALUES ($1, $2, $3, $4)
                    """, new_id, name, amount, cat)

        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
