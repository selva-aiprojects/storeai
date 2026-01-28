
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debug() {
    const adminEmail = 'admin@storeai.com';
    const superAdminEmail = 'superadmin@storeai.com';

    const users = await prisma.user.findMany({
        where: { email: { in: [adminEmail, superAdminEmail] } },
        include: { tenants: { include: { tenant: true } } }
    });

    console.log('--- USER DEBUG ---');
    users.forEach(u => {
        console.log(`User: ${u.email}`);
        console.log(`Tenants Linked: ${u.tenants.length}`);
        u.tenants.forEach(t => console.log(`  - ${t.tenant.slug} (${t.tenant.name})`));
    });
}

debug().finally(() => prisma.$disconnect());
