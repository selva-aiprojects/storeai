import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDaybook = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const { startDate, endDate } = req.query;

        const daybook = await prisma.daybook.findMany({
            where: {
                tenantId,
                date: {
                    gte: startDate ? new Date(startDate as string) : undefined,
                    lte: endDate ? new Date(endDate as string) : undefined
                }
            },
            orderBy: { date: 'desc' }
        });
        res.json(daybook);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch daybook' });
    }
};

export const createSalesReturn = async (req: AuthRequest, res: Response) => {
    const { saleId, items, condition, transportDeduction, packagingDeduction, gstDeduction, notes } = req.body;
    const tenantId = req.user?.tenantId;

    if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get original sale
            const sale = await tx.sale.findUnique({
                where: { id: saleId },
                include: { items: true }
            });

            if (!sale) throw new Error('Sale not found');

            // 2. Calculate total refund
            let totalRefund = 0;
            for (const item of items) {
                const saleItem = sale.items.find(si => si.productId === item.productId);
                if (!saleItem) throw new Error(`Product ${item.productId} not found in original sale`);

                const refundForItem = item.quantity * saleItem.unitPrice;
                totalRefund += refundForItem;

                // 3. Update Stock
                await tx.stock.updateMany({
                    where: { productId: item.productId },
                    data: { quantity: { increment: item.quantity } }
                });
            }

            // Deductions
            const netRefund = totalRefund - (transportDeduction || 0) - (packagingDeduction || 0) - (gstDeduction || 0);

            // 4. Create Sales Return record
            const salesReturn = await tx.salesReturn.create({
                data: {
                    saleId,
                    totalRefund: netRefund,
                    condition,
                    transportDeduction: Number(transportDeduction) || 0,
                    packagingDeduction: Number(packagingDeduction) || 0,
                    gstDeduction: Number(gstDeduction) || 0,
                    notes,
                    tenantId,
                    items: {
                        create: items.map((it: any) => ({
                            productId: it.productId,
                            quantity: it.quantity,
                            refundAmount: it.quantity * (sale.items.find(si => si.productId === it.productId)?.unitPrice || 0)
                        }))
                    }
                }
            });

            // 5. Post to Daybook
            await tx.daybook.create({
                data: {
                    type: 'EXPENSE', // Refund is an expense/outflow
                    description: `Sales Return for Invoice ${sale.invoiceNo}`,
                    credit: netRefund, // Money going out
                    referenceId: salesReturn.id,
                    tenantId
                }
            });

            return salesReturn;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Sales Return Error:", error);
        res.status(400).json({ error: error.message || 'Sales return failed' });
    }
};

export const getLiabilityAging = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const unpaidSales = await prisma.sale.findMany({
            where: {
                tenantId,
                isPaid: false,
                isDeleted: false
            },
            select: {
                id: true,
                invoiceNo: true,
                totalAmount: true,
                createdAt: true,
                dueDate: true
            }
        });

        const now = new Date();
        const aging = {
            current: 0,
            '1-10 days': 0,
            '11-30 days': 0,
            '31-50 days': 0,
            'overdue': 0
        };

        unpaidSales.forEach(sale => {
            const diffTime = Math.abs(now.getTime() - new Date(sale.createdAt).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) aging.current += sale.totalAmount;
            else if (diffDays <= 10) aging['1-10 days'] += sale.totalAmount;
            else if (diffDays <= 30) aging['11-30 days'] += sale.totalAmount;
            else if (diffDays <= 50) aging['31-50 days'] += sale.totalAmount;
            else aging.overdue += sale.totalAmount;
        });

        res.json(aging);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch aging analysis' });
    }
};

export const getProfitAndLoss = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const [income, expenses] = await Promise.all([
            prisma.daybook.aggregate({
                where: { tenantId, type: 'INCOME' },
                _sum: { debit: true }
            }),
            prisma.daybook.aggregate({
                where: { tenantId, type: 'EXPENSE' },
                _sum: { credit: true }
            })
        ]);

        const totalIncome = income._sum.debit || 0;
        const totalExpenses = expenses._sum.credit || 0;

        res.json({
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            margin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
        });
    } catch (error) {
        res.status(500).json({ error: 'P&L calculation failed' });
    }
};

export const processRecurringExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const activeExpenses = await prisma.recurringExpense.findMany({
            where: { tenantId, isActive: true }
        });

        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

        let postedCount = 0;
        for (const expense of activeExpenses) {
            // Check if already posted for this month
            const alreadyPosted = await prisma.daybook.findFirst({
                where: {
                    tenantId,
                    description: { contains: `${expense.name} - ${currentMonth}` }
                }
            });

            if (!alreadyPosted) {
                await prisma.daybook.create({
                    data: {
                        type: 'EXPENSE',
                        description: `${expense.name} - ${currentMonth}`,
                        credit: expense.baseAmount,
                        tenantId,
                        status: 'PENDING_APPROVAL'
                    }
                });
                postedCount++;
            }
        }

        res.json({ message: `Processed recurring expenses. ${postedCount} new entries created.`, postedCount });
    } catch (error) {
        res.status(500).json({ error: 'Recurring expense processing failed' });
    }
};

