import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getLedger = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const ledger = await prisma.ledger.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        if (ledger.length === 0) {
            // Fallback to Daybook for seeded expert data
            const daybook = await prisma.daybook.findMany({
                where: { tenantId },
                orderBy: { date: 'desc' }
            });
            // Map Daybook to Ledger format for UI compatibility
            const mapped = daybook.map(d => ({
                id: d.id,
                title: d.description,
                description: d.type,
                amount: Math.max(Number(d.debit), Number(d.credit)),
                type: Number(d.debit) > 0 ? 'DEBIT' : 'CREDIT',
                category: d.type,
                createdAt: d.date
            }));
            return res.json(mapped);
        }

        res.json(ledger);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};

export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

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

export const getTaxSummary = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // GST Output (Sales Tax - collected from customers)
        const salesTax = await prisma.sale.aggregate({
            where: { tenantId, isDeleted: false },
            _sum: { taxAmount: true }
        });

        // GST Input (Purchase Tax - paid to suppliers)
        const purchaseTax = await prisma.order.aggregate({
            where: { tenantId, status: { not: 'CANCELLED' } },
            _sum: { taxAmount: true }
        });

        const gstOutput = salesTax._sum.taxAmount || 0;
        const gstInput = purchaseTax._sum.taxAmount || 0;

        res.json({
            gstOutput,
            gstInput,
            netPayable: gstOutput - gstInput,
            status: (gstOutput - gstInput) > 0 ? 'PAYABLE' : 'CREDIT_CARRYOVER'
        });
    } catch (error) {
        res.status(500).json({ error: 'Tax summary fetch failed' });
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
export const getEntityLedger = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { entityId } = req.params;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const [daybook, ledger] = await Promise.all([
            prisma.daybook.findMany({
                where: {
                    tenantId,
                    OR: [
                        { referenceId: entityId },
                        { description: { contains: entityId, mode: 'insensitive' } }
                    ]
                },
                orderBy: { date: 'desc' }
            }),
            prisma.ledger.findMany({
                where: {
                    tenantId,
                    OR: [
                        { title: { contains: entityId, mode: 'insensitive' } },
                        { description: { contains: entityId, mode: 'insensitive' } }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const combined = [
            ...daybook.map(d => ({ ...d, source: 'DAYBOOK' })),
            ...ledger.map(l => ({ ...l, date: l.createdAt, source: 'LEDGER' }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json(combined);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch entity ledger' });
    }
};
