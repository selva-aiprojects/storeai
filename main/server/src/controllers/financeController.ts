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

        // Fetch all Income and Expense accounts with their ledger entries
        const accounts = await prisma.chartOfAccounts.findMany({
            where: {
                tenantId,
                accountGroup: { in: ['INCOME', 'EXPENSES'] }
            },
            include: {
                ledgerEntries: {
                    select: { debitAmount: true, creditAmount: true }
                }
            }
        });

        let totalIncome = 0;
        let totalExpenses = 0;
        let cogs = 0;

        accounts.forEach(acc => {
            const debits = acc.ledgerEntries.reduce((sum, e) => sum + e.debitAmount, 0);
            const credits = acc.ledgerEntries.reduce((sum, e) => sum + e.creditAmount, 0);

            if (acc.accountGroup === 'INCOME') {
                totalIncome += (credits - debits);
            } else if (acc.accountGroup === 'EXPENSES') {
                const balance = debits - credits;
                if (acc.accountType === 'COGS') {
                    cogs += balance;
                }
                totalExpenses += balance;
            }
        });

        // Fallback for COGS if ledger is empty (for legacy data)
        if (cogs === 0) {
            const saleItems = await prisma.saleItem.findMany({
                where: { sale: { tenantId, isDeleted: false } },
                include: { product: true }
            });
            cogs = saleItems.reduce((acc, item) => acc + (item.quantity * item.product.costPrice), 0);
            if (totalExpenses === 0) totalExpenses = cogs; // If no other expenses, total is just COGS
            else if (!accounts.some(a => a.accountType === 'COGS')) totalExpenses += cogs;
        }

        const netProfit = totalIncome - totalExpenses;

        res.json({
            totalIncome,
            totalExpenses,
            cogs,
            netProfit,
            margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
        });
    } catch (error) {
        console.error("P&L Error:", error);
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

        // Fetch all balance sheet accounts (Assets, Liabilities, Equity)
        const accounts = await prisma.chartOfAccounts.findMany({
            where: {
                tenantId,
                accountGroup: { in: ['ASSETS', 'LIABILITIES', 'EQUITY'] }
            },
            include: {
                ledgerEntries: {
                    select: { debitAmount: true, creditAmount: true }
                }
            }
        });

        const assets = { cash: 0, inventory: 0, receivables: 0, gstInput: 0, other: 0, total: 0 };
        const liabilities = { payables: 0, gstPayable: 0, other: 0, total: 0 };
        const equity = { capital: 0, retainedEarnings: 0, total: 0 };

        accounts.forEach(acc => {
            const debits = acc.ledgerEntries.reduce((sum, e) => sum + e.debitAmount, 0);
            const credits = acc.ledgerEntries.reduce((sum, e) => sum + e.creditAmount, 0);

            if (acc.accountGroup === 'ASSETS') {
                const balance = debits - credits;
                if (acc.accountType === 'CASH' || acc.accountType === 'BANK') assets.cash += balance;
                else if (acc.accountType === 'INVENTORY') assets.inventory += balance;
                else if (acc.accountType === 'AR') assets.receivables += balance;
                else if (acc.accountType === 'GST_INPUT') assets.gstInput += balance;
                else assets.other += balance;
                assets.total += balance;
            } else if (acc.accountGroup === 'LIABILITIES') {
                const balance = credits - debits;
                if (acc.accountType === 'AP') liabilities.payables += balance;
                else if (acc.accountType === 'GST_OUTPUT') liabilities.gstPayable += balance;
                else liabilities.other += balance;
                liabilities.total += balance;
            } else if (acc.accountGroup === 'EQUITY') {
                const balance = credits - debits;
                if (acc.accountType === 'CAPITAL') equity.capital += balance;
                else if (acc.accountType === 'RETAINED_EARNINGS') equity.retainedEarnings += balance;
                equity.total += balance;
            }
        });

        // 1. Calculate Current Year Profit (from PL Logic)
        const plRes = await prisma.chartOfAccounts.findMany({
            where: { tenantId, accountGroup: { in: ['INCOME', 'EXPENSES'] } },
            include: { ledgerEntries: { select: { debitAmount: true, creditAmount: true } } }
        });

        let currentYearProfit = 0;
        plRes.forEach(acc => {
            const debits = acc.ledgerEntries.reduce((sum, e) => sum + e.debitAmount, 0);
            const credits = acc.ledgerEntries.reduce((sum, e) => sum + e.creditAmount, 0);
            if (acc.accountGroup === 'INCOME') currentYearProfit += (credits - debits);
            else currentYearProfit -= (debits - credits);
        });

        // Integration Profit into Retained Earnings for Balance Sheet purposes
        equity.retainedEarnings += currentYearProfit;
        equity.total += currentYearProfit;

        // Fallbacks for Legacy Systems (if ledger is empty)
        if (assets.total === 0) {
            // Cash Fallback
            const daybookBalance = await prisma.daybook.aggregate({
                where: { tenantId },
                _sum: { debit: true, credit: true }
            });
            assets.cash = (daybookBalance._sum.debit || 0) - (daybookBalance._sum.credit || 0);

            // Inventory Fallback
            const stocks = await prisma.stock.findMany({
                include: { product: true }
            });
            assets.inventory = stocks
                .filter(s => (s as any).product.tenantId === tenantId)
                .reduce((acc, s) => acc + (s.quantity * (s as any).product.costPrice), 0);

            // AR Fallback
            const ar = await prisma.sale.aggregate({
                where: { tenantId, isPaid: false, isDeleted: false },
                _sum: { totalAmount: true }
            });
            assets.receivables = ar._sum.totalAmount || 0;

            assets.total = assets.cash + assets.inventory + assets.receivables + assets.gstInput;
        }

        res.json({
            assets,
            liabilities,
            equity,
            isBalanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 1
        });
    } catch (error) {
        console.error("Balance Sheet Error:", error);
        res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
};
