import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function checkLogin() {
    const email = 'admin@storeai.com';
    const testPassword = 'password';

    console.log('=== Checking Admin User ===');

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenants: {
                include: {
                    tenant: true,
                    role: { include: { permissions: true } }
                }
            }
        }
    });

    if (!user) {
        console.log('❌ USER NOT FOUND:', email);
        console.log('\nRun: npx ts-node scripts/reset_admin.ts to create the user');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ User Found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Has Password:', !!user.password);
    console.log('   Password Hash:', user.password?.substring(0, 20) + '...');

    // Test password
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('   Password "password" Match:', isMatch);

    console.log('\n=== Tenant Associations ===');
    if (user.tenants.length === 0) {
        console.log('❌ NO TENANT ASSOCIATIONS - This is why login fails!');
    } else {
        user.tenants.forEach((ut, i) => {
            console.log(`   [${i + 1}] Tenant: ${ut.tenant.name} (${ut.tenant.slug})`);
            console.log(`       Status: ${ut.tenant.status}`);
            console.log(`       Role: ${ut.role?.code || 'NO ROLE'}`);
            console.log(`       Permissions: ${ut.role?.permissions?.length || 0}`);
        });
    }

    await prisma.$disconnect();
}

checkLogin().catch(console.error);
