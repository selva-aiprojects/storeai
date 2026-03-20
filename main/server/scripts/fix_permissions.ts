import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- FIXING PERMISSIONS ---');

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
        console.log(`✔ Permission: ${p.code}`);
    }

    // Connect all to SUPER_ADMIN
    const allPermCodes = perms.map(p => ({ code: p.code }));
    await prisma.role.update({
        where: { code: 'SUPER_ADMIN' },
        data: {
            permissions: {
                set: [], // Clear first for clean state
                connect: allPermCodes
            }
        }
    });
    console.log('✔ SUPER_ADMIN role updated with all permissions');

    console.log('--- PERMISSIONS FIXED ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
