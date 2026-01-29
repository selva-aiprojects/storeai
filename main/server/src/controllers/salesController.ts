import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

import { SalesService } from '../services/sales.service';

export const createSale = async (req: AuthRequest, res: Response) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const { customerId, items, paymentMethod, amountPaid, isHomeDelivery, deliveryAddress, salesmanId } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required for a sale' });
        }

        const totalExpected = items.reduce((acc: number, i: any) => acc + (Number(i.unitPrice) * Number(i.quantity)), 0);

        const result = await SalesService.createSale({
            tenantId,
            customerId,
            salesmanId,
            items: items.map((i: any) => ({
                productId: i.productId,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
                discount: Number(i.discount || 0)
            })),
            paymentMethod: paymentMethod || 'CASH',
            amountPaid: Number(amountPaid) || totalExpected, // Default to total if not provided
            isHomeDelivery,
            deliveryAddress
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message || 'Failed to process sale' });
    }
};

export const getSales = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const sales = await prisma.sale.findMany({
            where: { isDeleted: false, tenantId },
            include: {
                customer: true,
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

export const getSaleById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        const sale = await prisma.sale.findFirst({
            where: { id, tenantId },
            include: {
                customer: true,
                items: { include: { product: true } }
            },
        });
        res.json(sale);
    } catch (error) {
        res.status(404).json({ error: 'Sale not found' });
    }
};

export const updateSaleTracking = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { trackingNumber, shippingCarrier, status } = req.body;
    try {
        const sale = await prisma.sale.updateMany({
            where: { id, tenantId },
            data: {
                trackingNumber,
                shippingCarrier,
                status: status || 'SHIPPED',
                shippedAt: status === 'SHIPPED' ? new Date() : undefined
            }
        });
        res.json(sale);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update sale tracking' });
    }
};
