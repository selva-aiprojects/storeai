import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING MULTI-TENANT SAAS SEED ---');

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    // 1. Clean Database
    try {
        await prisma.activity.deleteMany({});
        await prisma.goodsReceiptItem.deleteMany({});
        await prisma.goodsReceipt.deleteMany({});
        await prisma.payroll.deleteMany({});
        await prisma.attendance.deleteMany({});
        await prisma.dealItem.deleteMany({});
        await prisma.salesRegister.deleteMany({});
        await prisma.salesOrderItem.deleteMany({});
        await prisma.salesOrder.deleteMany({});
        await prisma.deal.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.ledger.deleteMany({});
        await prisma.saleItem.deleteMany({});
        await prisma.sale.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.inventoryDocumentItem.deleteMany({});
        await prisma.inventoryDocument.deleteMany({});
        await prisma.stockLedger.deleteMany({});
        await prisma.stock.deleteMany({});
        await prisma.productBatch.deleteMany({});
        await prisma.warehouse.deleteMany({});
        await prisma.pricingRule.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.supplier.deleteMany({});
        await prisma.customer.deleteMany({});
        await prisma.employee.deleteMany({});
        await prisma.department.deleteMany({});
        await prisma.userTenant.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.role.deleteMany({});
        await prisma.permission.deleteMany({});
        await prisma.tenant.deleteMany({});
        await prisma.plan.deleteMany({});
        console.log('✔ Database Cleaned');
    } catch (e) { console.log('⚠ Cleanup warning:', e); }

    // 2. Seed Plans
    const proPlan = await prisma.plan.upsert({
        where: { name: 'PRO' },
        update: { price: 99.0, features: { maxUsers: 20, aiPredictions: true, multiWarehouse: true, advancedCRM: true } },
        create: {
            name: 'PRO', price: 99.0, billingCycle: 'MONTHLY',
            features: { maxUsers: 20, aiPredictions: true, multiWarehouse: true, advancedCRM: true }
        }
    });

    const enterprisePlan = await prisma.plan.upsert({
        where: { name: 'ENTERPRISE' },
        update: { price: 499.0, features: { maxUsers: 1000, aiPredictions: true, multiWarehouse: true, advancedCRM: true, customBranding: true } },
        create: {
            name: 'ENTERPRISE', price: 499.0, billingCycle: 'ANNUAL',
            features: { maxUsers: 1000, aiPredictions: true, multiWarehouse: true, advancedCRM: true, customBranding: true }
        }
    });

    // 3. Seed Permissions & Roles
    const perms = [
        { code: 'dashboard:view', name: 'View Dashboard', category: 'DASHBOARD' },
        { code: 'inventory:read', name: 'View Inventory', category: 'INVENTORY' },
        { code: 'inventory:write', name: 'Modify Inventory', category: 'INVENTORY' },
        { code: 'sales:read', name: 'View Sales', category: 'SALES' },
        { code: 'sales:write', name: 'Generate Sales', category: 'SALES' },
        { code: 'hr:read', name: 'View Personnel', category: 'HR' },
        { code: 'hr:write', name: 'Manage Personnel', category: 'HR' },
        { code: 'accounts:read', name: 'View Accounts', category: 'FINANCE' },
        { code: 'accounts:write', name: 'Manage Accounts', category: 'FINANCE' },
        { code: 'reports:view', name: 'View Reports', category: 'REPORTS' },
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
        update: { permissions: { set: perms.map(p => ({ code: p.code })) } },
        create: {
            name: 'Super Admin', code: 'SUPER_ADMIN',
            permissions: { connect: perms.map(p => ({ code: p.code })) }
        }
    });

    const procurementRole = await prisma.role.upsert({
        where: { code: 'PROCUREMENT_TEAM' },
        update: {
            permissions: {
                set: [
                    { code: 'dashboard:view' },
                    { code: 'inventory:read' },
                    { code: 'inventory:write' },
                    { code: 'orders:read' },
                    { code: 'orders:write' },
                    { code: 'reports:view' }
                ]
            }
        },
        create: {
            name: 'Procurement Team', code: 'PROCUREMENT_TEAM',
            permissions: {
                connect: [
                    { code: 'dashboard:view' },
                    { code: 'inventory:read' },
                    { code: 'inventory:write' },
                    { code: 'orders:read' },
                    { code: 'orders:write' },
                    { code: 'reports:view' }
                ]
            }
        }
    });

    const salesRole = await prisma.role.upsert({
        where: { code: 'SALES_TEAM' },
        update: {
            permissions: {
                set: [
                    { code: 'dashboard:view' },
                    { code: 'inventory:read' },
                    { code: 'sales:read' },
                    { code: 'sales:write' },
                    { code: 'reports:view' }
                ]
            }
        },
        create: {
            name: 'Sales Team', code: 'SALES_TEAM',
            permissions: {
                connect: [
                    { code: 'dashboard:view' },
                    { code: 'inventory:read' },
                    { code: 'sales:read' },
                    { code: 'sales:write' },
                    { code: 'reports:view' }
                ]
            }
        }
    });

    const hrRole = await prisma.role.upsert({
        where: { code: 'HR_TEAM' },
        update: {
            permissions: {
                set: [
                    { code: 'dashboard:view' },
                    { code: 'hr:read' },
                    { code: 'hr:write' },
                    { code: 'reports:view' }
                ]
            }
        },
        create: {
            name: 'HR Team', code: 'HR_TEAM',
            permissions: {
                connect: [
                    { code: 'dashboard:view' },
                    { code: 'hr:read' },
                    { code: 'hr:write' },
                    { code: 'reports:view' }
                ]
            }
        }
    });

    // 4. Seed Default Tenant (StoreAI Corporate)
    const storeAiTenant = await prisma.tenant.create({
        data: {
            name: 'StoreAI Corporate Hub', slug: 'storeai', status: 'ACTIVE',
            planId: enterprisePlan.id
        }
    });

    // 5. Build isolated data for the tenant
    const depts = ["Management", "Operations", "Sales"];
    const createdDepts: Record<string, any> = {};
    for (const name of depts) {
        createdDepts[name] = await prisma.department.create({ data: { name, tenantId: storeAiTenant.id } });
    }

    const categories = [
        { name: 'Server Infrastructure', desc: 'Compute & Rack hardware' },
        { name: 'Networking', desc: 'Enterprise connectivity' }
    ];
    const createdCats: Record<string, any> = {};
    for (const cat of categories) {
        createdCats[cat.name] = await prisma.category.create({ data: { name: cat.name, description: cat.desc, tenantId: storeAiTenant.id } });
    }

    const whMain = await prisma.warehouse.create({ data: { name: 'London Central Hub', location: 'Heathrow Logistics Park', isDefault: true, tenantId: storeAiTenant.id } });

    // Products
    const products = [
        { sku: 'SRV-DL380', name: 'HPE ProLiant DL380 Gen11', price: 9500, cost: 6800, cat: 'Server Infrastructure', stock: 12 },
        { sku: 'NET-C9200', name: 'Cisco Catalyst 9200L', price: 2100, cost: 1400, cat: 'Networking', stock: 25 }
    ];
    const createdProds: any[] = [];
    for (const p of products) {
        const prod = await prisma.product.create({
            data: {
                sku: p.sku, name: p.name, price: p.price, costPrice: p.cost,
                stockQuantity: p.stock, categoryId: createdCats[p.cat].id,
                tenantId: storeAiTenant.id, isBatchTracked: true
            }
        });
        createdProds.push(prod);
        await prisma.stock.create({ data: { productId: prod.id, warehouseId: whMain.id, quantity: p.stock, batchNumber: 'LOT-SAAS-001' } });
    }

    // Admin User
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@storeai.com', password: hashedPassword, firstName: 'Alex', lastName: 'Master'
        }
    });

    await prisma.userTenant.create({
        data: { userId: adminUser.id, tenantId: storeAiTenant.id, roleId: superAdminRole.id }
    });

    await prisma.employee.create({
        data: {
            employeeId: 'EMP-SAAS-001', firstName: 'Alex', lastName: 'Master',
            designation: 'CTO & Solution Architect', salary: 120000,
            joiningDate: new Date('2023-01-01'), departmentId: createdDepts['Management'].id,
            userId: adminUser.id
        }
    });

    // 6. Demo Organizations for Validation
    const demoOrgs = [
        {
            name: 'Quantum Retail Solutions',
            slug: 'quantum',
            logo: 'https://placehold.co/100x100/4f46e5/ffffff?text=QR',
            features: { RETAIL_MODULE: true, INVENTORY_MODULE: true, CRM_MODULE: false, HR_MODULE: false }
        },
        {
            name: 'Nexus Logistics Group',
            slug: 'nexus',
            logo: 'https://placehold.co/100x100/0891b2/ffffff?text=NX',
            features: { PROCUREMENT_MODULE: true, INVENTORY_MODULE: true, RETAIL_MODULE: false, HR_MODULE: false }
        },
        {
            name: 'Horizon Dynamics',
            slug: 'horizon',
            logo: 'https://placehold.co/100x100/059669/ffffff?text=HD',
            features: { CRM_MODULE: true, REPORT_MODULE: true, RETAIL_MODULE: false, PROCUREMENT_MODULE: false }
        }
    ];

    for (const org of demoOrgs) {
        const tenant = await prisma.tenant.create({
            data: {
                name: org.name,
                slug: org.slug,
                logo: org.logo,
                features: org.features,
                planId: proPlan.id
            }
        });

        // Link Admin to these orgs as well
        await prisma.userTenant.create({
            data: {
                userId: adminUser.id,
                tenantId: tenant.id,
                roleId: superAdminRole.id
            }
        });
        console.log(`✔ Demo Organization Created: ${org.name}`);
    }

    console.log('✔ CORE SAAS SEED COMPLETE: 4 Organizations active for admin@storeai.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
