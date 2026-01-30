import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate_hr():
    print("Applying HR & Payroll Expansion Migration...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        async with conn.transaction():
            # 1. Update Employee table with Statutory Details
            print("Updating Employee table...")
            await conn.execute("""
                ALTER TABLE "Employee" 
                ADD COLUMN IF NOT EXISTS "pfNumber" TEXT,
                ADD COLUMN IF NOT EXISTS "esiNumber" TEXT,
                ADD COLUMN IF NOT EXISTS "insuranceNumber" TEXT,
                ADD COLUMN IF NOT EXISTS "panNumber" TEXT,
                ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
                ADD COLUMN IF NOT EXISTS "ifscCode" TEXT
            """)
            
            # 2. Create Attendance table
            print("Creating Attendance table...")
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "Attendance" (
                    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
                    "date" DATE NOT NULL,
                    "status" TEXT DEFAULT 'PRESENT', -- PRESENT, ABSENT, LEAVE, HALF_DAY
                    "checkIn" TIMESTAMP,
                    "checkOut" TIMESTAMP,
                    "overtimeMinutes" INTEGER DEFAULT 0,
                    "incentives" DECIMAL(10,2) DEFAULT 0,
                    "createdAt" TIMESTAMP DEFAULT now(),
                    UNIQUE("employeeId", "date")
                )
            """)

            # 3. Create Payroll table
            print("Creating Payroll table...")
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "Payroll" (
                    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
                    "month" INTEGER NOT NULL,
                    "year" INTEGER NOT NULL,
                    "baseSalary" DECIMAL(10,2) NOT NULL,
                    "incentives" DECIMAL(10,2) DEFAULT 0,
                    "overtimeSalary" DECIMAL(10,2) DEFAULT 0,
                    "pfAmount" DECIMAL(10,2) DEFAULT 0,
                    "esiAmount" DECIMAL(10,2) DEFAULT 0,
                    "deductions" DECIMAL(10,2) DEFAULT 0,
                    "netAmount" DECIMAL(10,2) NOT NULL,
                    "status" TEXT DEFAULT 'PENDING', -- PENDING, PAID
                    "createdAt" TIMESTAMP DEFAULT now(),
                    UNIQUE("employeeId", "month", "year")
                )
            """)

            # 4. Create Leave table
            print("Creating Leave table...")
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS "LeaveRecord" (
                    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    "employeeId" TEXT NOT NULL REFERENCES "Employee"("id") ON DELETE CASCADE,
                    "type" TEXT NOT NULL, -- CASUAL, SICK, EARNED
                    "startDate" DATE NOT NULL,
                    "endDate" DATE NOT NULL,
                    "reason" TEXT,
                    "status" TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
                    "createdAt" TIMESTAMP DEFAULT now()
                )
            """)

        print("HR & Payroll Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_hr())
