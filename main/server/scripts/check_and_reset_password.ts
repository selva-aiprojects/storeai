import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndResetPassword() {
    const email = 'admin@storeai.com';
    const expectedPassword = 'AdminPassword123!';

    console.log(`\n🔍 Checking password for: ${email}\n`);

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            password: true,
            firstName: true,
            lastName: true
        }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);

    // Test with expected password
    const isMatch = await bcrypt.compare(expectedPassword, user.password);
    console.log(`\n🔑 Password "${expectedPassword}" matches: ${isMatch ? '✅ YES' : '❌ NO'}`);

    if (!isMatch) {
        console.log(`\n🔧 Resetting password to: ${expectedPassword}`);
        const hashedPassword = await bcrypt.hash(expectedPassword, 10);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('✅ Password reset successful!');

        // Verify the reset
        const updatedUser = await prisma.user.findUnique({
            where: { email },
            select: { password: true }
        });

        const verifyMatch = await bcrypt.compare(expectedPassword, updatedUser!.password);
        console.log(`🔍 Verification: ${verifyMatch ? '✅ Password works!' : '❌ Still broken'}`);
    } else {
        console.log('\n✅ Password is already correct!');
    }
}

checkAndResetPassword().finally(() => prisma.$disconnect());
