import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    const { name, contact, email, address } = req.body;
    try {
        const supplier = await prisma.supplier.create({
            data: { name, contact, email, address }
        });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create supplier' });
    }
};

export const updateSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, contact, email, address } = req.body;
    try {
        const supplier = await prisma.supplier.update({
            where: { id },
            data: { name, contact, email, address }
        });
        res.json(supplier);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.supplier.delete({ where: { id } });
        res.json({ message: 'Supplier deleted' });
    } catch (error) {
        res.status(400).json({ error: 'Delete failed' });
    }
};
