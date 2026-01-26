import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    const { name, email, phone, address, city, zipCode } = req.body;
    try {
        const customer = await prisma.customer.create({
            data: { name, email, phone, address, city, zipCode }
        });
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create customer' });
    }
};

export const updateCustomer = async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const customer = await prisma.customer.update({
            where: { id },
            data
        });
        res.json(customer);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};
