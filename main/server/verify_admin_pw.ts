
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyPassword() {
    const email = 'admin@storeai.com';
    const passwordsToTry = ['Admin@123', 'AdminPassword123!', 'AdminPassword123', 'Password@123', 'password123'];

    console.log(`Verifying password for ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log("User not found.");
        return;
    }

    for (const pw of passwordsToTry) {
        const match = await bcrypt.compare(pw, user.password);
        console.log(`- Try "${pw}": ${match ? "MATCH ✅" : "NO MATCH ❌"}`);
    }

    await prisma.$disconnect();
}

verifyPassword().catch(console.error);
