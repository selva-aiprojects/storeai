import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { InventoryService } from '../src/services/inventory.service';
import { SalesService } from '../src/services/sales.service';

const prisma = new PrismaClient();

async function setupCOA(tenantId: string) {
    console.log(`Setting up Chart of Accounts for tenant: ${tenantId}`);
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
    console.log(`Recording ₹100,000 initial investment for tenant: ${tenantId}`);
    const amount = 100000;
    const voucher = `JV-INIT-${Date.now()}`;

    // Dr Cash
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

    // Cr Equity
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

    // Daybook entry
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

async function seedDemoFlow() {
    console.log('--- STARTING DEMO FLOW SEEDING ---');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // 0. Ensure Plans exist (from system_init.ts but let's be safe)
    const proPlan = await prisma.plan.findFirst({ where: { name: 'PRO' } });
    if (!proPlan) throw new Error('PRO Plan not found. Run system_init.ts first.');

    const superAdminRole = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
    if (!superAdminRole) throw new Error('SUPER_ADMIN role not found. Run system_init.ts first.');

    // 1. Create Demo Tenants
    const tenants = [
        { name: 'Prime Retail Solutions', slug: 'prime' },
        { name: 'Global Logistics Hub', slug: 'global' }
    ];

    const seededTenants = [];
    for (const t of tenants) {
        const tenant = await prisma.tenant.create({
            data: {
                name: t.name,
                slug: t.slug,
                status: 'ACTIVE',
                planId: proPlan.id
            }
        });
        seededTenants.push(tenant);
        console.log(`✔ Created Tenant: ${tenant.name}`);
    }

    // Common Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@storeai.com' },
        update: {},
        create: {
            email: 'admin@storeai.com',
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'Admin'
        }
    });

    for (const tenant of seededTenants) {
        console.log(`\n--- Seeding Flow for ${tenant.name} ---`);

        // Setup Account Access
        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
            update: { isActive: true },
            create: { userId: adminUser.id, tenantId: tenant.id, roleId: superAdminRole.id }
        });

        // 10. Initial Investment 100,000
        const coaMap = await setupCOA(tenant.id);
        await recordInitialInvestment(tenant.id, coaMap);

        // 1. Employee Master - 5 employees
        const managementDept = await prisma.department.create({
            data: { name: 'Management', tenantId: tenant.id }
        });
        const salesDept = await prisma.department.create({
            data: { name: 'Sales & Floor', tenantId: tenant.id }
        });

        const employees = [];
        for (let i = 1; i <= 5; i++) {
            const emp = await prisma.employee.create({
                data: {
                    employeeId: `EMP-${tenant.slug.toUpperCase()}-00${i}`,
                    firstName: `Employee`,
                    lastName: `${i} (${tenant.slug})`,
                    designation: i === 1 ? 'Manager' : 'Executive',
                    salary: 30000 + (i * 5000),
                    joiningDate: new Date(),
                    status: 'ACTIVE',
                    departmentId: i === 1 ? managementDept.id : salesDept.id,
                    eligibleForIncentive: true,
                    incentivePercentage: 2.5
                }
            });
            employees.push(emp);
        }
        console.log(`✔ Created 5 Employees`);

        // 2. Supplier - 2, Customer - 2
        const suppliers = [];
        for (let i = 1; i <= 2; i++) {
            const s = await prisma.supplier.create({
                data: {
                    name: `Supplier ${i} ${tenant.name}`,
                    email: `supp${i}@${tenant.slug}.com`,
                    tenantId: tenant.id
                }
            });
            suppliers.push(s);
        }
        const customers = [];
        for (let i = 1; i <= 2; i++) {
            const c = await prisma.customer.create({
                data: {
                    name: `Customer ${i} ${tenant.name}`,
                    email: `cust${i}@${tenant.slug}.com`,
                    tenantId: tenant.id
                }
            });
            customers.push(c);
        }
        console.log(`✔ Created 2 Suppliers & 2 Customers`);

        // Setup Category & Products
        const cat = await prisma.category.create({
            data: { name: 'General Merchandise', tenantId: tenant.id }
        });
        const warehouse = await prisma.warehouse.create({
            data: { name: 'Main Depot', location: 'Section A', isDefault: true, tenantId: tenant.id }
        });

        const p1 = await prisma.product.create({
            data: {
                sku: `${tenant.slug.toUpperCase()}-ITEM-01`,
                name: 'Standard Inventory Item 01',
                price: 1500, costPrice: 1000,
                categoryId: cat.id, tenantId: tenant.id,
                stockQuantity: 0, isBatchTracked: true
            }
        });
        const p2 = await prisma.product.create({
            data: {
                sku: `${tenant.slug.toUpperCase()}-ITEM-02`,
                name: 'Premium Inventory Item 02',
                price: 2500, costPrice: 1800,
                categoryId: cat.id, tenantId: tenant.id,
                stockQuantity: 0, isBatchTracked: true
            }
        });

        // 3. PO - 2
        // We simulate PO creation
        const po1 = await prisma.order.create({
            data: {
                orderNumber: `PO-${tenant.slug.toUpperCase()}-101`,
                status: 'APPROVED',
                totalAmount: 20000,
                supplierId: suppliers[0].id,
                tenantId: tenant.id,
                items: {
                    create: { productId: p1.id, quantity: 20, unitPrice: 1000 }
                }
            }
        });

        const po2 = await prisma.order.create({
            data: {
                orderNumber: `PO-${tenant.slug.toUpperCase()}-102`,
                status: 'APPROVED',
                totalAmount: 18000,
                supplierId: suppliers[1].id,
                tenantId: tenant.id,
                items: {
                    create: { productId: p2.id, quantity: 10, unitPrice: 1800 }
                }
            }
        });
        console.log(`✔ Created 2 Purchase Orders`);

        // 4. GRN (inward) - 2
        // We use InventoryService to process inward stock which triggers everything
        await InventoryService.processInwardStock({
            tenantId: tenant.id,
            productId: p1.id,
            warehouseId: warehouse.id,
            quantity: 20,
            costPrice: 1000,
            batchNumber: `BAT-${tenant.slug.toUpperCase()}-001`,
            poId: po1.id,
            receivedBy: adminUser.id,
            supplierId: suppliers[0].id,
            gstAmount: 3600 // 18% of 20000
        });

        await InventoryService.processInwardStock({
            tenantId: tenant.id,
            productId: p2.id,
            warehouseId: warehouse.id,
            quantity: 10,
            costPrice: 1800,
            batchNumber: `BAT-${tenant.slug.toUpperCase()}-002`,
            poId: po2.id,
            receivedBy: adminUser.id,
            supplierId: suppliers[1].id,
            gstAmount: 3240 // 18% of 18000
        });
        console.log(`✔ Processed 2 GRNs (Inward Stock + Accounting Entries + Daybook)`);

        // 9. Add one sale
        // This triggers Stock, Daybook, Ledger, Accounting, Incentives
        await SalesService.createSale({
            tenantId: tenant.id,
            customerId: customers[0].id,
            salesmanId: employees[1].id, // First salesperson
            items: [
                { productId: p1.id, quantity: 2, unitPrice: 1500, discount: 0 }
            ],
            paymentMethod: 'CASH',
            amountPaid: 3540 // 3000 + 18% tax
        });
        console.log(`✔ Added 1 Sale (Triggers Stock, Daybook, Ledger, Incentives)`);
    }

    console.log('\n--- ALL FLOWS COMPLETED SUCCESSFULLY ---');
}

seedDemoFlow()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
