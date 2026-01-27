import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: { isDeleted: false },
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

export const createProduct = async (req: Request, res: Response) => {
    try {
        const {
            sku, name, description, price, costPrice, stockQuantity,
            categoryId, unit, lowStockThreshold, leadTimeDays, avgDailySales
        } = req.body;

        const product = await prisma.product.create({
            data: {
                sku, name, description, price, costPrice,
                stockQuantity: Number(stockQuantity || 0),
                categoryId, unit,
                lowStockThreshold: Number(lowStockThreshold),
                leadTimeDays: Number(leadTimeDays),
                avgDailySales: Number(avgDailySales)
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(400).json({ error: 'Failed to create product' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const product = await prisma.product.update({
            where: { id },
            data
        });
        res.json(product);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update product' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.product.update({
            where: { id },
            data: { isDeleted: true }
        });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Failed to delete product' });
    }
};

export const createPricingRule = async (req: Request, res: Response) => {
    try {
        const { productId, name, minQuantity, discountPercent } = req.body;
        const rule = await prisma.pricingRule.create({
            data: {
                productId,
                name,
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

export const getPricingRules = async (req: Request, res: Response) => {
    try {
        const rules = await prisma.pricingRule.findMany({
            where: { isActive: true },
            include: { product: true }
        });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};
