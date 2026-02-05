import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING COMPLETE DATABASE WIPE ---');

    // Order is important if not using CASCADE, but Prisma doesn't support TRUNCATE CASCADE directly in many API calls.
    // We will use raw SQL for efficiency and to handle dependencies.

    const tablenames = [
        'ActivityLog', 'AuditLog', 'PurchaseReturnItem', 'PurchaseReturn',
        'SalesReturnItem', 'SalesReturn', 'StockLedger', 'SalesRegister',
        'OrderItem', 'Order', 'GoodsReceiptItem', 'GoodsReceipt',
        'InventoryDocumentItem', 'InventoryDocument', 'DealItem', 'Activity',
        'Deal', 'SalesOrderItem', 'SalesOrder', 'SaleItem', 'Sale',
        'Stock', 'ProductBatch', 'Product', 'PricingRule', 'Category',
        'SupplierAgreement', 'Supplier', 'Customer', 'Warehouse',
        'IncentiveLedger', 'Payroll', 'Attendance', 'Leave', 'SalaryStructure',
        'Employee', 'Department', 'LedgerEntry', 'ChartOfAccounts', 'Ledger',
        'Daybook', 'GSTLog', 'RecurringExpense', 'PurchaseRequisitionItem',
        'PurchaseRequisition', 'PurchaseQuotation', 'UserTenant', 'User',
        'Role', 'Permission', 'Tenant', 'Plan'
    ];

    console.log(`Tables to wipe: ${tablenames.length}`);

    try {
        // We will truncate all tables in a single command with CASCADE to handle dependencies
        const query = tablenames.map(t => `"${t}"`).join(', ');
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${query} RESTART IDENTITY CASCADE;`);

        // Handle implicit tables
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "_PermissionToRole" RESTART IDENTITY CASCADE;`);

        console.log('✔ All tables truncated successfully.');
        console.log('--- DATABASE WIPE COMPLETE ---');
    } catch (error) {
        console.error('Error during wipe:', (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
