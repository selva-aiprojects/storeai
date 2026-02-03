import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def cleanup_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        print("Starting Database Cleanup...")
        
        # 1. Truncate transactional tables
        tables_to_truncate = [
            '"Order"', '"OrderItem"', '"GoodsReceipt"', '"GoodsReceiptItem"',
            '"Sale"', '"SaleItem"', '"SalesReturn"', '"SalesReturnItem"',
            '"PurchaseReturn"', '"PurchaseReturnItem"',
            '"StockLedger"', '"LedgerEntry"', '"Daybook"', '"GSTLog"',
            '"Attendance"', '"Payroll"', '"IncentiveLedger"',
            '"InventoryDocument"', '"InventoryDocumentItem"', '"Stock"',
            '"ActivityLog"', '"AuditLog"', '"Activity"', '"Deal"', '"DealItem"',
            '"SalesOrder"', '"SalesOrderItem"', '"Payment"', '"Ledger"',
            '"_PermissionToRole"' # Re-linking will happen if needed, but usually master
        ]
        
        # Note: _PermissionToRole is usually master, but if we re-seed everything it's fine.
        # Let's stick to purely transactional ones first.
        
        transactional_tables = [
            '"Order"', '"OrderItem"', '"GoodsReceipt"', '"GoodsReceiptItem"',
            '"Sale"', '"SaleItem"', '"SalesReturn"', '"SalesReturnItem"',
            '"PurchaseReturn"', '"PurchaseReturnItem"',
            '"StockLedger"', '"LedgerEntry"', '"Daybook"', '"GSTLog"',
            '"Attendance"', '"Payroll"', '"IncentiveLedger"',
            '"InventoryDocument"', '"InventoryDocumentItem"', '"Stock"',
            '"ActivityLog"', '"AuditLog"', '"Activity"', '"Deal"', '"DealItem"',
            '"SalesOrder"', '"SalesOrderItem"', '"Payment"'
        ]

        for table in transactional_tables:
            try:
                await conn.execute(f"TRUNCATE TABLE {table} CASCADE")
                print(f"Truncated {table}")
            except Exception as e:
                print(f"Failed to truncate {table}: {e}")

        # 2. Reset Master Data
        print("Resetting Product stock levels...")
        await conn.execute("UPDATE \"Product\" SET \"stockQuantity\" = 0")
        
        print("Resetting Chart of Accounts balances...")
        await conn.execute("UPDATE \"ChartOfAccounts\" SET \"currentBalance\" = \"openingBalance\"")
        
        print("Database Cleanup Complete.")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(cleanup_db())
