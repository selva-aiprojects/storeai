
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    try {
        const count = await prisma.sale.count();
        const first = await prisma.sale.findFirst({ orderBy: { createdAt: 'asc' } });
        const last = await prisma.sale.findFirst({ orderBy: { createdAt: 'desc' } });
        const tenantCount = await prisma.tenant.count();
        const tenantsWithData = await prisma.tenant.findMany({
            where: {
                products: { some: {} },
                customers: { some: {} },
                suppliers: { some: {} }
            }
        });

        console.log(JSON.stringify({
            count,
            firstDate: first?.createdAt,
            lastDate: last?.createdAt,
            totalTenants: tenantCount,
            activeTenants: tenantsWithData.length,
            now: new Date()
        }, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
