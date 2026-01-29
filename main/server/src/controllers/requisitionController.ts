import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getRequisitions = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const requisitions = await prisma.purchaseRequisition.findMany({
            where: { tenantId },
            include: {
                requestedBy: true,
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requisitions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requisitions' });
    }
};

export const createRequisition = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { items, notes, priority } = req.body;

        const employee = await prisma.employee.findFirst({
            where: { userId: req.user?.id }
        });

        if (!employee) return res.status(403).json({ error: 'Employee profile not found' });

        const result = await prisma.purchaseRequisition.create({
            data: {
                requisitionNo: `PR-${Date.now()}`,
                priority: priority || 'MEDIUM',
                notes,
                requestedById: employee.id,
                tenantId: tenantId!,
                items: {
                    create: items.map((i: any) => ({
                        productId: i.productId,
                        quantity: Number(i.quantity)
                    }))
                }
            },
            include: { items: true }
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message || 'Failed to create requisition' });
    }
};

export const updateRequisitionStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const tenantId = req.user?.tenantId;

        const result = await prisma.purchaseRequisition.updateMany({
            where: { id, tenantId },
            data: { status }
        });

        res.json({ message: 'Status updated', result });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update requisition' });
    }
};
