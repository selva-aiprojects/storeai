import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- VERIFYING SEEDED DATA ---');

    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: {
                    suppliers: true,
                    customers: true,
                    orders: true,
                    sales: true,
                    daybooks: true,
                    ledgerEntries: true,
                    products: true,
                    incentiveLedgers: true
                }
            }
        }
    });

    for (const t of tenants) {
        const empCount = await prisma.employee.count({
            where: { department: { tenantId: t.id } }
        });

        console.log(`\nTenant: ${t.name} (${t.slug})`);
        console.log(`- Employees: ${empCount}`);
        console.log(`- Suppliers: ${t._count.suppliers}`);
        console.log(`- Customers: ${t._count.customers}`);
        console.log(`- Products: ${t._count.products}`);
        console.log(`- POs: ${t._count.orders}`);
        console.log(`- Sales: ${t._count.sales}`);
        console.log(`- Daybook Entries: ${t._count.daybooks}`);
        console.log(`- Ledger Totals: ${t._count.ledgerEntries}`);
        console.log(`- Incentives: ${t._count.incentiveLedgers}`);

        // Check Initial Investment (Equity)
        const equity = await prisma.ledgerEntry.findFirst({
            where: { tenantId: t.id, account: { accountType: 'EQUITY' } }
        });
        console.log(`- Initial Investment Found: ${equity ? 'YES (₹' + equity.creditAmount + ')' : 'NO'}`);

        // Check Stock
        const products = await prisma.product.findMany({
            where: { tenantId: t.id }
        });
        for (const p of products) {
            console.log(`  * Stock for ${p.sku}: ${p.stockQuantity}`);
        }
    }

    // Check specific accounting flow for one tenant
    if (tenants.length > 0) {
        const t0 = tenants[0];
        console.log(`\nAudit Flow for ${t0.name}:`);
        const entries = await prisma.ledgerEntry.findMany({
            where: { tenantId: t0.id },
            include: { account: true },
            orderBy: { createdAt: 'asc' }
        });

        entries.forEach(e => {
            const type = e.debitAmount > 0 ? 'Dr' : 'Cr';
            const amount = e.debitAmount > 0 ? e.debitAmount : e.creditAmount;
            console.log(`  [${e.voucherNumber}] ${type} ${e.account.name} (${e.account.accountType}): ₹${amount} - ${e.description}`);
        });
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
