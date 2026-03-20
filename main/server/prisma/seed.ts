import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { InventoryService } from '../src/services/inventory.service';
import { SalesService } from '../src/services/sales.service';

const prisma = new PrismaClient();

async function setupCOA(tenantId: string) {
    const accounts = [
        { code: '1000', name: 'Cash in Hand', group: 'ASSET', type: 'CASH' },
        { code: '1100', name: 'Inventory Assets', group: 'ASSET', type: 'INVENTORY' },
        { code: '1200', name: 'Accounts Receivable', group: 'ASSET', type: 'AR' },
        { code: '2100', name: 'Accounts Payable', group: 'LIABILITY', type: 'AP' },
        { code: '3100', name: 'Owner Investment/Equity', group: 'EQUITY', type: 'EQUITY' },
        { code: '4100', name: 'Sales Revenue', group: 'INCOME', type: 'SALES' },
        { code: '5100', name: 'GST Input Tax', group: 'ASSET', type: 'GST_INPUT' },
        { code: '5200', name: 'GST Output Tax', group: 'LIABILITY', type: 'GST_OUTPUT' },
        { code: '6100', name: 'Staff Incentives', group: 'EXPENSE', type: 'INCENTIVE' },
        { code: '2200', name: 'Salaries & Incentives Payable', group: 'LIABILITY', type: 'EMPLOYEE_PAYABLE' },
    ];

    const coaMap: Record<string, any> = {};
    for (const acc of accounts) {
        const created = await prisma.chartOfAccounts.create({
            data: {
                code: acc.code,
                name: acc.name,
                accountGroup: acc.group,
                accountType: acc.type,
                openingBalance: 0,
                currentBalance: 0,
                tenantId: tenantId,
                isSystemAccount: true
            }
        });
        coaMap[acc.type] = created;
    }
    return coaMap;
}

async function recordInitialInvestment(tenantId: string, coaMap: Record<string, any>) {
    const amount = 100000;
    const voucher = `JV-INIT-${Date.now()}`;

    await prisma.ledgerEntry.create({
        data: {
            accountId: coaMap['CASH'].id,
            debitAmount: amount,
            creditAmount: 0,
            referenceType: 'JOURNAL',
            description: 'Initial Business Investment',
            voucherNumber: voucher,
            tenantId
        }
    });

    await prisma.ledgerEntry.create({
        data: {
            accountId: coaMap['EQUITY'].id,
            debitAmount: 0,
            creditAmount: amount,
            referenceType: 'JOURNAL',
            description: 'Owner Equity Contribution',
            voucherNumber: voucher,
            tenantId
        }
    });

    await prisma.daybook.create({
        data: {
            type: 'JOURNAL',
            description: 'Initial Capital Infusion',
            debit: amount,
            credit: amount,
            status: 'APPROVED',
            tenantId
        }
    });
}

async function main() {
    console.log('--- STARTING STOREAI ENTERPRISE SEED ---');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // 1. Seed Plans
    const proPlan = await prisma.plan.upsert({
        where: { name: 'PRO' },
        update: {},
        create: {
            name: 'PRO', price: 99.0, billingCycle: 'MONTHLY',
            features: { maxUsers: 20, aiPredictions: true, multiWarehouse: true, advancedCRM: true }
        }
    });

    // 2. Seed Permissions & Roles
    const perms = [
        { code: 'dashboard:view', name: 'View Dashboard', category: 'DASHBOARD' },
        { code: 'inventory:read', name: 'View Inventory', category: 'INVENTORY' },
        { code: 'inventory:write', name: 'Modify Inventory', category: 'INVENTORY' },
        { code: 'sales:read', name: 'View Sales', category: 'SALES' },
        { code: 'sales:write', name: 'Generate Sales', category: 'SALES' },
        { code: 'hr:read', name: 'View Personnel', category: 'HR' },
        { code: 'hr:write', name: 'Manage Personnel', category: 'HR' },
        { code: 'payroll:read', name: 'View Payroll', category: 'HR' },
        { code: 'payroll:write', name: 'Manage Payroll', category: 'HR' },
        { code: 'accounts:read', name: 'View Accounts', category: 'FINANCE' },
        { code: 'accounts:write', name: 'Manage Accounts', category: 'FINANCE' },
        { code: 'reports:read', name: 'View Reports', category: 'REPORTS' },
        { code: 'reports:view', name: 'View Reports (Legacy)', category: 'REPORTS' },
        { code: 'crm:write', name: 'Manage CRM', category: 'CRM' },
        { code: 'orders:read', name: 'View Purchase Orders', category: 'PROCUREMENT' },
        { code: 'orders:write', name: 'Manage Purchase Orders', category: 'PROCUREMENT' },
        { code: 'users:manage', name: 'Manage Users', category: 'ADMIN' },
        { code: 'tenants:manage', name: 'Manage Organizations', category: 'ADMIN' }
    ];

    for (const p of perms) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: { name: p.name, category: p.category },
            create: p
        });
    }

    const superAdminRole = await prisma.role.upsert({
        where: { code: 'SUPER_ADMIN' },
        update: {
            permissions: {
                set: [],
                connect: perms.map(p => ({ code: p.code }))
            }
        },
        create: {
            name: 'Super Admin', code: 'SUPER_ADMIN',
            permissions: { connect: perms.map(p => ({ code: p.code })) }
        }
    });

    // 3. Create Root Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@storeai.com' },
        update: { password: hashedPassword },
        create: {
            email: 'admin@storeai.com', password: hashedPassword, firstName: 'System', lastName: 'Administrator'
        }
    });

    // 4. Create Demo Tenant
    const demoTenant = await prisma.tenant.upsert({
        where: { slug: 'storeai' },
        update: {},
        create: {
            name: 'StoreAI Corporate Hub',
            slug: 'storeai',
            status: 'ACTIVE',
            planId: proPlan.id
        }
    });

    await prisma.userTenant.upsert({
        where: { userId_tenantId: { userId: adminUser.id, tenantId: demoTenant.id } },
        update: { isActive: true },
        create: { userId: adminUser.id, tenantId: demoTenant.id, roleId: superAdminRole.id }
    });

    // --- FULL BUSINESS FLOW SEEDING ---
    const coaMap = await setupCOA(demoTenant.id);
    await recordInitialInvestment(demoTenant.id, coaMap);

    const mgtDept = await prisma.department.create({ data: { name: 'Management', tenantId: demoTenant.id } });
    const salesDept = await prisma.department.create({ data: { name: 'Sales', tenantId: demoTenant.id } });

    // Seed 5 Employees
    const employees = [];
    for (let i = 1; i <= 5; i++) {
        const emp = await prisma.employee.create({
            data: {
                employeeId: `EMP-00${i}`,
                firstName: `Employee`,
                lastName: `${i}`,
                designation: i === 1 ? 'Store Manager' : 'Sales Advisor',
                salary: 40000,
                joiningDate: new Date(),
                departmentId: i === 1 ? mgtDept.id : salesDept.id,
                eligibleForIncentive: true,
                incentivePercentage: 2.0
            }
        });
        employees.push(emp);
    }

    // Suppliers & Customers
    const supplier = await prisma.supplier.create({ data: { name: 'Main Distribution Co.', email: 'supply@distro.com', tenantId: demoTenant.id } });
    const customer = await prisma.customer.create({ data: { name: 'Regular Retail Customer', email: 'walkin@gmail.com', tenantId: demoTenant.id } });

    // Category & Products
    const cat = await prisma.category.create({ data: { name: 'Electronics', tenantId: demoTenant.id } });
    const warehouse = await prisma.warehouse.create({ data: { name: 'Standard Warehouse', location: 'Rack 1', isDefault: true, tenantId: demoTenant.id } });

    const prod1 = await prisma.product.create({
        data: {
            sku: 'STAI-EL-001', name: 'Enterprise Router X1', price: 5000, costPrice: 3500,
            categoryId: cat.id, tenantId: demoTenant.id, isBatchTracked: true
        }
    });

    // Purchase Order & Inward
    const po = await prisma.order.create({
        data: {
            orderNumber: 'PO-X1-001', status: 'APPROVED', totalAmount: 35000,
            supplierId: supplier.id, tenantId: demoTenant.id,
            items: { create: { productId: prod1.id, quantity: 10, unitPrice: 3500 } }
        }
    });

    await InventoryService.processInwardStock({
        tenantId: demoTenant.id, productId: prod1.id, warehouseId: warehouse.id,
        quantity: 10, costPrice: 3500, batchNumber: 'LOT-XP-01', poId: po.id,
        receivedBy: adminUser.id, supplierId: supplier.id, gstAmount: 6300
    });

    // Sale
    await SalesService.createSale({
        tenantId: demoTenant.id, customerId: customer.id, salesmanId: employees[1].id,
        items: [{ productId: prod1.id, quantity: 1, unitPrice: 5000, discount: 0 }],
        paymentMethod: 'CASH', amountPaid: 5900
    });

    console.log('--- SEEDING COMPLETE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
