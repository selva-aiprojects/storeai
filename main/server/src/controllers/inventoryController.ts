import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { InventoryService } from '../services/inventory.service';

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

// Store operations: Use the InventoryService for GRN and batch-aware receipts.
export const createDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { type, sourceWarehouseId, targetWarehouseId, items, notes } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const result = await prisma.$transaction(async (tx) => {
            const doc = await tx.inventoryDocument.create({
                data: {
                    type,
                    status: 'POSTED',
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
            return doc;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message || 'Failed' });
    }
};

/**
 * Advanced Inward Entry (GRN)
 * Uses InventoryService to track Batches/Expiry/Ledger
 */
export const processInwardEntry = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const { productId, warehouseId, quantity, costPrice, batchNumber, expiryDate, poId } = req.body;

        const result = await InventoryService.processInwardStock({
            tenantId,
            productId,
            warehouseId,
            quantity: Number(quantity),
            costPrice: Number(costPrice),
            batchNumber,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            poId,
            receivedBy: req.user?.id || 'Unknown'
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process inward entry' });
    }
};

export const getBatchStockSummary = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        // Implementation to get stock grouped by Batch
        const batches = await prisma.productBatch.findMany({
            where: { product: { tenantId }, quantityAvailable: { gt: 0 } },
            include: { product: true }
        });
        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batch stock' });
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
