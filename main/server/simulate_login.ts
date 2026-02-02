
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function simulateLogin() {
    const email = 'admin@storeai.com';
    const password = 'Admin@123';

    console.log(`Simulating login for ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                tenants: {
                    include: {
                        tenant: {
                            include: { plan: true }
                        },
                        role: {
                            include: { permissions: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log("❌ FAILED: User not found");
            return;
        }

        const passMatch = await bcrypt.compare(password, user.password);
        if (!passMatch) {
            console.log("❌ FAILED: Password mismatch");
            console.log("Password tried:", password);
            console.log("Hash in DB starts with:", user.password.substring(0, 7));
            return;
        }

        console.log("✅ SUCCESS: Password matches");

        if (user.tenants.length === 0) {
            console.log("❌ FAILED: No tenants associated");
            return;
        }

        console.log(`User has ${user.tenants.length} tenants.`);
        user.tenants.forEach((t, i) => {
            console.log(`${i + 1}. ${t.tenant.name} (${t.tenant.slug}) - Role: ${t.role.code}, Permissions: ${t.role.permissions.length}`);
        });

        const activeTenantRelation = user.tenants[0];
        const activeTenant = activeTenantRelation.tenant;
        console.log(`Picking default tenant: ${activeTenant.slug}`);

        if (activeTenant.status !== 'ACTIVE') {
            console.log(`❌ FAILED: Tenant status is ${activeTenant.status}`);
            return;
        }

        console.log("🎉 LOGIN LOGIC PASSED! All conditions met for session generation.");

    } catch (error) {
        console.error("💥 SYSTEM CRASH IN LOGIC:", error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateLogin().catch(console.error);
