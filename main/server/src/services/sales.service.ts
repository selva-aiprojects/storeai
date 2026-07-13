import prisma from '../lib/prisma';

export const SalesService = {

    async createSale(data: {
        tenantId: string;
        customerId?: string;
        salesmanId?: string;
        items: Array<{
            productId: string;
            quantity: number;
            unitPrice?: number;
            discount?: number;
        }>;
        paymentMethod: string;
        amountPaid: number;
        dueDate?: string;
        promotionCode?: string;
        isHomeDelivery?: boolean;
        deliveryAddress?: string;
        team?: string;
        terminalId?: string;
        salesChannel?: string;
    }) {
        return await prisma.$transaction(async (tx) => {
            const invoiceNo = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            const now = new Date();

            const productIds = data.items.map(item => item.productId);
            const products = await tx.product.findMany({ where: { id: { in: productIds } } });
            const productMap = new Map(products.map(product => [product.id, product]));

            // Promotion data is currently not supported by the live schema.
            const promotion = null;

            let totalBaseAmount = 0;
            let totalTax = 0;
            let totalDiscount = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            const saleItems = [] as Array<any>;

            for (const item of data.items) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                const unitPrice = Number(item.unitPrice ?? product.price);
                const quantity = Number(item.quantity);
                    const lineAmount = unitPrice * quantity;
                const discountPercent = Number(item.discount || 0);
                const lineDiscount = Math.min((lineAmount * discountPercent) / 100, lineAmount);
                const taxableAmount = lineAmount - lineDiscount;
                const taxRate = Number(product.gstRate || 0) / 100;
                const tax = taxableAmount * taxRate;
                const cgst = tax / 2;
                const sgst = tax / 2;
                const igst = 0;

                totalBaseAmount += taxableAmount;
                totalTax += tax;
                totalDiscount += lineDiscount;
                totalCgst += cgst;
                totalSgst += sgst;
                totalIgst += igst;

                saleItems.push({
                    productId: product.id,
                    quantity,
                    unitPrice,
                    taxAmount: tax,
                    cgst,
                    sgst,
                    igst
                });
            }

            const totalAmount = Number((totalBaseAmount + totalTax).toFixed(2));
            const requestedPayment = Number(data.amountPaid || 0);
            const amountPaid = Number(Math.min(requestedPayment, totalAmount).toFixed(2));
            const overpayment = Number((requestedPayment - amountPaid).toFixed(2));
            if (overpayment > 0) {
                console.warn(`Sale payment exceeds invoice total by ₹${overpayment}. Extra amount will be ignored in ledger posting.`);
            }
            const outstandingAmount = Number((totalAmount - amountPaid).toFixed(2));
            const isPaid = outstandingAmount <= 0;
            const status = isPaid ? 'COMPLETED' : 'PENDING';
            const dueDate = data.dueDate ? new Date(data.dueDate) : (!isPaid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined);

            const sale = await tx.sale.create({
                data: {
                    invoiceNo,
                    tenantId: data.tenantId,
                    customerId: data.customerId || null,
                    salesmanId: data.salesmanId || null,
                    totalAmount,
                    taxAmount: totalTax,
                    cgstAmount: totalCgst,
                    sgstAmount: totalSgst,
                    igstAmount: totalIgst,
                    discountAmount: totalDiscount,
                    roundOff: 0,
                    status,
                    isHomeDelivery: data.isHomeDelivery || false,
                    deliveryAddress: data.deliveryAddress || null,
                    team: data.team || 'SALES',
                    dueDate: dueDate || null,
                    isPaid,
                    items: {
                        create: saleItems
                    },
                    payment: amountPaid > 0 ? {
                        create: {
                            amount: amountPaid,
                            method: data.paymentMethod,
                            type: 'RECEIVABLE',
                            tenantId: data.tenantId
                        }
                    } : undefined
                },
                include: { items: true, payment: true }
            });

            // Accounting integration
            try {
                const salesAccount = await tx.chartOfAccounts.findFirst({ where: { tenantId: data.tenantId, accountType: 'SALES' } });
                const gstOutputAccount = await tx.chartOfAccounts.findFirst({ where: { tenantId: data.tenantId, accountType: 'GST_OUTPUT' } });
                const cashAccount = await tx.chartOfAccounts.findFirst({ where: { tenantId: data.tenantId, accountType: 'CASH' } });
                const bankAccount = await tx.chartOfAccounts.findFirst({ where: { tenantId: data.tenantId, accountType: 'BANK' } });
                const arAccount = await tx.chartOfAccounts.findFirst({ where: { tenantId: data.tenantId, accountType: 'AR' } });

                if (salesAccount && gstOutputAccount && (cashAccount || bankAccount || arAccount)) {
                    const voucherNumber = `SALE-${Date.now()}`;

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

                    if (totalTax > 0) {
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
                    }

                    const paymentAccount = data.paymentMethod === 'CASH' ? cashAccount : bankAccount || cashAccount;
                    if (paymentAccount && amountPaid > 0) {
                        await tx.ledgerEntry.create({
                            data: {
                                accountId: paymentAccount.id,
                                debitAmount: amountPaid,
                                creditAmount: 0,
                                referenceType: 'SALE_PAYMENT',
                                referenceId: sale.id,
                                description: `Payment received for ${invoiceNo}`,
                                voucherNumber,
                                tenantId: data.tenantId
                            }
                        });
                    }

                    if (!isPaid && outstandingAmount > 0 && arAccount) {
                        await tx.ledgerEntry.create({
                            data: {
                                accountId: arAccount.id,
                                debitAmount: outstandingAmount,
                                creditAmount: 0,
                                referenceType: 'AR',
                                referenceId: sale.id,
                                description: `Accounts receivable for ${invoiceNo}`,
                                voucherNumber,
                                tenantId: data.tenantId
                            }
                        });
                    }

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
                }
            } catch (accountingError) {
                console.warn('Accounting integration failed for sale:', accountingError);
            }

            for (const item of saleItems) {
                await (await import('./inventory.service')).InventoryService.deductStockForSale({
                    tenantId: data.tenantId,
                    productId: item.productId,
                    quantityRequired: item.quantity,
                    invoiceId: sale.id,
                    salesmanId: data.salesmanId
                }, tx);
            }

            if (data.customerId) {
                // Customer loyalty fields are not present in the current schema,
                // so we skip loyalty point updates for this flow.
            }

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
