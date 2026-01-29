import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@storeai.com' } });
    if (!user) { console.error('User not found'); return; }

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'storeai' } });
    if (!tenant) { console.error('Tenant not found'); return; }

    const userTenants = await prisma.userTenant.findMany({
        where: { userId: user.id, tenantId: tenant.id }
    });

    console.log('User ID:', user.id);
    console.log('Tenant ID:', tenant.id);
    console.log('UserTenant Link:', userTenants);
}

main().catch(console.error).finally(() => prisma.$disconnect());
