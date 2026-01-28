import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const products = await prisma.product.findMany({
            where: { isDeleted: false, tenantId },
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        });
        // Attach intelligent reorder recommendation
        const enriched = products.map(p => ({
            ...p,
            reorderPoint: (p.avgDailySales * p.leadTimeDays) + (p.lowStockThreshold || 0),
            daysRemaining: p.avgDailySales > 0 ? (p.stockQuantity / p.avgDailySales).toFixed(1) : '∞'
        }));
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.id;
        const {
            sku, name, description, price, costPrice, stockQuantity,
            categoryId, unit, lowStockThreshold, leadTimeDays, avgDailySales,
            transportationCost, gstRate, otherTaxRate
        } = req.body;

        // 1. Check Plan Limits (Revenue Protection)
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true }
        });
        const currentCount = await prisma.product.count({ where: { tenantId, isDeleted: false } });
        const limit = tenant?.plan?.maxProducts || 100; // Default limit if no plan

        if (currentCount >= limit) {
            return res.status(403).json({
                error: `Plan Limit Exceeded: Your plan allows ${limit} products. Upgrade to Enterprise for unlimited.`
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 2. Create Product
            const product = await tx.product.create({
                data: {
                    sku, name, description,
                    price: Number(price),
                    costPrice: Number(costPrice),
                    stockQuantity: Number(stockQuantity || 0),
                    categoryId, unit,
                    tenantId: tenantId!,
                    lowStockThreshold: Number(lowStockThreshold || 10),
                    leadTimeDays: Number(leadTimeDays || 7),
                    avgDailySales: Number(avgDailySales || 0),
                    transportationCost: Number(transportationCost || 0),
                    gstRate: Number(gstRate || 0),
                    otherTaxRate: Number(otherTaxRate || 0)
                }
            });

            // 3. Normalize Stock: Add to Default Warehouse
            const warehouse = await tx.warehouse.findFirst({
                where: { tenantId, isDefault: true }
            });

            if (warehouse) {
                await tx.stock.create({
                    data: {
                        productId: product.id,
                        warehouseId: warehouse.id,
                        quantity: Number(stockQuantity || 0),
                        batchNumber: 'GENERAL'
                    }
                });
            }

            // 4. Audit Log (Compliance)
            await tx.activityLog.create({
                data: {
                    action: 'CREATE',
                    entityType: 'PRODUCT',
                    entityId: product.id,
                    tenantId: tenantId!,
                    userId: userId!,
                    details: { name: product.name, sku: product.sku, price: product.price },
                    ipAddress: req.ip
                }
            });

            return product;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(400).json({ error: (error as Error).message || 'Failed to create product' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        const data = req.body;
        // Ensure the product belongs to the tenant
        const product = await prisma.product.updateMany({
            where: { id, tenantId },
            data
        });
        res.json({ message: 'Product updated', product });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update product' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        await prisma.product.updateMany({
            where: { id, tenantId },
            data: { isDeleted: true }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete product' });
    }
};

export const createPricingRule = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { productId, name, minQuantity, discountPercent } = req.body;
        const rule = await prisma.pricingRule.create({
            data: {
                productId,
                name,
                tenantId: tenantId!,
                minQuantity: Number(minQuantity),
                discountPercent: Number(discountPercent),
                isActive: true
            }
        });
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create pricing rule' });
    }
};

export const getPricingRules = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const rules = await prisma.pricingRule.findMany({
            where: { isActive: true, tenantId },
            include: { product: true }
        });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};
