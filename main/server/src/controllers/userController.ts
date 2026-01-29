import { Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';

export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const currentTenantId = req.user?.tenantId;
        const { email, password, firstName, lastName, roleCode, tenantId: bodyTenantId } = req.body;

        if (!currentTenantId) return res.status(403).json({ error: 'Tenant context required' });

        // Security: Only StoreAI Hub Admins can provision users for OTHER tenants
        let targetTenantId = currentTenantId;
        const currentTenant = await prisma.tenant.findUnique({ where: { id: currentTenantId } });
        if (currentTenant?.slug === 'storeai' && bodyTenantId) {
            targetTenantId = bodyTenantId;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: { email, password: hashedPassword, firstName, lastName }
            });
        }

        // Assign to Tenant
        // Find role by code
        const role = await prisma.role.findFirst({ where: { code: roleCode || 'STAFF' } });
        if (!role) return res.status(400).json({ error: 'Invalid role code: ' + (roleCode || 'STAFF') });

        // Check if already assigned to this tenant to prevent duplicates
        const existingAssignment = await prisma.userTenant.findUnique({
            where: { userId_tenantId: { userId: user.id, tenantId: targetTenantId } }
        });

        if (existingAssignment) {
            return res.status(400).json({ error: 'Operator is already provisioned for this organization' });
        }

        await prisma.userTenant.create({
            data: {
                userId: user.id,
                tenantId: targetTenantId,
                roleId: role.id
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'User creation failed' });
    }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const userTenants = await prisma.userTenant.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true, isActive: true }
                },
                role: true
            }
        });

        // Flatten for frontend
        const users = userTenants.map(ut => ({
            ...ut.user,
            role: ut.role.code, // Send role code for UI
            roleName: ut.role.name
        }));

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        const { email, firstName, lastName, roleCode, isActive, password } = req.body;

        // Verify user belongs to tenant
        const userTenant = await prisma.userTenant.findUnique({
            where: { userId_tenantId: { userId: id, tenantId: tenantId! } }
        });

        if (!userTenant) return res.status(404).json({ error: 'User not found in this tenant' });

        // Update User Profile
        const updateData: any = { email, firstName, lastName };
        if (password) updateData.password = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id },
            data: updateData
        });

        // Update Role/Status in Tenant
        if (roleCode) {
            const role = await prisma.role.findFirst({ where: { code: roleCode } });
            if (role) {
                await prisma.userTenant.update({
                    where: { userId_tenantId: { userId: id, tenantId: tenantId! } },
                    data: { roleId: role.id, isActive: isActive !== undefined ? isActive : userTenant.isActive }
                });
            }
        } else if (isActive !== undefined) {
            await prisma.userTenant.update({
                where: { userId_tenantId: { userId: id, tenantId: tenantId! } },
                data: { isActive }
            });
        }

        res.json({ message: 'User updated' });
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        // Remove from tenant (don't delete user entirely as they might belong to other tenants)
        await prisma.userTenant.delete({
            where: { userId_tenantId: { userId: id, tenantId: tenantId! } }
        });

        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Delete failed' });
    }
};
