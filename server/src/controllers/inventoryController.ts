import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getInventorySummary = async (req: Request, res: Response) => {
    try {
        const stocks = await prisma.stock.findMany({
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

export const createDocument = async (req: Request, res: Response) => {
    try {
        const { type, sourceWarehouseId, targetWarehouseId, items, notes } = req.body;
        // items: [{ productId, quantity }]

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Document
            const doc = await tx.inventoryDocument.create({
                data: {
                    type, // POST_RECEIPT, TRANSFER, ADJUSTMENT
                    status: 'POSTED', // Auto-post for now
                    sourceWarehouseId,
                    targetWarehouseId,
                    notes,
                    items: {
                        create: items.map((i: any) => ({
                            productId: i.productId,
                            quantity: Number(i.quantity)
                        }))
                    },
                    performedBy: 'Admin' // TODO: from auth
                },
                include: { items: true }
            });

            // 2. Process Movements based on Type
            for (const item of items) {
                const qty = Number(item.quantity);

                if (type === 'RECEIPT') {
                    // Add to Source (which is the receiving warehouse in this context)
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: sourceWarehouseId, productId: item.productId } },
                        update: { quantity: { increment: qty } },
                        create: { warehouseId: sourceWarehouseId, productId: item.productId, quantity: qty }
                    });
                    // Update global product stock for reference
                    await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: qty } } });
                }
                else if (type === 'TRANSFER') {
                    // Deduct from Source
                    await tx.stock.update({
                        where: { warehouseId_productId: { warehouseId: sourceWarehouseId, productId: item.productId } },
                        data: { quantity: { decrement: qty } }
                    });
                    // Add to Target
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: targetWarehouseId!, productId: item.productId } },
                        update: { quantity: { increment: qty } },
                        create: { warehouseId: targetWarehouseId!, productId: item.productId, quantity: qty }
                    });
                }
                else if (type === 'ADJUSTMENT' || type === 'WRITE_OFF') {
                    // For write-off, we deduct. For Adjustment, we assume it can be negative or positive but simplified here to deducation if write-off
                    const multiplier = type === 'WRITE_OFF' ? -1 : 1;
                    await tx.stock.update({
                        where: { warehouseId_productId: { warehouseId: sourceWarehouseId, productId: item.productId } },
                        data: { quantity: { increment: qty * multiplier } }
                    });
                    await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: qty * multiplier } } });
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

export const getKyotoWarehouses = async (req: Request, res: Response) => {
    try {
        const warehouses = await prisma.warehouse.findMany({ include: { stocks: { include: { product: true } } } });
        res.json(warehouses);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
