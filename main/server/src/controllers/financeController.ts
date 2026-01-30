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

        const saleItems = await prisma.saleItem.findMany({
            where: { sale: { tenantId, isDeleted: false } },
            include: { product: true }
        });
        const cogs = saleItems.reduce((acc, item) => acc + (item.quantity * item.product.costPrice), 0);

        const netProfit = totalIncome - totalExpenses - cogs;

        res.json({
            totalIncome,
            totalExpenses,
            cogs,
            netProfit,
            margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
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
                        credit: expense.amount,
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

export const getBalanceSheet = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // 1. ASSETS
        // Cash/Bank: Only Capital, Paid Sales, minus Paid Purchases/Expenses
        const daybookBalance = await prisma.daybook.aggregate({
            where: { tenantId },
            _sum: { debit: true, credit: true }
        });
        const cashBalance = (daybookBalance._sum.debit || 0) - (daybookBalance._sum.credit || 0);

        // Inventory Value
        const stocks = await prisma.stock.findMany({
            include: { product: true }
        });
        const inventoryValue = stocks
            .filter(s => (s as any).product.tenantId === tenantId)
            .reduce((acc, s) => acc + (s.quantity * (s as any).product.costPrice), 0);

        // Accounts Receivable (Unpaid Sales)
        const ar = await prisma.sale.aggregate({
            where: { tenantId, isPaid: false, isDeleted: false },
            _sum: { totalAmount: true }
        });

        // GST Input (Asset)
        const gstInput = await prisma.gSTLog.aggregate({
            where: { tenantId, type: 'INPUT' },
            _sum: { amount: true }
        });

        // 2. LIABILITIES
        // Accounts Payable (Pending Orders)
        const ap = await prisma.order.aggregate({
            where: { tenantId, status: { not: 'CANCELLED' } },
            _sum: { totalAmount: true }
        });

        // GST Output (Liability)
        const gstOutput = await prisma.gSTLog.aggregate({
            where: { tenantId, type: 'OUTPUT' },
            _sum: { amount: true }
        });

        // 3. EQUITY & PROFIT
        const equity = await prisma.daybook.aggregate({
            where: { tenantId, type: 'CAPITAL' },
            _sum: { debit: true }
        });

        // Calculate Retained Earnings (Income - Expense - COGS)
        const pnl = await prisma.daybook.aggregate({
            where: {
                tenantId,
                type: { in: ['INCOME', 'EXPENSE', 'SALE', 'RETURN'] }
            },
            _sum: { debit: true, credit: true }
        });
        // Calculate COGS for Retained Earnings
        const saleItems = await prisma.saleItem.findMany({
            where: { sale: { tenantId, isDeleted: false } }, // Include all sales (Accrual Basis)
            include: { product: true }
        });
        const cogs = saleItems.reduce((acc, item) => acc + (item.quantity * item.product.costPrice), 0);

        const retainedEarnings = (pnl._sum.debit || 0) - (pnl._sum.credit || 0) - cogs;

        const totalAssets = cashBalance + inventoryValue + (ar._sum.totalAmount || 0) + (gstInput._sum.amount || 0);
        const totalLiabilities = (ap._sum.totalAmount || 0) + (gstOutput._sum.amount || 0);
        const totalEquity = (equity._sum.debit || 0) + retainedEarnings;

        res.json({
            assets: {
                cash: cashBalance,
                inventory: inventoryValue,
                receivables: ar._sum.totalAmount || 0,
                gstInput: gstInput._sum.amount || 0,
                total: totalAssets
            },
            liabilities: {
                payables: ap._sum.totalAmount || 0,
                gstOutput: gstOutput._sum.amount || 0,
                total: totalLiabilities
            },
            equity: {
                capital: equity._sum.debit || 0,
                retainedEarnings: retainedEarnings,
                total: totalEquity
            },
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
        });
    } catch (error) {
        console.error("Balance Sheet Error:", error);
        res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
};
