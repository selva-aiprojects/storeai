import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugUsers() {
    console.log('🔍 DEBUGGING USER DATA...');

    const emails = ['admin@storeai.com', 'procure@storeai.com', 'sales@storeai.com', 'hr@storeai.com'];

    for (const email of emails) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                tenants: {
                    include: {
                        role: true,
                        tenant: true
                    }
                }
            }
        });

        if (user) {
            console.log(`\nEmail: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Tenant Associations: ${user.tenants.length}`);
            for (const t of user.tenants) {
                console.log(`  - Tenant: ${t.tenant.slug}, Role: ${t.role.code}`);
            }

            const match = await bcrypt.compare('DemoPassword123!', user.password);
            console.log(`Password Match (DemoPassword123!): ${match}`);

            const adminMatch = await bcrypt.compare('AdminPassword123!', user.password);
            console.log(`Password Match (AdminPassword123!): ${adminMatch}`);
        } else {
            console.log(`\nEmail: ${email} -> NOT FOUND`);
        }
    }
}

debugUsers().catch(console.error).finally(() => prisma.$disconnect());
