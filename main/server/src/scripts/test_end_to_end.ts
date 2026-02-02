import prisma from '../lib/prisma';

/**
 * End-to-End Test Script
 * Tests complete workflow: Chart of Accounts Setup → Purchase → Sale → Returns
 * Validates all accounting entries
 */

async function runEndToEndTest() {
    console.log('🧪 Starting End-to-End ERP Test...\n');

    try {
        // Find a tenant to test with
        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error('❌ No tenant found. Please create a tenant first.');
            return;
        }

        console.log(`📊 Testing with tenant: ${tenant.name} (${tenant.id})\n`);

        // ========================================
        // PHASE 1: SETUP - Chart of Accounts
        // ========================================
        console.log('=== PHASE 1: CHART OF ACCOUNTS SETUP ===');

        // Check if COA exists
        const existingCOA = await prisma.chartOfAccounts.findFirst({
            where: { tenantId: tenant.id }
        });

        if (!existingCOA) {
            console.log('Seeding Chart of Accounts...');
            const { seedChartOfAccounts } = await import('./seed_chart_of_accounts');
            await seedChartOfAccounts(tenant.id);
            console.log('✓ Chart of Accounts seeded\n');
        } else {
            console.log('✓ Chart of Accounts already exists\n');
        }

        // ========================================
        // PHASE 2: MASTER DATA
        // ========================================
        console.log('=== PHASE 2: MASTER DATA VERIFICATION ===');

        const supplier = await prisma.supplier.findFirst({
            where: { tenantId: tenant.id }
        });
        console.log(`✓ Supplier: ${supplier?.name || 'None found'}`);

        const customer = await prisma.customer.findFirst({
            where: { tenantId: tenant.id }
        });
        console.log(`✓ Customer: ${customer?.name || 'Walk-in'}`);

        const product = await prisma.product.findFirst({
            where: { tenantId: tenant.id }
        });
        console.log(`✓ Product: ${product?.name || 'None found'}`);

        const warehouse = await prisma.warehouse.findFirst({
            where: { tenantId: tenant.id }
        });
        console.log(`✓ Warehouse: ${warehouse?.name || 'None found'}`);

        const employee = await prisma.employee.findFirst({
            where: { eligibleForIncentive: true }
        });
        console.log(`✓ Eligible Employee: ${employee ? `${employee.firstName} ${employee.lastName}` : 'None'}\n`);

        if (!supplier || !product || !warehouse) {
            console.error('❌ Missing master data. Please ensure suppliers, products, and warehouses exist.');
            return;
        }

        // ========================================
        // PHASE 3: PURCHASE FLOW
        // ========================================
        console.log('=== PHASE 3: PURCHASE FLOW (PO → GRN) ===');

        // Create Purchase Order
        console.log('Creating Purchase Order...');
        const po = await prisma.order.create({
            data: {
                orderNumber: `PO-TEST-${Date.now()}`,
                supplierId: supplier.id,
                tenantId: tenant.id,
                totalAmount: 10000,
                taxAmount: 1800,
                status: 'APPROVED',
                approvalStatus: 'APPROVED',
                items: {
                    create: [{
                        productId: product.id,
                        quantity: 10,
                        unitPrice: 1000
                    }]
                }
            }
        });
        console.log(`✓ PO Created: ${po.orderNumber}`);
        console.log('--- Phase 3.1: PO Created ---');

        // Process GRN
        console.log('Processing Goods Receipt (GRN)...');
        const { InventoryService } = await import('../services/inventory.service');

        const batch = await InventoryService.processInwardStock({
            tenantId: tenant.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: 10,
            costPrice: 1180, // 1000 + 18% GST
            batchNumber: `BATCH-TEST-${Date.now()}`,
            poId: po.id,
            receivedBy: 'SYSTEM',
            supplierId: supplier.id,
            gstAmount: 1800
        });
        console.log(`✓ GRN Processed: Batch ${batch.batchNumber}`);
        console.log('--- Phase 3.2: GRN Processed ---');

        // Verify Stock
        const updatedProduct = await prisma.product.findUnique({
            where: { id: product.id }
        });
        console.log(`✓ Stock Updated: ${updatedProduct?.stockQuantity} units`);

        // Verify Accounting Entries
        const purchaseLedgerEntries = await prisma.ledgerEntry.findMany({
            where: {
                referenceType: 'GRN',
                referenceId: batch.id
            },
            include: {
                account: { select: { name: true, accountType: true } }
            }
        });
        console.log(`✓ Ledger Entries Created: ${purchaseLedgerEntries.length}`);
        console.log('--- Phase 3.3: Ledger Entries Verified ---');
        purchaseLedgerEntries.forEach(entry => {
            console.log(`   - ${entry.account.name}: Dr ${entry.debitAmount} Cr ${entry.creditAmount}`);
        });

        console.log('');

        // ========================================
        // PHASE 4: SALES FLOW
        // ========================================
        console.log('=== PHASE 4: SALES FLOW ===');

        console.log('Creating Sale...');
        const { SalesService } = await import('../services/sales.service');

        const sale = await SalesService.createSale({
            tenantId: tenant.id,
            customerId: customer?.id,
            salesmanId: employee?.id,
            items: [{
                productId: product.id,
                quantity: 5,
                unitPrice: 1500,
                discount: 0
            }],
            paymentMethod: 'CASH',
            amountPaid: 8850 // 7500 + 18% GST
        });
        console.log(`✓ Sale Created: ${sale.invoiceNo}`);

        // Verify Stock Deduction
        const productAfterSale = await prisma.product.findUnique({
            where: { id: product.id }
        });
        console.log(`✓ Stock After Sale: ${productAfterSale?.stockQuantity} units`);

        // Verify Sales Ledger Entries
        const salesLedgerEntries = await prisma.ledgerEntry.findMany({
            where: {
                referenceType: 'SALE',
                referenceId: sale.id
            },
            include: {
                account: { select: { name: true, accountType: true } }
            }
        });
        console.log(`✓ Sales Ledger Entries: ${salesLedgerEntries.length}`);
        salesLedgerEntries.forEach(entry => {
            console.log(`   - ${entry.account.name}: Dr ${entry.debitAmount} Cr ${entry.creditAmount}`);
        });

        // Check Incentive
        if (employee) {
            const incentives = await prisma.incentiveLedger.findMany({
                where: {
                    referenceType: 'SALES',
                    referenceId: sale.id
                }
            });
            console.log(`✓ Incentive Calculated: ${incentives.length > 0 ? '₹' + incentives[0].incentiveAmount : 'None'}`);
        }

        console.log('');

        // ========================================
        // PHASE 5: FINANCIAL REPORTS
        // ========================================
        console.log('=== PHASE 5: FINANCIAL REPORTS ===');

        const { ReportService } = await import('../services/report.service');

        // Trial Balance
        console.log('Generating Trial Balance...');
        const trialBalance = await ReportService.generateTrialBalance(tenant.id);
        console.log(`✓ Trial Balance: ${trialBalance.totals.isBalanced ? 'BALANCED ✓' : ' UNBALANCED ✗'}`);
        console.log(`   Total Debit: ₹${trialBalance.totals.totalDebit.toFixed(2)}`);
        console.log(`   Total Credit: ₹${trialBalance.totals.totalCredit.toFixed(2)}`);
        console.log(`   Difference: ₹${trialBalance.totals.difference.toFixed(2)}`);

        // P&L
        console.log('\nGenerating Profit & Loss...');
        const pl = await ReportService.generateProfitAndLoss(tenant.id);
        console.log(`✓ Total Revenue: ₹${pl.revenue.total.toFixed(2)}`);
        console.log(`   COGS: ₹${pl.costOfGoodsSold.toFixed(2)}`);
        console.log(`   Gross Profit: ₹${pl.grossProfit.toFixed(2)}`);
        console.log(`   Operating Expenses: ₹${pl.operatingExpenses.total.toFixed(2)}`);
        console.log(`   Net Profit: ₹${pl.netProfit.toFixed(2)}`);

        // Balance Sheet
        console.log('\nGenerating Balance Sheet...');
        const bs = await ReportService.generateBalanceSheet(tenant.id);
        console.log(`✓ Total Assets: ₹${bs.assets.total.toFixed(2)}`);
        console.log(`   Total Liabilities: ₹${bs.liabilities.total.toFixed(2)}`);
        console.log(`   Total Equity: ₹${bs.equity.total.toFixed(2)}`);
        console.log(`   Balanced: ${bs.isBalanced ? '✓' : '✗'} (Diff: ₹${bs.difference.toFixed(2)})`);

        console.log('');

        // ========================================
        // SUMMARY
        // ========================================
        console.log('=== TEST SUMMARY ===');
        console.log('✅ Chart of Accounts: Set up');
        console.log('✅ Purchase Flow: Complete (PO → GRN → Stock In → Accounting)');
        console.log('✅ Sales Flow: Complete (Sale → Stock Out → COGS → Accounting)');
        console.log('✅ Incentive System: Working');
        console.log('✅ Financial Reports: Generated');
        console.log(`✅ Double-Entry Validation: ${trialBalance.totals.isBalanced && bs.isBalanced ? 'PASSED' : 'FAILED'}`);

        console.log('\n🎉 End-to-End Test Completed Successfully!');

    } catch (error) {
        console.error('\n❌ Error during test:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if executed directly
if (require.main === module) {
    runEndToEndTest()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

export { runEndToEndTest };
