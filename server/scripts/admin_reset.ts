import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function reset() {
    const email = 'admin@storeai.com';
    const password = 'password123';
    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { email },
        data: { password: hashed }
    });
    console.log(`Password for ${email} reset to '${password}'`);
}

reset()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
