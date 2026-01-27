import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getSuppliers = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const suppliers = await prisma.supplier.findMany({
            where: { tenantId, isDeleted: false },
            orderBy: { name: 'asc' }
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
    const { name, contact, email, address } = req.body;
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const supplier = await prisma.supplier.create({
            data: { name, contact, email, address, tenantId }
        });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create supplier' });
    }
};

export const updateSupplier = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, contact, email, address } = req.body;
    const tenantId = req.user?.tenantId;
    try {
        const supplier = await prisma.supplier.updateMany({
            where: { id, tenantId },
            data: { name, contact, email, address }
        });
        res.json(supplier);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    try {
        await prisma.supplier.updateMany({
            where: { id, tenantId },
            data: { isDeleted: true }
        });
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        res.status(400).json({ error: 'Delete failed' });
    }
};
