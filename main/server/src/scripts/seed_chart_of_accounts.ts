import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Chart of Accounts Seeding Script
 * Creates standard accounting structure for each tenant
 */

interface AccountConfig {
    code: string;
    name: string;
    accountGroup: string;
    accountType: string;
    parentCode?: string;
}

const STANDARD_ACCOUNTS: AccountConfig[] = [
    // ===== ASSETS =====
    { code: '1000', name: 'Cash Account', accountGroup: 'ASSETS', accountType: 'CASH' },
    { code: '1010', name: 'Bank Account - Primary', accountGroup: 'ASSETS', accountType: 'BANK' },
    { code: '1020', name: 'Petty Cash', accountGroup: 'ASSETS', accountType: 'CASH' },
    { code: '1100', name: 'Accounts Receivable', accountGroup: 'ASSETS', accountType: 'AR' },
    { code: '1200', name: 'Inventory', accountGroup: 'ASSETS', accountType: 'INVENTORY' },
    { code: '1300', name: 'GST Input Tax Credit', accountGroup: 'ASSETS', accountType: 'GST_INPUT' },
    { code: '1400', name: 'Prepaid Expenses', accountGroup: 'ASSETS', accountType: 'PREPAID' },
    { code: '1500', name: 'Fixed Assets', accountGroup: 'ASSETS', accountType: 'FIXED_ASSET' },

    // ===== LIABILITIES =====
    { code: '2000', name: 'Accounts Payable', accountGroup: 'LIABILITIES', accountType: 'AP' },
    { code: '2100', name: 'GST Output Tax Payable', accountGroup: 'LIABILITIES', accountType: 'GST_OUTPUT' },
    { code: '2200', name: 'Employee Payables', accountGroup: 'LIABILITIES', accountType: 'EMPLOYEE_PAYABLE' },
    { code: '2210', name: 'Salary Payable', accountGroup: 'LIABILITIES', accountType: 'SALARY_PAYABLE' },
    { code: '2220', name: 'TDS Payable', accountGroup: 'LIABILITIES', accountType: 'TAX_PAYABLE' },
    { code: '2300', name: 'Other Current Liabilities', accountGroup: 'LIABILITIES', accountType: 'LIABILITY' },

    // ===== EQUITY =====
    { code: '3000', name: 'Owner\'s Capital', accountGroup: 'EQUITY', accountType: 'CAPITAL' },
    { code: '3100', name: 'Retained Earnings', accountGroup: 'EQUITY', accountType: 'RETAINED_EARNINGS' },
    { code: '3200', name: 'Current Year Profit/Loss', accountGroup: 'EQUITY', accountType: 'CURRENT_YEAR_PL' },

    // ===== INCOME =====
    { code: '4000', name: 'Sales Revenue', accountGroup: 'INCOME', accountType: 'SALES' },
    { code: '4100', name: 'Service Revenue', accountGroup: 'INCOME', accountType: 'SERVICE_INCOME' },
    { code: '4900', name: 'Other Income', accountGroup: 'INCOME', accountType: 'OTHER_INCOME' },

    // ===== EXPENSES =====
    { code: '5000', name: 'Cost of Goods Sold (COGS)', accountGroup: 'EXPENSES', accountType: 'COGS' },
    { code: '5100', name: 'Purchase Account', accountGroup: 'EXPENSES', accountType: 'PURCHASE' },
    { code: '5200', name: 'Salaries & Wages', accountGroup: 'EXPENSES', accountType: 'SALARY' },
    { code: '5210', name: 'Employee Incentives', accountGroup: 'EXPENSES', accountType: 'INCENTIVE' },
    { code: '5220', name: 'Employee Benefits', accountGroup: 'EXPENSES', accountType: 'BENEFITS' },
    { code: '5300', name: 'Transportation Expenses', accountGroup: 'EXPENSES', accountType: 'TRANSPORT' },
    { code: '5400', name: 'Rent Expense', accountGroup: 'EXPENSES', accountType: 'RENT' },
    { code: '5500', name: 'Utilities Expense', accountGroup: 'EXPENSES', accountType: 'UTILITIES' },
    { code: '5600', name: 'Office Supplies', accountGroup: 'EXPENSES', accountType: 'SUPPLIES' },
    { code: '5700', name: 'Marketing & Advertising', accountGroup: 'EXPENSES', accountType: 'MARKETING' },
    { code: '5800', name: 'Professional Fees', accountGroup: 'EXPENSES', accountType: 'PROFESSIONAL_FEES' },
    { code: '5900', name: 'Administrative Expenses', accountGroup: 'EXPENSES', accountType: 'ADMIN' },
    { code: '5950', name: 'Bank Charges', accountGroup: 'EXPENSES', accountType: 'BANK_CHARGES' },
];

async function seedChartOfAccounts(tenantId: string) {
    console.log(`📊 Seeding Chart of Accounts for tenant: ${tenantId}`);

    try {
        // Check if accounts already exist
        const existing = await prisma.chartOfAccounts.findFirst({
            where: { tenantId }
        });

        if (existing) {
            console.log('⚠️  Chart of Accounts already exists for this tenant. Skipping...');
            return;
        }

        const createdAccounts = [];

        for (const account of STANDARD_ACCOUNTS) {
            const created = await prisma.chartOfAccounts.create({
                data: {
                    code: account.code,
                    name: account.name,
                    accountGroup: account.accountGroup,
                    accountType: account.accountType,
                    isSystemAccount: true, // These are system accounts
                    tenantId: tenantId
                }
            });
            createdAccounts.push(created);
            console.log(`✓ Created account: ${account.code} - ${account.name}`);
        }

        console.log(`\n✅ Successfully created ${createdAccounts.length} accounts!`);

        // Summary by group
        const summary = createdAccounts.reduce((acc: any, account) => {
            acc[account.accountGroup] = (acc[account.accountGroup] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📈 Summary by Account Group:');
        Object.entries(summary).forEach(([group, count]) => {
            console.log(`   ${group}: ${count} accounts`);
        });

    } catch (error) {
        console.error('❌ Error seeding Chart of Accounts:', error);
        throw error;
    }
}

async function seedAllTenants() {
    console.log('🌐 Seeding Chart of Accounts for all tenants...\n');

    try {
        const tenants = await prisma.tenant.findMany({
            select: { id: true, name: true, slug: true }
        });

        console.log(`Found ${tenants.length} tenant(s)\n`);

        for (const tenant of tenants) {
            console.log(`\n--- Processing: ${tenant.name} (${tenant.slug}) ---`);
            await seedChartOfAccounts(tenant.id);
        }

        console.log('\n🎉 All tenants processed successfully!');

    } catch (error) {
        console.error('❌ Error processing tenants:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// CLI execution
if (require.main === module) {
    const tenantId = process.argv[2]; // Optional specific tenant ID

    if (tenantId) {
        seedChartOfAccounts(tenantId)
            .then(() => {
                console.log('\nScript completed');
                process.exit(0);
            })
            .catch((error) => {
                console.error('\nScript failed:', error);
                process.exit(1);
            })
            .finally(() => prisma.$disconnect());
    } else {
        seedAllTenants()
            .then(() => process.exit(0))
            .catch((error) => {
                console.error('\nScript failed:', error);
                process.exit(1);
            });
    }
}

export { seedChartOfAccounts, seedAllTenants };
