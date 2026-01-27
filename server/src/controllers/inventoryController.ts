import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getInventorySummary = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const stocks = await prisma.stock.findMany({
            where: { product: { tenantId } },
            include: {
                product: true,
                warehouse: true
            }
        });
        res.json(stocks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
};

export const createDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { type, sourceWarehouseId, targetWarehouseId, items, notes } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Document
            const doc = await tx.inventoryDocument.create({
                data: {
                    type, // POST_RECEIPT, TRANSFER, ADJUSTMENT
                    status: 'POSTED', // Auto-post for now
                    sourceWarehouseId,
                    targetWarehouseId,
                    notes,
                    tenantId,
                    items: {
                        create: items.map((i: any) => ({
                            productId: i.productId,
                            quantity: Number(i.quantity)
                        }))
                    },
                    performedBy: req.user?.firstName || 'Admin'
                },
                include: { items: true }
            });

            // 2. Process Movements based on Type
            for (const item of items) {
                const qty = Number(item.quantity);

                if (type === 'RECEIPT') {
                    // Add to Source (which is the receiving warehouse in this context)
                    await tx.stock.upsert({
                        where: { warehouseId_productId_batchNumber: { warehouseId: sourceWarehouseId, productId: item.productId, batchNumber: 'GENERAL' } },
                        update: { quantity: { increment: qty } },
                        create: { warehouseId: sourceWarehouseId, productId: item.productId, quantity: qty, batchNumber: 'GENERAL' }
                    });
                    // Update product stock (must verify tenant ownership)
                    await tx.product.updateMany({
                        where: { id: item.productId, tenantId },
                        data: { stockQuantity: { increment: qty } }
                    });
                }
                else if (type === 'TRANSFER') {
                    // Deduct from Source
                    await tx.stock.update({
                        where: { warehouseId_productId_batchNumber: { warehouseId: sourceWarehouseId, productId: item.productId, batchNumber: 'GENERAL' } },
                        data: { quantity: { decrement: qty } }
                    });
                    // Add to Target
                    await tx.stock.upsert({
                        where: { warehouseId_productId_batchNumber: { warehouseId: targetWarehouseId!, productId: item.productId, batchNumber: 'GENERAL' } },
                        update: { quantity: { increment: qty } },
                        create: { warehouseId: targetWarehouseId!, productId: item.productId, quantity: qty, batchNumber: 'GENERAL' }
                    });
                }
                else if (type === 'ADJUSTMENT' || type === 'WRITE_OFF') {
                    const multiplier = type === 'WRITE_OFF' ? -1 : 1;
                    await tx.stock.update({
                        where: { warehouseId_productId_batchNumber: { warehouseId: sourceWarehouseId, productId: item.productId, batchNumber: 'GENERAL' } },
                        data: { quantity: { increment: qty * multiplier } }
                    });
                    await tx.product.updateMany({
                        where: { id: item.productId, tenantId },
                        data: { stockQuantity: { increment: qty * multiplier } }
                    });
                }
            }

            return doc;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to process inventory document' });
    }
};

export const getKyotoWarehouses = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const warehouses = await prisma.warehouse.findMany({
            where: { tenantId },
            include: { stocks: { include: { product: true } } }
        });
        res.json(warehouses);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
