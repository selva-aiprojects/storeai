import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// --- Purchase Order Lifecycle ---

export const createOrder = async (req: AuthRequest, res: Response) => {
    const { supplierId, items, status = 'DRAFT' } = req.body;
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const order = await prisma.$transaction(async (tx) => {
            const totalAmount = items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);

            const newOrder = await tx.order.create({
                data: {
                    orderNumber: `PO-${Date.now()}`,
                    totalAmount,
                    supplierId,
                    tenantId,
                    status, // DRAFT or PENDING_APPROVAL
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

            return newOrder;
        });
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create order' });
    }
};

export const approveOrder = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    // In real app, get from req.user
    const userId = req.user?.id;

    try {
        const order = await prisma.order.update({
            where: { id, tenantId }, // Ensure tenant ownership
            data: {
                status: 'APPROVED',
                approvalStatus: 'APPROVED',
                approvedById: userId
            }
        });

        // Log financial commitment (Soft Ledger)
        await prisma.ledger.create({
            data: {
                title: `PO Commitment: ${order.orderNumber}`,
                type: 'DEBIT', // Pending debit
                amount: order.totalAmount,
                category: 'PAYABLE_COMMITMENT',
                description: `Approved PO for Supplier`,
                tenantId: tenantId!
            }
        });

        res.json(order);
    } catch (error) {
        res.status(400).json({ error: 'Failed to approve order' });
    }
};

export const updateOrderTracking = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { trackingNumber, shippingCarrier, status, expectedDeliveryDate } = req.body;
    try {
        const order = await prisma.order.update({
            where: { id, tenantId },
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

// --- Goods Received Note (GRN) & 3-Way Matching ---

export const createGoodsReceipt = async (req: AuthRequest, res: Response) => {
    const { id } = req.params; // Order ID
    const tenantId = req.user?.tenantId;
    const { warehouseId, items, notes } = req.body;
    // items: [{ productId, quantity, batchNumber, expiryDate }]

    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        // Validate warehouse belongs to tenant
        const wh = await prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } });
        if (!wh) return res.status(404).json({ error: 'Warehouse not found or access denied' });

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!order || order.tenantId !== tenantId) throw new Error('Order not found');
            if (['DRAFT', 'PENDING_APPROVAL', 'CANCELLED', 'COMPLETED'].includes(order.status)) {
                throw new Error('Order is not in a receivable state');
            }

            // 1. Create GRN Header
            const grn = await tx.goodsReceipt.create({
                data: {
                    grnNumber: `GRN-${Date.now()}`,
                    orderId: id,
                    warehouseId,
                    notes,
                    items: {
                        create: items.map((i: any) => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            batchNumber: i.batchNumber, // Batch Tracking Logic
                            expiryDate: i.expiryDate ? new Date(i.expiryDate) : null
                        }))
                    }
                }
            });

            // 2. Update Inventory (Stock + Batch) & Order Received Qty
            let allItemsFullyReceived = true;

            for (const grnItem of items) {
                // Update Order Item 'receivedQuantity'
                const orderItem = order.items.find(oi => oi.productId === grnItem.productId);
                if (orderItem) {
                    await tx.orderItem.update({
                        where: { id: orderItem.id },
                        data: { receivedQuantity: { increment: grnItem.quantity } }
                    });

                    if ((orderItem.receivedQuantity + grnItem.quantity) < orderItem.quantity) {
                        allItemsFullyReceived = false;
                    }
                }

                // Update Warehouse Stock (General Product Level)
                await tx.product.updateMany({
                    where: { id: grnItem.productId, tenantId },
                    data: { stockQuantity: { increment: grnItem.quantity } }
                });

                // Update Batch/Lot Specific Stock
                // Check if stock entry exists for this Batch+Warehouse+Product
                // Note: Since we removed the unique key for batch flexibility in schemaStep, 
                // we treat a new entry as a new batch packet or fetch existing if we implemented strict logic.
                // For this implementation, we simply Create a new Stock Line for every Batch Receipt to ensure traceability.
                // This mimics "Quants" in Odoo.
                await tx.stock.create({
                    data: {
                        productId: grnItem.productId,
                        warehouseId,
                        quantity: grnItem.quantity,
                        batchNumber: grnItem.batchNumber || 'GENERAL',
                        expiryDate: grnItem.expiryDate ? new Date(grnItem.expiryDate) : null
                    }
                });
            }

            // 3. Update Order Status
            const finalStatus = allItemsFullyReceived ? 'COMPLETED' : 'PARTIAL_RECEIVED';
            await tx.order.update({
                where: { id },
                data: { status: finalStatus }
            });

            return grn;
        });

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message || 'Failed to process GRN' });
    }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const orders = await prisma.order.findMany({
            where: { tenantId },
            include: {
                supplier: true,
                items: { include: { product: true } },
                goodsReceipts: { include: { items: true } } // Include GRNs for visibility
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};
