import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Connecting to DB...');
        const userCount = await prisma.user.count();
        console.log(`User Count: ${userCount}`);

        const users = await prisma.user.findMany();
        console.log(JSON.stringify(users, null, 2));

        console.log('DB Connection OK');
    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
