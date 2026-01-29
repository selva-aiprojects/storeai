
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function simulateLogin() {
    const email = 'admin@storeai.com';
    const password = 'AdminPassword123!';

    console.log(`--- SIMULATING LOGIN FOR: ${email} ---`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenants: {
                include: {
                    tenant: true
                }
            }
        }
    });

    if (!user) {
        console.error('❌ User not found in database');
        return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password Match: ${isMatch ? '✅ YES' : '❌ NO'}`);

    if (user.tenants.length === 0) {
        console.error('❌ User has NO tenant associations');
    } else {
        console.log(`Tenants Linked: ${user.tenants.length}`);
        user.tenants.forEach(t => {
            console.log(`  - Slug: ${t.tenant.slug}, Status: ${t.tenant.status}`);
        });

        const firstTenant = user.tenants[0].tenant;
        console.log(`Default active tenant: ${firstTenant.slug}`);
        if (firstTenant.status === 'PENDING' && firstTenant.slug !== 'storeai') {
            console.warn('⚠️ Warning: First tenant is PENDING and not storeai. Login might be blocked by approval check.');
        }
    }
}

simulateLogin().finally(() => prisma.$disconnect());
