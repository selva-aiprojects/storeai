import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Purchase Return Service
 * Handles creation of purchase returns (debit notes) and accounting reversals
 */

export const PurchaseReturnService = {

    /**
     * Create Purchase Return
     * Reverses stock, creates debit note, reverses accounting entries
     */
    async createPurchaseReturn(data: {
        tenantId: string;
        orderId: string;
        supplierId: string;
        items: Array<{
            productId: string;
            quantity: number;
            refundAmount: number;
            reason?: string;
        }>;
        reason?: string;
        notes?: string;
        gstRefund?: number;
        transportCharge?: number;
    }) {
        return await prisma.$transaction(async (tx) => {
            // 1. Calculate total refund
            const totalRefund = data.items.reduce((sum, item) => sum + item.refundAmount, 0);
            const gstRefund = data.gstRefund || 0;
            const transportCharge = data.transportCharge || 0;

            // 2. Create Purchase Return Header
            const returnNumber = `PR-${Date.now()}`;
            const purchaseReturn = await tx.purchaseReturn.create({
                data: {
                    returnNumber,
                    orderId: data.orderId,
                    supplierId: data.supplierId,
                    totalRefund,
                    gstRefund,
                    transportCharge,
                    reason: data.reason,
                    notes: data.notes,
                    status: 'PENDING',
                    tenantId: data.tenantId,
                    items: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            refundAmount: item.refundAmount,
                            reason: item.reason
                        }))
                    }
                }
            });

            // 3. Reverse Stock (Outward Movement)
            for (const item of data.items) {
                // Find batches for this product (FIFO - oldest first)
                const batches = await tx.productBatch.findMany({
                    where: {
                        productId: item.productId,
                        quantityAvailable: { gt: 0 },
                        status: 'ACTIVE'
                    },
                    orderBy: { createdAt: 'asc' }
                });

                let remainingQty = item.quantity;

                for (const batch of batches) {
                    if (remainingQty <= 0) break;

                    const deduct = Math.min(batch.quantityAvailable, remainingQty);

                    // Update batch
                    await tx.productBatch.update({
                        where: { id: batch.id },
                        data: {
                            quantityAvailable: { decrement: deduct },
                            status: (batch.quantityAvailable - deduct === 0) ? 'EXHAUSTED' : 'ACTIVE'
                        }
                    });

                    // Create stock ledger entry (OUTWARD)
                    await tx.stockLedger.create({
                        data: {
                            tenantId: data.tenantId,
                            productId: item.productId,
                            batchId: batch.id,
                            transactionType: 'PURCHASE_RETURN',
                            referenceType: 'PURCHASE_RETURN',
                            referenceId: purchaseReturn.id,
                            quantityIn: 0,
                            quantityOut: deduct,
                            balanceQuantity: batch.quantityAvailable - deduct,
                            createdBy: 'SYSTEM',
                            transactionDate: new Date()
                        }
                    });

                    remainingQty -= deduct;
                }

                // Update product global stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } }
                });
            }

            // 4. Create Accounting Entries (Reverse Purchase)
            try {
                const baseAmount = totalRefund - gstRefund;

                // Find relevant accounts
                const inventoryAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'INVENTORY' }
                });

                const gstInputAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'GST_INPUT' }
                });

                const apAccount = await tx.chartOfAccounts.findFirst({
                    where: { tenantId: data.tenantId, accountType: 'AP' }
                });

                if (inventoryAccount && apAccount) {
                    const voucherNumber = `DEBIT-${returnNumber}`;

                    // Cr Inventory (reduce asset)
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: inventoryAccount.id,
                            debitAmount: 0,
                            creditAmount: baseAmount,
                            referenceType: 'PURCHASE_RETURN',
                            referenceId: purchaseReturn.id,
                            description: `Purchase Return - ${returnNumber}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Cr GST Input (reverse ITC)
                    if (gstInputAccount && gstRefund > 0) {
                        await tx.ledgerEntry.create({
                            data: {
                                accountId: gstInputAccount.id,
                                debitAmount: 0,
                                creditAmount: gstRefund,
                                referenceType: 'PURCHASE_RETURN',
                                referenceId: purchaseReturn.id,
                                description: `GST Input reversal - ${returnNumber}`,
                                voucherNumber,
                                tenantId: data.tenantId
                            }
                        });
                    }

                    // Dr Accounts Payable (reduce liability)
                    await tx.ledgerEntry.create({
                        data: {
                            accountId: apAccount.id,
                            debitAmount: totalRefund,
                            creditAmount: 0,
                            referenceType: 'PURCHASE_RETURN',
                            referenceId: purchaseReturn.id,
                            description: `Debit Note - ${returnNumber}`,
                            voucherNumber,
                            tenantId: data.tenantId
                        }
                    });

                    // Create Daybook Entry
                    await tx.daybook.create({
                        data: {
                            type: 'PURCHASE_RETURN',
                            description: `Purchase Return - ${returnNumber}`,
                            debit: totalRefund,
                            referenceId: purchaseReturn.id,
                            status: 'APPROVED',
                            tenantId: data.tenantId
                        }
                    });

                    console.log(`✓ Purchase return accounting entries created: ₹${totalRefund}`);
                }
            } catch (error) {
                console.warn('Chart of Accounts not set up, skipping ledger entries');
            }

            return purchaseReturn;
        }, { timeout: 60000 });
    },

    /**
     * Get all purchase returns for a tenant
     */
    async getPurchaseReturns(tenantId: string) {
        return await prisma.purchaseReturn.findMany({
            where: { tenantId },
            include: {
                items: true,
                supplier: {
                    select: { name: true, email: true }
                },
                order: {
                    select: { orderNumber: true, totalAmount: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    /**
     * Approve purchase return
     */
    async approvePurchaseReturn(id: string, tenantId: string) {
        return await prisma.purchaseReturn.update({
            where: { id },
            data: { status: 'APPROVED' }
        });
    }
};
