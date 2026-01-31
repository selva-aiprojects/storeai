import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Accounts Receivable Service
 * Manages customer payments and aging reports
 */

export const ARService = {

    /**
     * Get customer outstanding balance from ledger
     */
    async getCustomerBalance(customerId: string, tenantId: string) {
        try {
            // Find customer's AR account
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                select: { name: true }
            });

            if (!customer) {
                throw new Error('Customer not found');
            }

            // Find AR account for this customer
            const customerAccount = await prisma.chartOfAccounts.findFirst({
                where: {
                    tenantId,
                    accountType: 'ACCOUNTS_RECEIVABLE',
                    name: { contains: customer.name }
                }
            });

            if (!customerAccount) {
                // Fallback: Calculate from sales
                const sales = await prisma.sale.findMany({
                    where: {
                        customerId,
                        tenantId,
                        isDeleted: false
                    }
                });

                const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
                const paidSales = sales.filter(s => s.isPaid).reduce((sum, sale) => sum + sale.totalAmount, 0);

                return {
                    customerId,
                    customerName: customer.name,
                    totalSales,
                    paidAmount: paidSales,
                    outstanding: totalSales - paidSales,
                    method: 'FALLBACK'
                };
            }

            // Calculate from ledger entries
            const entries = await prisma.ledgerEntry.findMany({
                where: {
                    accountId: customerAccount.id,
                    tenantId
                }
            });

            const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
            const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
            const outstanding = totalDebit - totalCredit; // Debit increases AR

            return {
                customerId,
                customerName: customer.name,
                totalDebit,
                totalCredit,
                outstanding,
                method: 'LEDGER'
            };

        } catch (error) {
            console.error('Error fetching customer balance:', error);
            throw error;
        }
    },

    /**
     * AR Aging Report
     * Groups outstanding amounts by age
     */
    async getARAgingReport(tenantId: string) {
        const sales = await prisma.sale.findMany({
            where: {
                tenantId,
                isPaid: false,
                isDeleted: false
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        const now = new Date();
        const aging = {
            current: [] as any[],      // 0-30 days
            days31to60: [] as any[],    // 31-60 days
            days61to90: [] as any[],    // 61-90 days
            over90: [] as any[]         // 90+ days
        };

        for (const sale of sales) {
            const dueDate = sale.dueDate || sale.createdAt;
            const daysPastDue = Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));

            const item = {
                saleId: sale.id,
                invoiceNo: sale.invoiceNo,
                customerId: sale.customer?.id,
                customerName: sale.customer?.name || 'Walk-in',
                amount: sale.totalAmount,
                dueDate,
                daysPastDue
            };

            if (daysPastDue <= 30) {
                aging.current.push(item);
            } else if (daysPastDue <= 60) {
                aging.days31to60.push(item);
            } else if (daysPastDue <= 90) {
                aging.days61to90.push(item);
            } else {
                aging.over90.push(item);
            }
        }

        return {
            current: {
                count: aging.current.length,
                total: aging.current.reduce((sum, item) => sum + item.amount, 0),
                items: aging.current
            },
            days31to60: {
                count: aging.days31to60.length,
                total: aging.days31to60.reduce((sum, item) => sum + item.amount, 0),
                items: aging.days31to60
            },
            days61to90: {
                count: aging.days61to90.length,
                total: aging.days61to90.reduce((sum, item) => sum + item.amount, 0),
                items: aging.days61to90
            },
            over90: {
                count: aging.over90.length,
                total: aging.over90.reduce((sum, item) => sum + item.amount, 0),
                items: aging.over90
            },
            grandTotal: sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
        };
    },

    /**
     * Record customer payment
     */
    async recordCustomerPayment(data: {
        customerId: string;
        saleId?: string;
        amount: number;
        paymentMethod: string; // CASH, BANK, UPI, etc.
        transactionId?: string;
        tenantId: string;
    }) {
        return await prisma.$transaction(async (tx) => {
            // 1. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    amount: data.amount,
                    method: data.paymentMethod,
                    type: 'RECEIVABLE',
                    transactionId: data.transactionId,
                    saleId: data.saleId,
                    tenantId: data.tenantId
                }
            });

            // 2. Update Sale as Paid (if linked)
            if (data.saleId) {
                await tx.sale.update({
                    where: { id: data.saleId },
                    data: { isPaid: true }
                });
            }

            // 3. Create Ledger Entries if COA is set up
            try {
                // Find Cash/Bank Account
                const cashAccount = await tx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: data.paymentMethod === 'CASH' ? 'CASH' : 'BANK'
                    }
                });

                // Find Customer AR Account
                const customer = await tx.customer.findUnique({
                    where: { id: data.customerId },
                    select: { name: true }
                });

                const customerAccount = await tx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'ACCOUNTS_RECEIVABLE',
                        OR: [
                            { code: { contains: data.customerId.substring(0, 8) } },
                            { name: { contains: customer?.name || '' } }
                        ]
                    }
                });

                if (cashAccount && customerAccount) {
                    const voucherNumber = `RCPT-${Date.now()}`;

                    // Dr Cash/Bank
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: cashAccount.id,
                            debitAmount: data.amount,
                            creditAmount: 0,
                            referenceType: 'RECEIPT',
                            referenceId: payment.id,
                            description: `Payment received from ${customer?.name || 'Customer'}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Cr Customer AR
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: customerAccount.id,
                            debitAmount: 0,
                            creditAmount: data.amount,
                            referenceType: 'RECEIPT',
                            referenceId: payment.id,
                            description: `Payment received from ${customer?.name || 'Customer'}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });
                }

                // Create Daybook Entry
                await tx.daybook.create({
                    data: {
                        type: 'RECEIPT',
                        description: `Payment received from ${customer?.name || 'Customer'}`,
                        debit: data.amount,
                        referenceId: payment.id,
                        status: 'APPROVED',
                        tenantId: data.tenantId
                    }
                });

            } catch (error) {
                console.warn('COA not set up, skipping ledger entries');
            }

            return payment;
        });
    },

    /**
     * Get all customer balances
     */
    async getAllCustomerBalances(tenantId: string) {
        const customers = await prisma.customer.findMany({
            where: { tenantId, isDeleted: false },
            select: { id: true, name: true, email: true }
        });

        const balances = [];

        for (const customer of customers) {
            try {
                const balance = await this.getCustomerBalance(customer.id, tenantId);
                balances.push({
                    ...customer,
                    ...balance
                });
            } catch (error) {
                console.error(`Error fetching balance for ${customer.name}:`, error);
            }
        }

        return balances;
    }
};
