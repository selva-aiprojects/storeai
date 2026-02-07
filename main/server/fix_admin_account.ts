import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdmin() {
    const email = 'admin@storeai.com';
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`Fixing account for ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            isActive: true,
            isDeleted: false,
            role: 'SUPER_ADMIN'
        },
        create: {
            email,
            password: hashedPassword,
            firstName: 'StoreAI',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            isActive: true
        }
    });

    // Ensure StoreAI tenant is ACTIVE
    await prisma.tenant.upsert({
        where: { slug: 'storeai' },
        update: { status: 'ACTIVE' },
        create: {
            name: 'StoreAI Corporate Hub',
            slug: 'storeai',
            status: 'ACTIVE'
        }
    });

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'storeai' } });
    const role = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });

    if (tenant && role) {
        await prisma.userTenant.upsert({
            where: {
                userId_tenantId: {
                    userId: user.id,
                    tenantId: tenant.id
                }
            },
            update: { roleId: role.id },
            create: {
                userId: user.id,
                tenantId: tenant.id,
                roleId: role.id
            }
        });
        console.log("✔ Admin account linked to 'storeai' tenant successfully.");
    }

    console.log(`✔ Password reset to: ${newPassword}`);
    console.log(`✔ Account status: ACTIVE`);

    await prisma.$disconnect();
}

fixAdmin().catch(console.error);
