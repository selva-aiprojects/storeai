import prisma from './main/server/src/lib/prisma';

async function dump() {
    console.log('--- USER DATA ---');
    const users = await prisma.user.findMany({
        where: { email: 'admin@storeai.com' },
        include: {
            roles: {
                include: {
                    tenant: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log('--- ALL TENANTS ---');
    const tenants = await prisma.tenant.findMany();
    console.log(JSON.stringify(tenants, null, 2));
}

dump().finally(() => prisma.$disconnect());
