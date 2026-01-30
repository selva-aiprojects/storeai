import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    print("Starting Finance & Accounting Migration...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        async with conn.transaction():
            # 1. Update ENUMs
            print("Updating ENUMs...")
            await conn.execute("ALTER TYPE \"OrderStatus\" ADD VALUE IF NOT EXISTS 'RETURNED'")
            await conn.execute("ALTER TYPE \"PaymentMethod\" ADD VALUE IF NOT EXISTS 'CREDIT'")
            
            # Create new ENUMs
            await conn.execute("""
                DO $$ BEGIN
                    CREATE TYPE "ReturnCondition" AS ENUM ('EXCELLENT', 'GOOD', 'DAMAGED', 'DEFECTIVE');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """)
            await conn.execute("""
                DO $$ BEGIN
                    CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """)

            # 2. Update Existing Tables
            print("Updating Sale & Order tables...")
            await conn.execute("ALTER TABLE \"Order\" ADD COLUMN IF NOT EXISTS \"gstAmount\" DECIMAL(10,2) DEFAULT 0")
            await conn.execute("ALTER TABLE \"Sale\" ADD COLUMN IF NOT EXISTS \"gstAmount\" DECIMAL(10,2) DEFAULT 0")
            await conn.execute("ALTER TABLE \"Sale\" ADD COLUMN IF NOT EXISTS \"dueDate\" TIMESTAMP")

            # 3. Create New Finance Tables
            print("Creating Financial tables...")
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "SalesReturn" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "saleId" UUID NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
                    "returnDate" TIMESTAMP DEFAULT now(),
                    "totalRefund" DECIMAL(10,2) NOT NULL,
                    "transportDeduction" DECIMAL(10,2) DEFAULT 0,
                    "packagingDeduction" DECIMAL(10,2) DEFAULT 0,
                    "gstDeduction" DECIMAL(10,2) DEFAULT 0,
                    "condition" "ReturnCondition" DEFAULT 'EXCELLENT',
                    "notes" TEXT,
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "SalesReturnItem" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "salesReturnId" UUID NOT NULL REFERENCES "SalesReturn"("id") ON DELETE CASCADE,
                    "productId" UUID NOT NULL REFERENCES "Product"("id"),
                    "quantity" INTEGER NOT NULL,
                    "refundAmount" DECIMAL(10,2) NOT NULL
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "Daybook" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "date" TIMESTAMP DEFAULT now(),
                    "type" TEXT NOT NULL,
                    "description" TEXT,
                    "debit" DECIMAL(10,2) DEFAULT 0,
                    "credit" DECIMAL(10,2) DEFAULT 0,
                    "referenceId" UUID,
                    "status" "TransactionStatus" DEFAULT 'PENDING_APPROVAL',
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "RecurringExpense" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "name" TEXT NOT NULL,
                    "baseAmount" DECIMAL(10,2) NOT NULL,
                    "category" TEXT,
                    "isActive" BOOLEAN DEFAULT true,
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "GSTLog" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "type" TEXT NOT NULL,
                    "amount" DECIMAL(10,2) NOT NULL,
                    "referenceId" UUID,
                    "date" TIMESTAMP DEFAULT now(),
                    "isPaid" BOOLEAN DEFAULT false
                )
            """)

            # 4. Seed Recurring Expenses
            print("Seeding default recurring expenses...")
            expenses = [
                ('Rent', 5000.00, 'Operations'),
                ('Electricity', 450.00, 'Utilities'),
                ('Water', 80.00, 'Utilities'),
                ('Warehouse Charges', 1200.00, 'Logistics'),
                ('Staff Salary (Base)', 15000.00, 'HR')
            ]
            for name, amount, cat in expenses:
                await conn.execute("""
                    INSERT INTO "RecurringExpense" (name, "baseAmount", category)
                    SELECT $1, $2, $3
                    WHERE NOT EXISTS (SELECT 1 FROM "RecurringExpense" WHERE name = $1)
                """, name, amount, cat)

        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
