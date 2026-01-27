import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getLedger = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const ledger = await prisma.ledger.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(ledger);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};

export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const [receivables, payables] = await Promise.all([
            prisma.payment.aggregate({
                where: { type: 'RECEIVABLE', tenantId },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { type: 'PAYABLE', tenantId },
                _sum: { amount: true }
            })
        ]);

        const receivablesTotal = receivables?._sum?.amount || 0;
        const payablesTotal = payables?._sum?.amount || 0;

        res.json({
            receivables: receivablesTotal,
            payables: payablesTotal,
            netBalance: receivablesTotal - payablesTotal
        });
    } catch (error) {
        res.status(500).json({ error: 'Financial data fetch failed' });
    }
};

export const createPaymentEntry = async (req: AuthRequest, res: Response) => {
    const { amount, method, type, transactionId, saleId, orderId } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const payment = await prisma.payment.create({
            data: {
                amount: Number(amount),
                method,
                type,
                transactionId,
                saleId,
                tenantId
            }
        });

        // Post to Ledger
        await prisma.ledger.create({
            data: {
                title: `${type} Entry - ${method}`,
                type: type === 'RECEIVABLE' ? 'CREDIT' : 'DEBIT',
                amount: Number(amount),
                category: type,
                description: `TxID: ${transactionId || 'N/A'}`,
                tenantId
            }
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error("Payment Entry Error:", error);
        res.status(400).json({ error: 'Payment recording failed' });
    }
};
