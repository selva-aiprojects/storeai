import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- INITIALIZING SYSTEM CORE ---');

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

    const enterprisePlan = await prisma.plan.upsert({
        where: { name: 'ENTERPRISE' },
        update: {},
        create: {
            name: 'ENTERPRISE', price: 499.0, billingCycle: 'ANNUAL',
            features: { maxUsers: 1000, aiPredictions: true, multiWarehouse: true, advancedCRM: true, customBranding: true }
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

    console.log('✔ System Core Initialized.');
    console.log('✔ Default Admin Account: admin@storeai.com / Admin@123');
    console.log('--- SYSTEM READY ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
