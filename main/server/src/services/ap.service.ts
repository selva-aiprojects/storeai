import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Accounts Payable Service
 * Manages supplier payments and aging reports
 */

export const APService = {

    /**
     * Get supplier outstanding balance from ledger
     */
    async getSupplierBalance(supplierId: string, tenantId: string) {
        try {
            // Find supplier's AP account
            const supplier = await prisma.supplier.findUnique({
                where: { id: supplierId },
                select: { name: true }
            });

            if (!supplier) {
                throw new Error('Supplier not found');
            }

            // Find AP account for this supplier
            const supplierAccount = await prisma.chartOfAccounts.findFirst({
                where: {
                    tenantId,
                    accountType: 'ACCOUNTS_PAYABLE',
                    name: { contains: supplier.name }
                }
            });

            if (!supplierAccount) {
                // Fallback: Calculate from orders
                const orders = await prisma.order.findMany({
                    where: {
                        supplierId,
                        tenantId,
                        isDeleted: false,
                        status: { in: ['COMPLETED', 'PARTIAL_RECEIVED'] }
                    }
                });

                const totalOrders = orders.reduce((sum, order) => sum + order.totalAmount, 0);

                return {
                    supplierId,
                    supplierName: supplier.name,
                    totalOrders,
                    outstanding: totalOrders, // Assuming all unpaid for now
                    method: 'FALLBACK'
                };
            }

            // Calculate from ledger entries
            const entries = await prisma.ledgerEntry.findMany({
                where: {
                    accountId: supplierAccount.id,
                    tenantId
                }
            });

            const totalDebit = entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
            const totalCredit = entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
            const outstanding = totalCredit - totalDebit; // Credit increases AP

            return {
                supplierId,
                supplierName: supplier.name,
                totalDebit,
                totalCredit,
                outstanding,
                method: 'LEDGER'
            };

        } catch (error) {
            console.error('Error fetching supplier balance:', error);
            throw error;
        }
    },

    /**
     * AP Aging Report
     * Groups outstanding amounts by age
     */
    async getAPAgingReport(tenantId: string) {
        const orders = await prisma.order.findMany({
            where: {
                tenantId,
                status: { in: ['COMPLETED', 'PARTIAL_RECEIVED'] },
                isDeleted: false
            },
            include: {
                supplier: {
                    select: { id: true, name: true, email: true, paymentTerms: true }
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

        for (const order of orders) {
            // Calculate due date based on payment terms (default Net 30)
            const paymentTermsDays = order.supplier.paymentTerms === 'Net 45' ? 45 :
                order.supplier.paymentTerms === 'Net 60' ? 60 : 30;

            const dueDate = new Date(order.createdAt);
            dueDate.setDate(dueDate.getDate() + paymentTermsDays);

            const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            const item = {
                orderId: order.id,
                orderNumber: order.orderNumber,
                supplierId: order.supplier.id,
                supplierName: order.supplier.name,
                amount: order.totalAmount,
                dueDate,
                daysPastDue: Math.max(0, daysPastDue)
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
            grandTotal: orders.reduce((sum, order) => sum + order.totalAmount, 0)
        };
    },

    /**
     * Record supplier payment
     */
    async recordSupplierPayment(data: {
        supplierId: string;
        orderId?: string;
        amount: number;
        paymentMethod: string; // CASH, BANK, CHEQUE, etc.
        transactionId?: string;
        tenantId: string;
    }) {
        return await prisma.$transaction(async (tx) => {
            // 1. Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    amount: data.amount,
                    method: data.paymentMethod,
                    type: 'PAYABLE',
                    transactionId: data.transactionId,
                    tenantId: data.tenantId
                }
            });

            // 2. Create Ledger Entries if COA is set up
            try {
                // Find Cash/Bank Account
                const cashAccount = await tx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: data.paymentMethod === 'CASH' ? 'CASH' : 'BANK'
                    }
                });

                // Find Supplier AP Account
                const supplier = await tx.supplier.findUnique({
                    where: { id: data.supplierId },
                    select: { name: true }
                });

                const supplierAccount = await tx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'ACCOUNTS_PAYABLE',
                        OR: [
                            { code: { contains: data.supplierId.substring(0, 8) } },
                            { name: { contains: supplier?.name || '' } }
                        ]
                    }
                });

                if (cashAccount && supplierAccount) {
                    const voucherNumber = `PAY-${Date.now()}`;

                    // Dr Supplier AP (reduce liability)
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: supplierAccount.id,
                            debitAmount: data.amount,
                            creditAmount: 0,
                            referenceType: 'PAYMENT',
                            referenceId: payment.id,
                            description: `Payment to ${supplier?.name || 'Supplier'}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Cr Cash/Bank
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: cashAccount.id,
                            debitAmount: 0,
                            creditAmount: data.amount,
                            referenceType: 'PAYMENT',
                            referenceId: payment.id,
                            description: `Payment to ${supplier?.name || 'Supplier'}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });
                }

                // Create Daybook Entry
                await tx.daybook.create({
                    data: {
                        type: 'PAYMENT',
                        description: `Payment to ${supplier?.name || 'Supplier'}`,
                        credit: data.amount,
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
     * Get all supplier balances
     */
    async getAllSupplierBalances(tenantId: string) {
        const suppliers = await prisma.supplier.findMany({
            where: { tenantId, isDeleted: false },
            select: { id: true, name: true, email: true, paymentTerms: true }
        });

        const balances = [];

        for (const supplier of suppliers) {
            try {
                const balance = await this.getSupplierBalance(supplier.id, tenantId);
                balances.push({
                    ...supplier,
                    ...balance
                });
            } catch (error) {
                console.error(`Error fetching balance for ${supplier.name}:`, error);
            }
        }

        return balances;
    }
};
