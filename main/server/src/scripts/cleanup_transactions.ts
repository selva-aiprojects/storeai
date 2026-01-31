import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Transaction Cleanup Script
 * - Preserves all master data (Suppliers, Customers, Products, Employees, etc.)
 * - Deletes all transactional records
 * - Resets product stock quantities
 * - Maintains data integrity with proper deletion order
 */

async function cleanupTransactions(tenantId?: string) {
    console.log('🧹 Starting transaction cleanup...');
    console.log(`Tenant filter: ${tenantId || 'ALL TENANTS'}`);

    const whereClause = tenantId ? { tenantId } : {};

    try {
        await prisma.$transaction(async (tx) => {
            // Delete in proper order (respecting foreign key constraints)

            console.log('Deleting Incentive Ledgers...');
            const incentives = await tx.incentiveLedger.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${incentives.count} incentive ledger entries`);

            console.log('Deleting Ledger Entries...');
            const ledgerEntries = await tx.ledgerEntry.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${ledgerEntries.count} ledger entries`);

            console.log('Deleting Daybook entries...');
            const daybooks = await tx.daybook.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${daybooks.count} daybook entries`);

            console.log('Deleting Sales Registers...');
            const salesRegisters = await tx.salesRegister.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${salesRegisters.count} sales registers`);

            console.log('Deleting Stock Ledgers...');
            const stockLedgers = await tx.stockLedger.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${stockLedgers.count} stock ledger entries`);

            console.log('Deleting Sales Return Items...');
            const salesReturnItems = await tx.salesReturnItem.deleteMany({});
            console.log(`✓ Deleted ${salesReturnItems.count} sales return items`);

            console.log('Deleting Sales Returns...');
            const salesReturns = await tx.salesReturn.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${salesReturns.count} sales returns`);

            console.log('Deleting Purchase Return Items...');
            const purchaseReturnItems = await tx.purchaseReturnItem.deleteMany({});
            console.log(`✓ Deleted ${purchaseReturnItems.count} purchase return items`);

            console.log('Deleting Purchase Returns...');
            const purchaseReturns = await tx.purchaseReturn.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${purchaseReturns.count} purchase returns`);

            console.log('Deleting Sale Items...');
            const saleItems = await tx.saleItem.deleteMany({});
            console.log(`✓ Deleted ${saleItems.count} sale items`);

            console.log('Deleting Payments...');
            const payments = await tx.payment.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${payments.count} payments`);

            console.log('Deleting Sales...');
            const sales = await tx.sale.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${sales.count} sales`);

            console.log('Deleting Goods Receipt Items...');
            const grnItems = await tx.goodsReceiptItem.deleteMany({});
            console.log(`✓ Deleted ${grnItems.count} GRN items`);

            console.log('Deleting Goods Receipts...');
            const grns = await tx.goodsReceipt.deleteMany({});
            console.log(`✓ Deleted ${grns.count} goods receipts`);

            console.log('Deleting Order Items...');
            const orderItems = await tx.orderItem.deleteMany({});
            console.log(`✓ Deleted ${orderItems.count} order items`);

            console.log('Deleting Orders...');
            const orders = await tx.order.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${orders.count} purchase orders`);

            console.log('Deleting Payrolls...');
            const payrolls = await tx.payroll.deleteMany({});
            console.log(`✓ Deleted ${payrolls.count} payroll entries`);

            console.log('Deleting Attendance records...');
            const attendance = await tx.attendance.deleteMany({});
            console.log(`✓ Deleted ${attendance.count} attendance records`);

            console.log('Deleting Product Batches...');
            const batches = await tx.productBatch.deleteMany({});
            console.log(`✓ Deleted ${batches.count} product batches`);

            console.log('Deleting Stock records...');
            const stocks = await tx.stock.deleteMany({});
            console.log(`✓ Deleted ${stocks.count} stock records`);

            console.log('Resetting product stock quantities...');
            const resetStock = await tx.product.updateMany({
                where: whereClause,
                data: { stockQuantity: 0 }
            });
            console.log(`✓ Reset stock for ${resetStock.count} products`);

            console.log('Deleting Activity Logs...');
            const activityLogs = await tx.activityLog.deleteMany({ where: whereClause });
            console.log(`✓ Deleted ${activityLogs.count} activity logs`);

        }, { timeout: 60000 });

        console.log('\n✅ Transaction cleanup completed successfully!');
        console.log('📋 Master data preserved (Suppliers, Customers, Products, Employees, etc.)');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// CLI execution
if (require.main === module) {
    const tenantId = process.argv[2]; // Optional tenant ID argument
    cleanupTransactions(tenantId)
        .then(() => {
            console.log('Script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

export { cleanupTransactions };
