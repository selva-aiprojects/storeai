import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createOrder = async (req: Request, res: Response) => {
    const { supplierId, items } = req.body;
    try {
        const order = await prisma.$transaction(async (tx) => {
            const totalAmount = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);

            const newOrder = await tx.order.create({
                data: {
                    orderNumber: `PO-${Date.now()}`,
                    totalAmount,
                    supplierId,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice
                        }))
                    }
                },
                include: { items: true }
            });

            // Log debit for purchase
            await tx.ledger.create({
                data: {
                    title: `Purchase Order: ${newOrder.orderNumber}`,
                    type: 'DEBIT',
                    amount: totalAmount,
                    description: `Stock Purchase from Supplier ${supplierId}`
                }
            });

            return newOrder;
        });
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create order' });
    }
};

export const updateOrderTracking = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { trackingNumber, shippingCarrier, status, expectedDeliveryDate } = req.body;
    try {
        const order = await prisma.order.update({
            where: { id },
            data: {
                trackingNumber,
                shippingCarrier,
                status: status || 'SHIPPED',
                shippedAt: status === 'SHIPPED' ? new Date() : undefined,
                expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined
            }
        });
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update tracking' });
    }
};

export const receiveOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order || order.status === 'RECEIVED') {
                throw new Error('Order already received or not found');
            }

            // Update Stock
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { increment: item.quantity } }
                });
            }

            const updatedOrder = await tx.order.update({
                where: { id },
                data: { status: 'RECEIVED', updatedAt: new Date() }
            });

            return updatedOrder;
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { supplier: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
