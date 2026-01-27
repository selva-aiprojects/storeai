import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDeals = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const deals = await prisma.deal.findMany({
            where: { tenantId },
            include: { customer: true, assignedTo: true, items: { include: { product: true } } }
        });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const updateDealStage = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const tenantId = req.user?.tenantId;

        let probability = 10;
        if (stage === 'QUALIFIED') probability = 40;
        if (stage === 'NEGOTIATION') probability = 70;
        if (stage === 'WON') probability = 100;
        if (stage === 'LOST') probability = 0;

        const deal = await prisma.deal.updateMany({
            where: { id, tenantId },
            data: { stage, probability }
        });
        res.json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Failed' });
    }
};

export const addActivity = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // dealId
        const { type, content, subject } = req.body;
        const tenantId = req.user?.tenantId;

        // Verify deal belongs to tenant
        const deal = await prisma.deal.findFirst({ where: { id, tenantId } });
        if (!deal) return res.status(403).json({ error: 'Deal access denied' });

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

export const createDeal = async (req: AuthRequest, res: Response) => {
    try {
        const { title, value, customerId, assignedToId, items } = req.body;
        const tenantId = req.user?.tenantId;

        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const deal = await prisma.deal.create({
            data: {
                title,
                value: Number(value),
                customerId,
                assignedToId,
                tenantId,
                stage: 'NEW',
                probability: 10,
            }
        });
        res.json(deal);
    } catch (error) {
        res.status(400).json({ error: 'Failed' });
    }
};
