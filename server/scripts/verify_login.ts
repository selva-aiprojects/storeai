
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@storeai.com';
    const password = 'AdminPassword123!';

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenants: {
                include: {
                    tenant: {
                        include: { plan: true }
                    },
                    role: {
                        include: { permissions: true }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password Match:', passwordMatch);

    if (user.tenants.length === 0) {
        console.log('No tenants found');
        return;
    }

    const activeTenantRelation = user.tenants[0];
    const activeTenant = activeTenantRelation.tenant;
    const activeRole = activeTenantRelation.role;

    console.log('Tenant ID:', activeTenant.id);
    console.log('Plan:', activeTenant.plan?.name);
    console.log('Plan Features:', activeTenant.plan?.features);
    console.log('Tenant Features:', activeTenant.features);
    console.log('Role:', activeRole.code);
    console.log('Permissions Count:', activeRole.permissions.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
