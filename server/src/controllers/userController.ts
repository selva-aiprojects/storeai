import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, firstName, lastName, role: role || 'STAFF' },
            select: { id: true, email: true, firstName: true, lastName: true, role: true }
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: 'User creation failed' });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, role, isActive, password } = req.body;

        const updateData: any = { email, firstName, lastName, role, isActive };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true }
        });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: 'Delete failed' });
    }
};
