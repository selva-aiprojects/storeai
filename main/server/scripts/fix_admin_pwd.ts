
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fix() {
    const email = 'admin@storeai.com';
    const password = await bcrypt.hash('AdminPassword123!', 10);

    await prisma.user.update({
        where: { email },
        data: { password }
    });

    console.log(`✅ Password for ${email} reset to AdminPassword123!`);
}

fix().finally(() => prisma.$disconnect());
