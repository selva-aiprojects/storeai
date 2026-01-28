import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugLoginFlow() {
    const email = 'b.selvakumar@gmail.com';
    console.log(`Checking user: ${email}...`);

    try {
        // Step 1: Base User
        console.log('Step 1: Fetching User...');
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');
        console.log('Step 1 OK');

        // Step 2: Include UserTenants
        console.log('Step 2: Fetching Tenants...');
        const s2 = await prisma.user.findUnique({
            where: { email },
            include: { tenants: true }
        });
        console.log(`Step 2 OK (${s2?.tenants.length} tenants)`);

        // Step 3: Include Role
        console.log('Step 3: Fetching Role...');
        const s3 = await prisma.user.findUnique({
            where: { email },
            include: { tenants: { include: { role: true } } }
        });
        console.log('Step 3 OK');

        // Step 4: Include Permissions (The atomic bomb?)
        console.log('Step 4: Fetching Permissions...');
        const s4 = await prisma.user.findUnique({
            where: { email },
            include: { tenants: { include: { role: { include: { permissions: true } } } } }
        });
        console.log('Step 4 OK');

        // Step 5: FULL MONTY
        console.log('Step 5: Full Query...');
        const s5 = await prisma.user.findUnique({
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
        console.log('Step 5 OK');

    } catch (e: any) {
        console.error('FAILED AT STEP:', e.message);
        // console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugLoginFlow();
