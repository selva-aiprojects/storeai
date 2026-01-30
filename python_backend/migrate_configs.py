import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate_configs():
    print("Applying Granular Configuration Migration...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        async with conn.transaction():
            # 1. Update Product table
            print("Updating Product table with GST and Returnability...")
            await conn.execute("ALTER TABLE \"Product\" ADD COLUMN IF NOT EXISTS \"gstPercentage\" DECIMAL(5,2) DEFAULT 18.00")
            await conn.execute("ALTER TABLE \"Product\" ADD COLUMN IF NOT EXISTS \"isReturnable\" BOOLEAN DEFAULT true")
            
            # 2. Update Tenant table
            print("Updating Tenant table with Credit Limits...")
            await conn.execute("ALTER TABLE \"Tenant\" ADD COLUMN IF NOT EXISTS \"maxCreditDays\" INTEGER DEFAULT 50")

        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_configs())
