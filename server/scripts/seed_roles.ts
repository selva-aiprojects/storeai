import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING ROLES AND PLANS ---');

    const permissions = await prisma.permission.findMany();
    const permCodes = permissions.map(p => ({ code: p.code }));

    const roles = [
        { name: 'Super Admin', code: 'SUPER_ADMIN' },
        { name: 'Management', code: 'MANAGEMENT' },
        { name: 'HR Manager', code: 'HR' },
        { name: 'Shipment Officer', code: 'SHIPMENT' },
        { name: 'Staff', code: 'STAFF' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { code: role.code },
            update: {},
            create: {
                name: role.name,
                code: role.code,
                permissions: {
                    connect: permCodes
                }
            }
        });
        console.log(`✔ Role: ${role.name} checked/added`);
    }

    // Ensure default plans exist
    await prisma.plan.upsert({
        where: { name: 'PRO' },
        update: {},
        create: {
            name: 'PRO', price: 99.0, billingCycle: 'MONTHLY',
            features: { maxUsers: 20, aiPredictions: true, multiWarehouse: true, advancedCRM: true }
        }
    });

    await prisma.plan.upsert({
        where: { name: 'ENTERPRISE' },
        update: {},
        create: {
            name: 'ENTERPRISE', price: 499.0, billingCycle: 'ANNUAL',
            features: { maxUsers: 1000, aiPredictions: true, multiWarehouse: true, advancedCRM: true, customBranding: true }
        }
    });

    console.log('✔ SEEDING COMPLETE');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
