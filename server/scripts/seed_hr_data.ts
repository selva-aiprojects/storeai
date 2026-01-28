
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedHR() {
    console.log('🌱 Starting HR Data Seed (Employees + Jan 2026 Attendance)...');

    // 1. GET TENANT
    const tenantName = 'Demo Tech Store';
    let tenantId = '';
    try {
        const tenant = await prisma.tenant.findFirst({ where: { name: tenantName } });
        if (!tenant) {
            console.error('❌ Tenant "Demo Tech Store" not found. Run seed_demo_data.ts first.');
            process.exit(1);
        }
        tenantId = tenant.id;

        // ENSURE ADMIN LINK
        const adminEmail = 'admin@storeai.com';
        const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (admin) {
            const link = await prisma.userTenant.findUnique({
                where: { userId_tenantId: { userId: admin.id, tenantId } }
            });
            if (!link) {
                // Try to find a role
                const role = await prisma.role.findFirst();
                if (role) {
                    await prisma.userTenant.create({
                        data: { userId: admin.id, tenantId, roleId: role.id, isActive: true }
                    });
                    console.log('🔗 Linked Admin to Tenant.');
                }
            }
        }
    } catch (e: any) {
        console.error('❌ Tenant Error:', e.message);
        return;
    }

    // 2. GET OR CREATE DEPARTMENT
    let deptId = '';
    try {
        let dept = await prisma.department.findFirst({ where: { tenantId } });
        if (!dept) {
            dept = await prisma.department.create({
                data: {
                    name: 'Retail Operations',
                    code: 'OPS',
                    tenantId
                }
            });
            console.log('✅ Department Created:', dept.name);
        }
        deptId = dept.id;
    } catch (e: any) {
        console.error('❌ Department Error:', e.message);
        return;
    }

    // 3. CREATE EMPLOYEES
    const employeesData = [
        { first: 'Alice', last: 'Johnson', role: 'Sales Executive', salary: 45000 },
        { first: 'Bob', last: 'Smith', role: 'Store Keeper', salary: 35000 },
        { first: 'Charlie', last: 'Brown', role: 'Sales Executive', salary: 42000 },
        { first: 'David', last: 'Wilson', role: 'Accountant', salary: 55000 },
        { first: 'Eva', last: 'Davis', role: 'Sales Executive', salary: 46000 },
        { first: 'Frank', last: 'Miller', role: 'Logistics Coordinator', salary: 38000 },
        { first: 'Grace', last: 'Taylor', role: 'Sales Executive', salary: 43000 },
        { first: 'Henry', last: 'Anderson', role: 'Store Keeper', salary: 36000 },
        { first: 'Ivy', last: 'Thomas', role: 'Sales Executive', salary: 44000 },
        { first: 'Jack', last: 'White', role: 'Logistics Coordinator', salary: 39000 },
    ];

    const employeeIds: string[] = [];

    // CLEANUP OLD DATA
    try {
        // Find employees with these IDs to delete
        const targetIds = employeesData.map((_, i) => `EMP-${202600 + i}`);
        await prisma.attendance.deleteMany({
            where: { employee: { employeeId: { in: targetIds } } }
        });
        await prisma.employee.deleteMany({
            where: { employeeId: { in: targetIds } }
        });
        console.log('🧹 Cleaned up old test data.');
    } catch (e) {
        console.warn('⚠️ Cleanup warning:', e);
    }

    for (let i = 0; i < employeesData.length; i++) {
        const e = employeesData[i];
        const empIdStr = `EMP-${202600 + i}`;

        try {
            const emp = await prisma.employee.upsert({
                where: { employeeId: empIdStr },
                update: {},
                create: {
                    firstName: e.first,
                    lastName: e.last,
                    employeeId: empIdStr,
                    designation: e.role,
                    joiningDate: new Date('2025-01-15'),
                    salary: e.salary,
                    departmentId: deptId,
                    pan: `ABCDE${1000 + i}F`,
                    bankAccountNo: `9876543210${i}`,
                    status: 'ACTIVE'
                }
            });
            employeeIds.push(emp.id);
        } catch (err: any) {
            console.error(`⚠️ Error creating employee ${e.first}:`, err.message);
        }
    }
    console.log(`✅ ${employeeIds.length} Employees Synced.`);

    // 4. GENERATE ATTENDANCE FOR JANUARY 2026
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-28');

    let count = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday
        const isWeekend = dayOfWeek === 0;

        for (const empId of employeeIds) {
            // Determine Status
            let status = 'PRESENT';
            let checkIn: Date | null = new Date(currentDate);
            checkIn.setHours(9, 0, 0);
            let checkOut: Date | null = new Date(currentDate);
            checkOut.setHours(18, 0, 0);

            if (isWeekend) {
                status = 'LEAVE';
                checkIn = null;
                checkOut = null;
            } else {
                const rand = Math.random();
                if (rand > 0.95) {
                    status = 'ABSENT';
                    checkIn = null;
                    checkOut = null;
                } else if (rand > 0.90) {
                    status = 'HALF_DAY';
                    checkOut.setHours(13, 0, 0);
                } else if (rand > 0.88) {
                    status = 'LEAVE';
                    checkIn = null;
                    checkOut = null;
                }
            }

            try {
                // Avoiding composite key constraints if relevant, but schema has separate ID
                // Just create
                await prisma.attendance.create({
                    data: {
                        date: currentDate,
                        status,
                        checkIn,
                        checkOut,
                        employeeId: empId
                    }
                });
                count++;
            } catch (attErr: any) {
                // Ignore duplicate or minor errors to keep loop going
                // console.warn('Attendance skip:', attErr.message); 
            }
        }
    }

    console.log(`✅ Attendance Generated: ${count} records for Jan 2026.`);
}

seedHR()
    .catch(e => {
        console.error('CRITICAL:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
