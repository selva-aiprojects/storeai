import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getMyTenant = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true }
        });

        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tenant info' });
    }
};

export const updateTenantBranding = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { name, logo } = req.body;

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: { name, logo }
        });

        res.json(updated);
    } catch (error) {
        console.error("Update Branding Error:", error);
        res.status(400).json({ error: 'Failed to update branding' });
    }
};

export const updateTenantFeatures = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { features } = req.body;

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: { features }
        });

        res.json(updated);
    } catch (error) {
        console.error("Update Features Error:", error);
        res.status(400).json({ error: 'Failed to update features' });
    }
};

export const createTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { name, slug, planId } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Ensure slug is clean
        const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');

        const superAdminRole = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
        if (!superAdminRole) return res.status(500).json({ error: 'System Roles not initialized. Please run seeding.' });

        // Resolve plan by name (frontend sends 'PRO' or 'ENTERPRISE')
        const plan = await prisma.plan.findUnique({ where: { name: planId || 'PRO' } });
        if (!plan) return res.status(400).json({ error: 'Selected subscription plan not found' });

        const tenant = await prisma.tenant.create({
            data: {
                name,
                slug: cleanSlug,
                planId: plan.id,
                status: 'ACTIVE', // Admin created tenants are active by default
                users: {
                    create: {
                        userId: userId,
                        roleId: superAdminRole.id
                    }
                }
            }
        });

        res.status(201).json(tenant);
    } catch (error: any) {
        console.error("Create Tenant Error:", error);
        res.status(400).json({ error: error.message || 'Failed to create tenant' });
    }
};

export const getPlans = async (req: AuthRequest, res: Response) => {
    try {
        const plans = await prisma.plan.findMany();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
};

export const getAllTenants = async (req: AuthRequest, res: Response) => {
    try {
        // In a real production system, you'd check if the user is a "System Admin"
        // For this demo/validation platform, we allow SUPER_ADMINs to see the directory
        const tenants = await prisma.tenant.findMany({
            include: {
                plan: true,
                _count: {
                    select: { users: true }
                }
            }
        });
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tenants directory' });
    }
};
export const adminUpdateTenant = async (req: AuthRequest, res: Response) => {
    try {
        // Strict security: Only Hub Admin (from 'storeai' slug) can manage other tenants
        const adminTenantId = req.user?.tenantId;
        const adminTenant = await prisma.tenant.findUnique({ where: { id: adminTenantId } });

        if (adminTenant?.slug !== 'storeai') {
            return res.status(403).json({ error: 'System Administration privileges required' });
        }

        const { id } = req.params;
        const { planId, status, features } = req.body;

        const updated = await prisma.tenant.update({
            where: { id },
            data: { planId, status, features }
        });

        res.json(updated);
    } catch (error) {
        console.error("Admin Tenant Update Error:", error);
        res.status(400).json({ error: 'Failed to manage tenant subscription' });
    }
};
