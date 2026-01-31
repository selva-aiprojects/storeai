import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Report Service
 * Generates financial reports: Trial Balance, P&L, Balance Sheet, GST Reports
 */

export const ReportService = {

    /**
     * Generate Trial Balance
     * All accounts with their debit/credit totals for a period
     */
    async generateTrialBalance(tenantId: string, startDate?: Date, endDate?: Date) {
        try {
            // Default to current financial year if no dates provided
            const start = startDate || new Date(new Date().getFullYear(), 3, 1); // April 1st
            const end = endDate || new Date();

            // Get all accounts
            const accounts = await prisma.chartOfAccounts.findMany({
                where: {
                    tenantId,
                    isActive: true
                },
                include: {
                    ledgerEntries: {
                        where: {
                            entryDate: {
                                gte: start,
                                lte: end
                            }
                        }
                    }
                },
                orderBy: { code: 'asc' }
            });

            let totalDebit = 0;
            let totalCredit = 0;

            const trialBalanceData = accounts.map(account => {
                const debitSum = account.ledgerEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
                const creditSum = account.ledgerEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);

                // Calculate closing balance based on account type
                let closingBalance = account.openingBalance + debitSum - creditSum;

                // For liability/income accounts, credit increases balance
                if (['LIABILITIES', 'INCOME', 'EQUITY'].includes(account.accountGroup)) {
                    closingBalance = account.openingBalance + creditSum - debitSum;
                }

                totalDebit += debitSum;
                totalCredit += creditSum;

                return {
                    code: account.code,
                    name: account.name,
                    accountGroup: account.accountGroup,
                    openingBalance: account.openingBalance,
                    debit: debitSum,
                    credit: creditSum,
                    closingBalance: Math.abs(closingBalance),
                    balanceType: closingBalance >= 0 ? 'Dr' : 'Cr'
                };
            });

            const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // Allow for rounding

            return {
                periodStart: start,
                periodEnd: end,
                accounts: trialBalanceData,
                totals: {
                    totalDebit,
                    totalCredit,
                    difference: totalDebit - totalCredit,
                    isBalanced
                },
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('Error generating Trial Balance:', error);
            throw error;
        }
    },

    /**
     * Generate Profit & Loss Statement
     */
    async generateProfitAndLoss(tenantId: string, startDate?: Date, endDate?: Date) {
        try {
            const start = startDate || new Date(new Date().getFullYear(), 3, 1);
            const end = endDate || new Date();

            // Get all income and expense accounts
            const accounts = await prisma.chartOfAccounts.findMany({
                where: {
                    tenantId,
                    isActive: true,
                    accountGroup: { in: ['INCOME', 'EXPENSES'] }
                },
                include: {
                    ledgerEntries: {
                        where: {
                            entryDate: {
                                gte: start,
                                lte: end
                            }
                        }
                    }
                },
                orderBy: { code: 'asc' }
            });

            const income: any[] = [];
            const expenses: any[] = [];
            let totalIncome = 0;
            let totalExpenses = 0;
            let cogs = 0;

            for (const account of accounts) {
                const debitSum = account.ledgerEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
                const creditSum = account.ledgerEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);

                if (account.accountGroup === 'INCOME') {
                    const amount = creditSum - debitSum; // Income increases with credit
                    totalIncome += amount;
                    income.push({
                        code: account.code,
                        name: account.name,
                        amount
                    });
                } else if (account.accountGroup === 'EXPENSES') {
                    const amount = debitSum - creditSum; // Expenses increase with debit
                    totalExpenses += amount;

                    if (account.accountType === 'COGS') {
                        cogs += amount;
                    }

                    expenses.push({
                        code: account.code,
                        name: account.name,
                        amount
                    });
                }
            }

            const grossProfit = totalIncome - cogs;
            const operatingExpenses = totalExpenses - cogs;
            const netProfit = totalIncome - totalExpenses;

            return {
                periodStart: start,
                periodEnd: end,
                revenue: {
                    items: income,
                    total: totalIncome
                },
                costOfGoodsSold: cogs,
                grossProfit,
                operatingExpenses: {
                    items: expenses.filter(e => e.amount !== cogs),
                    total: operatingExpenses
                },
                netProfit,
                profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('Error generating P&L:', error);
            throw error;
        }
    },

    /**
     * Generate Balance Sheet
     */
    async generateBalanceSheet(tenantId: string, asOfDate?: Date) {
        try {
            const asOf = asOfDate || new Date();

            // Get all assets, liabilities, and equity accounts
            const accounts = await prisma.chartOfAccounts.findMany({
                where: {
                    tenantId,
                    isActive: true,
                    accountGroup: { in: ['ASSETS', 'LIABILITIES', 'EQUITY'] }
                },
                include: {
                    ledgerEntries: {
                        where: {
                            entryDate: {
                                lte: asOf
                            }
                        }
                    }
                },
                orderBy: { code: 'asc' }
            });

            const assets: any[] = [];
            const liabilities: any[] = [];
            const equity: any[] = [];
            let totalAssets = 0;
            let totalLiabilities = 0;
            let totalEquity = 0;

            for (const account of accounts) {
                const debitSum = account.ledgerEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
                const creditSum = account.ledgerEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);

                let balance = 0;

                if (account.accountGroup === 'ASSETS') {
                    balance = account.openingBalance + debitSum - creditSum;
                    totalAssets += balance;
                    assets.push({
                        code: account.code,
                        name: account.name,
                        type: account.accountType,
                        balance
                    });
                } else if (account.accountGroup === 'LIABILITIES') {
                    balance = account.openingBalance + creditSum - debitSum;
                    totalLiabilities += balance;
                    liabilities.push({
                        code: account.code,
                        name: account.name,
                        type: account.accountType,
                        balance
                    });
                } else if (account.accountGroup === 'EQUITY') {
                    balance = account.openingBalance + creditSum - debitSum;
                    totalEquity += balance;
                    equity.push({
                        code: account.code,
                        name: account.name,
                        type: account.accountType,
                        balance
                    });
                }
            }

            // Calculate current year P/L if not yet closed
            const yearStart = new Date(asOf.getFullYear(), 3, 1);
            const plData = await this.generateProfitAndLoss(tenantId, yearStart, asOf);

            // Add current year P/L to equity
            totalEquity += plData.netProfit;

            const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

            return {
                asOfDate: asOf,
                assets: {
                    items: assets,
                    total: totalAssets
                },
                liabilities: {
                    items: liabilities,
                    total: totalLiabilities
                },
                equity: {
                    items: equity,
                    currentYearPL: plData.netProfit,
                    total: totalEquity
                },
                totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
                isBalanced,
                difference: totalAssets - (totalLiabilities + totalEquity),
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('Error generating Balance Sheet:', error);
            throw error;
        }
    },

    /**
     * Get Daybook Report
     */
    async getDaybookReport(tenantId: string, startDate?: Date, endDate?: Date) {
        const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate || new Date();

        const entries = await prisma.daybook.findMany({
            where: {
                tenantId,
                date: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: { date: 'desc' }
        });

        const summary = entries.reduce((acc: any, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
        }, {});

        return {
            periodStart: start,
            periodEnd: end,
            entries,
            summary,
            totalEntries: entries.length,
            generatedAt: new Date()
        };
    },

    /**
     * Get GST Report (GSTR-1 & GSTR-2 Summary)
     */
    async getGSTReport(tenantId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // GSTR-1: Output GST (Sales)
        const sales = await prisma.sale.findMany({
            where: {
                tenantId,
                isDeleted: false,
                createdAt: {
                    gte: startDate,
                    lte: end Date
                }
            },
            include: {
                customer: {
                    select: { name: true, gstNumber: true }
                }
            }
        });

        let totalSalesValue = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        const salesBreakdown = sales.map(sale => {
            totalSalesValue += (sale.totalAmount - sale.taxAmount);
            totalCGST += sale.cgstAmount;
            totalSGST += sale.sgstAmount;
            totalIGST += sale.igstAmount;

            return {
                invoiceNo: sale.invoiceNo,
                date: sale.createdAt,
                customer: sale.customer?.name || 'Walk-in',
                gstNumber: sale.customer?.gstNumber,
                taxableValue: sale.totalAmount - sale.taxAmount,
                cgst: sale.cgstAmount,
                sgst: sale.sgstAmount,
                igst: sale.igstAmount,
                totalTax: sale.taxAmount
            };
        });

        // GSTR-2: Input GST (Purchases)
        const orders = await prisma.order.findMany({
            where: {
                tenantId,
                isDeleted: false,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                supplier: {
                    select: { name: true, gstNumber: true }
                }
            }
        });

        let totalPurchaseValue = 0;
        let totalInputGST = 0;

        const purchaseBreakdown = orders.map(order => {
            const taxableValue = order.totalAmount - order.taxAmount;
            totalPurchaseValue += taxableValue;
            totalInputGST += order.taxAmount;

            return {
                orderNumber: order.orderNumber,
                date: order.createdAt,
                supplier: order.supplier.name,
                gstNumber: order.supplier.gstNumber,
                taxableValue,
                gstAmount: order.taxAmount
            };
        });

        const totalOutputGST = totalCGST + totalSGST + totalIGST;
        const netGSTPayable = totalOutputGST - totalInputGST;

        return {
            period: {
                month,
                year,
                startDate,
                endDate
            },
            gstr1: {
                // Output GST
                totalSalesValue,
                cgst: totalCGST,
                sgst: totalSGST,
                igst: totalIGST,
                totalOutputGST,
                sales: salesBreakdown
            },
            gstr2: {
                // Input GST
                totalPurchaseValue,
                totalInputGST,
                purchases: purchaseBreakdown
            },
            gstr3b: {
                // Summary
                outputGST: totalOutputGST,
                inputGST: totalInputGST,
                netGSTPayable,
                status: netGSTPayable > 0 ? 'PAYABLE' : 'CREDIT_CARRYOVER'
            },
            generatedAt: new Date()
        };
    }
};
