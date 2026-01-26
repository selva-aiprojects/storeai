
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdmin() {
    console.log('Resetting Admin Password...');
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    try {
        const user = await prisma.user.upsert({
            where: { email: 'admin@storeai.com' },
            update: { password: hashedPassword, role: 'SUPER_ADMIN' },
            create: {
                email: 'admin@storeai.com',
                password: hashedPassword,
                firstName: 'Chief',
                lastName: 'Administrator',
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ Admin reset success:', user.email);

        // Also verify the user exists
        const verify = await prisma.user.findUnique({ where: { email: 'admin@storeai.com' } });
        console.log('🔍 Verified in DB:', verify?.email);
    } catch (e) {
        console.error('❌ Failed to reset:', e);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
