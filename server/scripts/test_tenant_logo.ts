import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function regressionTest() {
    console.log('--- STARTING REGRESSION TEST: TENANT LOGO PROVISIONING ---');

    const testSlug = 'regression-test-org-' + Date.now();

    // Simulation: We use the existing Cognivectra logo as the 'new' tenant logo for testing
    const logoPath = path.join(__dirname, '../src/logo.png'); // Adjusted for ts-node running from scripts/
    let base64Logo = '';

    try {
        const bitmap = fs.readFileSync(logoPath);
        base64Logo = `data:image/png;base64,${bitmap.toString('base64')}`;
        console.log('✔ Successfully loaded existing logo for test');
    } catch (e) {
        console.log('⚠ Could not load logo file, using placeholder');
        base64Logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }

    // Find a plan and role
    const plan = await prisma.plan.findFirst({ where: { name: 'PRO' } });
    const role = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@storeai.com' } });

    if (!plan || !role || !adminUser) {
        console.error('❌ Test Pre-requisites missing. Run seed_roles.ts first.');
        return;
    }

    try {
        const tenant = await prisma.tenant.create({
            data: {
                name: 'Regression Test Organization',
                slug: testSlug,
                logo: base64Logo,
                planId: plan.id,
                status: 'ACTIVE',
                users: {
                    create: {
                        userId: adminUser.id,
                        roleId: role.id
                    }
                }
            }
        });

        console.log('✔ Tenant Created with Logo:', tenant.name);
        console.log('✔ Logo Data Length:', tenant.logo?.length);
        console.log('✔ Tenant Slug:', tenant.slug);

        // Verify retrieval
        const fetched = await prisma.tenant.findUnique({ where: { id: tenant.id } });
        if (fetched?.logo === base64Logo) {
            console.log('✅ PASS: Tenant logo persisted and retrieved correctly.');
        } else {
            console.log('❌ FAIL: Logo mismatch or null.');
        }

        // Cleanup (optional, but good for regression)
        // await prisma.userTenant.deleteMany({ where: { tenantId: tenant.id } });
        // await prisma.tenant.delete({ where: { id: tenant.id } });
        // console.log('✔ Test Data Cleaned');

    } catch (error) {
        console.error('❌ Regression Test Failed:', error);
    }
}

regressionTest()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
