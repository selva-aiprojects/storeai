import { InventoryService } from './inventory.service';
import prisma from '../lib/prisma';

export const SalesService = {

    /**
     * Create Sale with Accounting Integration
     */
    async createSale(data: {
        tenantId: string;
        customerId?: string;
        salesmanId?: string;
        items: Array<{
            productId: string;
            quantity: number;
            unitPrice: number;
            discount: number;
        }>;
        paymentMethod: string;
        amountPaid: number;
    }) {
        return await prisma.$transaction(async (tx) => {
            const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

            let totalBaseAmount = 0;
            let totalTax = 0;

            // 1. Calculate totals
            for (const item of data.items) {
                const subtotal = item.quantity * item.unitPrice;
                const tax = subtotal * 0.18; // 18% GST default

                totalBaseAmount += subtotal;
                totalTax += tax;
            }

            const totalAmount = totalBaseAmount + totalTax;

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    invoiceNo,
                    tenantId: data.tenantId,
                    customerId: data.customerId || null,
                    salesmanId: data.salesmanId || null,
                    totalAmount,
                    taxAmount: totalTax,
                    status: 'COMPLETED',
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxAmount: item.quantity * item.unitPrice * 0.18
                            // Note: 'discount' and 'tax' fields are not in current SaleItem schema
                        }))
                    },
                    payment: {
                        create: {
                            amount: data.amountPaid,
                            method: data.paymentMethod,
                            type: 'RECEIVABLE',
                            tenantId: data.tenantId
                        }
                    }
                },
                include: { items: true, payment: true }
            });

            // === ACCOUNTING INTEGRATION (NEW SYSTEM) ===
            try {
                // Find relevant accounts
                const salesAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'SALES' }
                });

                const gstOutputAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'GST_OUTPUT' }
                });

                const cashAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'CASH' }
                });

                const arAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'AR' }
                });

                if (salesAccount && gstOutputAccount && (cashAccount || arAccount)) {
                    const voucherNumber = `SALE-${Date.now()}`;

                    // Cr Sales Revenue (Base amount)
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: salesAccount.id,
                            debitAmount: 0,
                            creditAmount: totalBaseAmount,
                            referenceType: 'SALE',
                            referenceId: sale.id,
                            description: `Sales Revenue - ${invoiceNo}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Cr GST Output Tax
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: gstOutputAccount.id,
                            debitAmount: 0,
                            creditAmount: totalTax,
                            referenceType: 'SALE',
                            referenceId: sale.id,
                            description: `GST Output on Sale - ${invoiceNo}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Dr Cash or Accounts Receivable
                    const isCash = data.paymentMethod === 'CASH';
                    const targetAccount = (isCash && cashAccount) ? cashAccount : arAccount;

                    if (targetAccount) {
                        await tx.ledgerEntry.create({
                            data: {
                                accountId: targetAccount.id,
                                debitAmount: totalAmount,
                                creditAmount: 0,
                                referenceType: 'SALE',
                                referenceId: sale.id,
                                description: `Payment received for ${invoiceNo}`,
                                voucherNumber,
                                tenantId: data.tenantId
                            }
                        });
                    }

                    // Create Daybook Entry
                    await tx.daybook.create({
                        data: {
                            type: 'SALE',
                            description: `Sale - ${invoiceNo}`,
                            debit: totalAmount,
                            referenceId: sale.id,
                            status: 'APPROVED',
                            tenantId: data.tenantId
                        }
                    });

                    console.log(`✓ Ledger entries created for sale ${invoiceNo}: ₹${totalAmount}`);
                }
            } catch (accountingError) {
                console.warn('Accounting integration failed for sale:', accountingError);
            }

            // 3. Trigger Stock Deduction (FIFO)
            for (const item of data.items) {
                await InventoryService.deductStockForSale({
                    tenantId: data.tenantId,
                    productId: item.productId,
                    quantityRequired: item.quantity,
                    invoiceId: sale.id,
                    salesmanId: data.salesmanId
                }, tx);
            }

            // 4. Calculate Sales Incentive
            if (data.salesmanId) {
                try {
                    const { IncentiveService } = await import('./incentive.service');
                    await IncentiveService.calculateSalesIncentive({
                        saleId: sale.id,
                        salesmanId: data.salesmanId,
                        tenantId: data.tenantId,
                        saleAmount: totalAmount,
                        taxAmount: totalTax,
                        tx
                    });
                } catch (incentiveError) {
                    console.warn('Sales incentive calculation failed:', incentiveError);
                }
            }

            return sale;
        }, { timeout: 30000 });
    }
};
