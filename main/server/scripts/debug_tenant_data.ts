
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('🔍 Debugging Tenant & Data Visibility...');

    // 1. Check Tenant
    const tenant = await prisma.tenant.findFirst({ where: { name: 'Demo Tech Store' } });
    if (!tenant) {
        console.error('❌ Tenant "Demo Tech Store" does NOT exist.');
        return;
    }
    console.log(`✅ Tenant Found: ${tenant.name} (${tenant.id})`);

    // 2. Check Admin User
    const email = 'admin@storeai.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenants: true }
    });
    if (!user) {
        console.error(`❌ User ${email} does NOT exist.`);
        return;
    }
    console.log(`✅ User Found: ${user.email} (${user.id})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Linked Tenants: ${user.tenants.length}`);
    user.tenants.forEach(t => console.log(`   - TenantID: ${t.tenantId} (Active: ${t.isActive})`));

    // 3. Check Link
    const isLinked = user.tenants.some(t => t.tenantId === tenant.id);
    if (!isLinked) {
        console.warn('⚠️ Admin is NOT linked to the Demo Tenant! Attempting verification fix...');
        // Force link
        await prisma.userTenant.create({
            data: {
                userId: user.id,
                tenantId: tenant.id,
                roleId: 'ADMIN_ROLE_STUB', // Schema might require a valid Role ID
                isActive: true
            }
        }).catch(async e => {
            // If failed, maybe roleId issue. Let's find a role.
            const role = await prisma.role.findFirst();
            if (role) {
                await prisma.userTenant.create({
                    data: { userId: user.id, tenantId: tenant.id, roleId: role.id }
                });
                console.log('   ✅ Fixed Link with existing Role.');
            } else {
                console.error('   ❌ Could not fix link, no Roles found.');
            }
        });
    } else {
        console.log('✅ Admin is correctly linked to Demo Tenant.');
    }

    // 4. Check Employees for this Tenant
    const employees = await prisma.employee.findMany({ where: { department: { tenantId: tenant.id } } }); // via Dept
    // OR via direct? Schema had employee.department.tenant... let's check schema for direct tenantId on Employee?
    // Looking at previous schema view: Employee has `departmentId`. Department has `tenantId`.
    // Wait, earlier schema view (Line 581 of view 939) showed `model Department { ... tenantId ... }`
    // And Employee (Line 605) `departmentId`.
    // BUT checking my seed_hr_data... I used `departmentId`.
    // Let's count via department.

    // Also check if Employee has direct `tenantId`? The schema has it?
    // Line 591 in view 931: `model Employee` ... checking fields...
    // It has `departmentId`. Does it have `tenantId`?
    // I don't see `tenantId` in the visible lines 591-618 of Step 931.
    // Wait... `requisitionController` fix (Step 779) removed `tenantId` from findFirst because it didn't exist!
    // So Employee relies on Department -> Tenant.

    const empCount = await prisma.employee.count({
        where: { department: { tenantId: tenant.id } }
    });
    console.log(`📊 Employees under Tenant: ${empCount}`);

    // 5. Check Attendance
    const attCount = await prisma.attendance.count({
        where: { employee: { department: { tenantId: tenant.id } } }
    });
    console.log(`📊 Attendance Records: ${attCount}`);

}

debug()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
