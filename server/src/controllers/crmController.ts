import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDeals = async (req: Request, res: Response) => {
    try {
        const deals = await prisma.deal.findMany({
            include: { customer: true, assignedTo: true, items: { include: { product: true } } }
        });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const updateDealStage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;

        let probability = 10;
        if (stage === 'QUALIFIED') probability = 40;
        if (stage === 'NEGOTIATION') probability = 70;
        if (stage === 'WON') probability = 100;
        if (stage === 'LOST') probability = 0;

        const deal = await prisma.deal.update({
            where: { id },
            data: { stage, probability }
        });
        res.json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Failed' });
    }
};

export const addActivity = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // dealId
        const { type, content, subject } = req.body;

        const activity = await prisma.activity.create({
            data: {
                dealId: id,
                type,
                subject,
                content
            }
        });
        res.json(activity);
    } catch (error) {
        res.status(400).json({ error: 'Failed' });
    }
};

export const createDeal = async (req: Request, res: Response) => {
    try {
        const { title, value, customerId, assignedToId, items } = req.body;
        const deal = await prisma.deal.create({
            data: {
                title,
                value: Number(value),
                customerId,
                assignedToId,
                stage: 'NEW',
                probability: 10,
                // Assuming simple flat creation for now
            }
        });
        res.json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Failed' });
    }
};
