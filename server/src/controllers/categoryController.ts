import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const categories = await prisma.category.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    const { name, description } = req.body;
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const category = await prisma.category.create({
            data: { name, description, tenantId }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create category' });
    }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const tenantId = req.user?.tenantId;
    try {
        const category = await prisma.category.updateMany({
            where: { id, tenantId },
            data: { name, description }
        });
        res.json(category);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    try {
        await prisma.category.deleteMany({
            where: { id, tenantId }
        });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(400).json({ error: 'Delete failed' });
    }
};
