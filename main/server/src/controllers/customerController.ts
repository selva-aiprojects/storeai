import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const customers = await prisma.customer.findMany({
            where: { tenantId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
    const { name, email, phone, address, city, zipCode } = req.body;
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const customer = await prisma.customer.create({
            data: { name, email, phone, address, city, zipCode, tenantId }
        });
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create customer' });
    }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const data = req.body;
    try {
        const customer = await prisma.customer.updateMany({
            where: { id, tenantId },
            data
        });
        res.json(customer);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};
