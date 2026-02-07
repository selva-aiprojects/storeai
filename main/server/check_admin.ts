import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
    const email = 'admin@storeai.com';

    console.log('Checking admin account...');
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            tenants: {
                include: {
                    tenant: true,
                    role: true
                }
            }
        }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('\nUser Details:');
    console.log('Email:', user.email);
    console.log('First Name:', user.firstName);
    console.log('Last Name:', user.lastName);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('Deleted:', user.isDeleted);

    console.log('\nTenant Associations:');
    for (const ut of user.tenants) {
        console.log('- Tenant:', ut.tenant.name, '(' + ut.tenant.slug + ')');
        console.log('  Status:', ut.tenant.status);
        console.log('  Role:', ut.role.code);
        console.log('  Active:', ut.isActive);
    }

    console.log('\nPassword Check:');
    const testPassword = 'Admin@123';
    const match = await bcrypt.compare(testPassword, user.password);
    console.log('Test password "Admin@123":', match ? 'MATCHES' : 'DOES NOT MATCH');

    await prisma.$disconnect();
}

checkAdmin().catch(console.error);
