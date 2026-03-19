import bcrypt from 'bcryptjs';
import prisma from './lib/prisma';
import { logger } from './utils/logger';

export const ensureAdminAccessOnBoot = async () => {
    const enabled = (process.env.AUTO_FIX_ADMIN_ON_BOOT || '').toLowerCase() === 'true';
    if (!enabled) return;

    const email = process.env.INITIAL_ADMIN_EMAIL || 'admin@storeai.com';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123';
    const tenantSlug = process.env.INITIAL_ADMIN_TENANT_SLUG || 'storeai';
    const tenantName = process.env.INITIAL_ADMIN_TENANT_NAME || 'StoreAI Corporate Hub';

    try {
        logger.warn('[BOOTSTRAP] AUTO_FIX_ADMIN_ON_BOOT is enabled. Ensuring admin access...');
        const hash = await bcrypt.hash(password, 10);

        const role = await prisma.role.upsert({
            where: { code: 'SUPER_ADMIN' },
            update: { name: 'Super Admin' },
            create: { name: 'Super Admin', code: 'SUPER_ADMIN' }
        });

        const tenant = await prisma.tenant.upsert({
            where: { slug: tenantSlug },
            update: { status: 'ACTIVE' },
            create: { name: tenantName, slug: tenantSlug, status: 'ACTIVE' }
        });

        const user = await prisma.user.upsert({
            where: { email },
            update: { password: hash, role: 'SUPER_ADMIN', isActive: true, isDeleted: false },
            create: {
                email,
                password: hash,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'SUPER_ADMIN',
                isActive: true
            }
        });

        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
            update: { roleId: role.id, isActive: true },
            create: { userId: user.id, tenantId: tenant.id, roleId: role.id, isActive: true }
        });

        logger.warn(`[BOOTSTRAP] Admin access ensured for ${email} on tenant '${tenantSlug}'.`);
    } catch (error) {
        logger.error(`[BOOTSTRAP] Failed to ensure admin access: ${error}`);
    }
};

