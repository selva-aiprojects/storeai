import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- FIXING ENVIRONMENT (VERBOSE) ---');

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'storeai' } });
    if (!tenant) {
        console.error('Tenant storeai not found');
        return;
    }
    console.log('Found Tenant storeai with ID:', tenant.id);

    const warehouses = await prisma.warehouse.findMany({
        where: { tenantId: tenant.id }
    });
    console.log(`Found ${warehouses.length} warehouses for this tenant.`);

    if (warehouses.length === 0) {
        const newWh = await prisma.warehouse.create({
            data: {
                name: 'Main Distribution Center',
                location: 'Corporate HQ',
                isDefault: true,
                tenantId: tenant.id
            }
        });
        console.log('✔ Default warehouse created:', newWh.id);
    } else {
        const hasDefault = warehouses.some(w => w.isDefault);
        if (!hasDefault) {
            await prisma.warehouse.update({
                where: { id: warehouses[0].id },
                data: { isDefault: true }
            });
            console.log('✔ Updated existing warehouse to Default');
        } else {
            console.log('✔ Default warehouse already exists');
        }
    }

    console.log('--- ENVIRONMENT FIXED ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
