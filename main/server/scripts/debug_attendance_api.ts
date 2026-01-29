
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAttendanceAPI() {
    console.log('🔍 Testing Attendance API & Data...');

    // 1. Get Token (Admin)
    const admin = await prisma.user.findUnique({ where: { email: 'admin@storeai.com' } });
    if (!admin) { console.error('No Admin'); return; }

    // We can't easily generate a JWT here without the secret + sign logic effectively.
    // Instead, let's look at the DB data for the date the user is looking at: 2026-01-28.

    // 2. Query DB directly for 2026-01-28
    const targetDateStart = new Date('2026-01-28T00:00:00.000Z');
    const targetDateEnd = new Date('2026-01-28T23:59:59.999Z');

    console.log(`📅 Querying Data for: ${targetDateStart.toISOString()}`);

    const attendance = await prisma.attendance.findMany({
        where: {
            date: {
                gte: targetDateStart,
                lte: targetDateEnd
            }
        },
        include: { employee: true }
    });

    console.log(`📊 Records Found: ${attendance.length}`);
    attendance.forEach(a => {
        console.log(`   - [${a.status}] ${a.employee?.firstName} ${a.employee?.lastName} (Tenant: ${a.employee?.departmentId})`);
    });

    if (attendance.length === 0) {
        console.log('⚠️ No records found for this specific date.');

        // Check surrounding?
        const all = await prisma.attendance.count();
        console.log(`   Total Attendance Records in DB: ${all}`);

        const first = await prisma.attendance.findFirst({ orderBy: { date: 'asc' } });
        console.log(`   First Record Date: ${first?.date}`);
    }
}

testAttendanceAPI()
    .finally(async () => await prisma.$disconnect());
