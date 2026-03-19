import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const requestOnboarding = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, orgName, orgSlug } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Operator account already exists' });

        const existingTenant = await prisma.tenant.findUnique({ where: { slug: orgSlug } });
        if (existingTenant) return res.status(400).json({ error: 'Tenant ID is already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const proPlan = await prisma.plan.findUnique({ where: { name: 'PRO' } });

        // Create Tenant (PENDING), User, and Link in one transaction
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: orgName,
                    slug: orgSlug,
                    status: 'PENDING',
                    planId: proPlan?.id,
                    features: { "RETAIL_MODULE": true, "INVENTORY_MODULE": true } // Default starter modules
                }
            });

            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: 'SUPER_ADMIN'
                }
            });

            const superAdminRole = await tx.role.findUnique({ where: { code: 'SUPER_ADMIN' } });

            await tx.userTenant.create({
                data: {
                    userId: user.id,
                    tenantId: tenant.id,
                    roleId: superAdminRole?.id || ''
                }
            });

            return { tenant, user };
        });

        res.status(201).json({ message: 'ONBOARDING REQUESTED: Your tenant request is now being reviewed by the StoreAI Platform Team.' });
    } catch (error) {
        console.error("Onboarding Request Error:", error);
        res.status(500).json({ error: 'Onboarding request failed. Please check your data.' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, tenantSlug } = req.body;

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

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.tenants.length === 0) {
            return res.status(403).json({ error: 'User is not associated with any account' });
        }

        // Determine active tenant in a stable/safe order:
        // 1) requested tenantSlug
        // 2) StoreAI hub tenant
        // 3) any ACTIVE tenant
        // 4) fallback to first relation
        let activeTenantRelation = user.tenants[0];
        if (tenantSlug) {
            const found = user.tenants.find(t => t.tenant.slug === tenantSlug);
            if (found) activeTenantRelation = found;
        } else {
            const storeAiTenant = user.tenants.find(t => t.tenant.slug === 'storeai');
            const activeTenant = user.tenants.find(t => t.tenant.status === 'ACTIVE');
            if (storeAiTenant) {
                activeTenantRelation = storeAiTenant;
            } else if (activeTenant) {
                activeTenantRelation = activeTenant;
            }
        }

        const activeTenant = activeTenantRelation.tenant;

        // Onboarding/Approval Workflow Check
        if (activeTenant.status === 'PENDING' && activeTenant.slug !== 'storeai') {
            return res.status(403).json({ error: 'ONBOARDING PENDING: Your tenant is currently being reviewed by the StoreAI Platform Team.' });
        }
        if (activeTenant.status === 'SUSPENDED') {
            return res.status(403).json({ error: 'ACCESS DENIED: Your tenant subscription has been suspended. Please contact StoreAI Hub Administration.' });
        }

        const activeRole = activeTenantRelation.role;
        const permissions = activeRole.permissions.map(p => p.code);
        const features = {
            ...(activeTenant.plan?.features as object || {}),
            ...(activeTenant.features as object || {})
        };

        const tokenOptions: any = {};
        if (JWT_EXPIRES_IN && JWT_EXPIRES_IN !== 'never') {
            tokenOptions.expiresIn = JWT_EXPIRES_IN;
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenantId: activeTenant.id,
                tenantSlug: activeTenant.slug,
                role: activeRole.code,
                permissions,
                features
            },
            JWT_SECRET,
            tokenOptions
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                activeTenant: {
                    id: activeTenant.id,
                    name: activeTenant.name,
                    slug: activeTenant.slug,
                    logo: activeTenant.logo,
                    plan: activeTenant.plan?.name
                },
                role: activeRole.code,
                permissions,
                features
            },
            availableTenants: user.tenants.map(t => ({
                id: t.tenant.id,
                name: t.tenant.name,
                slug: t.tenant.slug
            }))
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
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

        if (!user || user.tenants.length === 0) {
            return res.status(404).json({ error: 'User or tenant association not found' });
        }

        // Determine active tenant based on the token's tenantId
        const activeTenantId = req.user?.tenantId;
        const activeTenantRelation = user.tenants.find(t => t.tenantId === activeTenantId) || user.tenants[0];
        const activeTenant = activeTenantRelation.tenant;

        // Onboarding/Approval Workflow Check
        if (activeTenant.status === 'PENDING' && activeTenant.slug !== 'storeai') {
            return res.status(403).json({ error: 'ONBOARDING PENDING: Your tenant is currently being reviewed by the StoreAI Platform Team.' });
        }
        if (activeTenant.status === 'SUSPENDED') {
            return res.status(403).json({ error: 'ACCESS DENIED: Your tenant subscription has been suspended. Please contact StoreAI Hub Administration.' });
        }
        const activeRole = activeTenantRelation.role;
        const permissions = activeRole.permissions.map(p => p.code);
        const features = {
            ...(activeTenant.plan?.features as object || {}),
            ...(activeTenant.features as object || {})
        };

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            activeTenant: {
                id: activeTenant.id,
                name: activeTenant.name,
                slug: activeTenant.slug,
                logo: activeTenant.logo,
                plan: activeTenant.plan?.name
            },
            role: activeRole.code,
            permissions,
            features
        });
    } catch (error) {
        console.error("GetMe Error:", error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
};
