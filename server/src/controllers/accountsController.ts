import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getLedger = async (req: Request, res: Response) => {
    try {
        const ledger = await prisma.ledger.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(ledger);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};

export const getFinancialSummary = async (req: Request, res: Response) => {
    try {
        const [receivables, payables] = await Promise.all([
            prisma.payment.aggregate({
                where: { type: 'RECEIVABLE' },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { type: 'PAYABLE' },
                _sum: { amount: true }
            })
        ]);

        res.json({
            receivables: receivables._sum.amount || 0,
            payables: payables._sum.amount || 0,
            netBalance: (receivables._sum.amount || 0) - (payables._sum.amount || 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Financial data fetch failed' });
    }
};

export const createPaymentEntry = async (req: Request, res: Response) => {
    const { amount, method, type, transactionId, saleId, orderId } = req.body;
    try {
        const payment = await prisma.payment.create({
            data: {
                amount: Number(amount),
                method,
                type,
                transactionId,
                saleId
            }
        });

        // Post to Ledger
        await prisma.ledger.create({
            data: {
                title: `${type} Entry - ${method}`,
                type: type === 'RECEIVABLE' ? 'CREDIT' : 'DEBIT',
                amount: Number(amount),
                category: type,
                description: `TxID: ${transactionId || 'N/A'}`
            }
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error("Payment Entry Error:", error);
        res.status(400).json({ error: 'Payment recording failed' });
    }
};
