import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- RESETTING ADMIN USER ---');
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    // Ensure Management Dept Exists
    let dept = await prisma.department.findUnique({ where: { name: 'Management' } });
    if (!dept) {
        dept = await prisma.department.create({ data: { name: 'Management' } });
    }

    // Upsert Admin User
    const user = await prisma.user.upsert({
        where: { email: 'admin@storeai.com' },
        update: { password: hashedPassword, role: 'SUPER_ADMIN' },
        create: {
            email: 'admin@storeai.com',
            password: hashedPassword,
            firstName: 'System',
            lastName: 'Admin',
            role: 'SUPER_ADMIN'
        }
    });

    console.log('User created:', user.id);

    // Upsert Admin Employee
    await prisma.employee.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            employeeId: 'EMP-ADMIN',
            firstName: 'System',
            lastName: 'Admin',
            designation: 'Super User',
            joiningDate: new Date(),
            salary: 0,
            departmentId: dept.id,
            userId: user.id
        }
    });

    console.log('✔ Admin Access Restored');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
