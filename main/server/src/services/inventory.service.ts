import { PrismaClient, Product, ProductBatch, StockLedger, Stock, InventoryDocument } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Inventory Service
 * Handles detailed stock management, batch tracking, and reorder logic.
 */
export const InventoryService = {

    /**
     * Process Inward Stock (Goods Receipt) - ENHANCED VERSION WITH ACCOUNTING
     * Creates Batches, Updates Stock, Creates Ledger Entries, Calculates Incentives
     */
    async processInwardStock(data: {
        tenantId: string;
        productId: string;
        warehouseId: string;
        quantity: number;
        costPrice: number;
        batchNumber: string;
        expiryDate?: Date;
        poId?: string;
        receivedBy: string;
        supplierId?: string;
        gstAmount?: number;
    }, tx?: any) {
        // Use provided transaction or start a new one
        const runLogic = async (prismaTx: any) => {
            // 1. Create Product Batch
            const batch = await prismaTx.productBatch.create({
                data: {
                    productId: data.productId,
                    batchNumber: data.batchNumber, // Or generate distinct batch no
                    quantityReceived: data.quantity,
                    quantityAvailable: data.quantity,
                    costPrice: data.costPrice,
                    expiryDate: data.expiryDate,
                    poId: data.poId,
                    status: 'ACTIVE'
                }
            });

            // 2. Update Warehouse Stock Aggregate
            const stock = await prismaTx.stock.upsert({
                where: {
                    warehouseId_productId_batchNumber: {
                        warehouseId: data.warehouseId,
                        productId: data.productId,
                        batchNumber: data.batchNumber
                    }
                },
                update: {
                    quantity: { increment: data.quantity }
                },
                create: {
                    warehouseId: data.warehouseId,
                    productId: data.productId,
                    batchNumber: data.batchNumber,
                    quantity: data.quantity,
                    expiryDate: data.expiryDate
                }
            });

            // 3. Update Product Global Stock
            await prismaTx.product.update({
                where: { id: data.productId },
                data: { stockQuantity: { increment: data.quantity } }
            });

            // 4. Create Stock Ledger Entry
            await prismaTx.stockLedger.create({
                data: {
                    tenantId: data.tenantId,
                    productId: data.productId,
                    batchId: batch.id,
                    transactionType: 'INWARD',
                    referenceType: 'PO',
                    referenceId: data.poId, // PO ID or GRN ID
                    quantityIn: data.quantity,
                    quantityOut: 0,
                    balanceQuantity: data.quantity, // This is batch balance. Complex global balance logging could be done here too.
                    createdBy: data.receivedBy,
                    transactionDate: new Date()
                }
            });

            // === ACCOUNTING INTEGRATION ===
            // Only create accounting entries if Chart of Accounts is set up
            try {
                const totalAmount = data.costPrice * data.quantity;
                const gstAmount = data.gstAmount || 0;
                const baseAmount = totalAmount - gstAmount;

                // Find relevant accounts
                const inventoryAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'INVENTORY'
                    }
                });

                const gstInputAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'GST_INPUT'
                    }
                });

                const apAccount = await prismaTx.chartOfAccounts.findFirst({
                    where: {
                        tenantId: data.tenantId,
                        accountType: 'AP'
                    }
                });

                if (inventoryAccount && apAccount) {
                    const voucherNumber = `GRN-${Date.now()}`;

                    // Dr Inventory (at base cost)
                    await prismaTx.ledgerEntry.create({
                        data: {
                            accountId: inventoryAccount.id,
                            debitAmount: baseAmount,
                            creditAmount: 0,
                            referenceType: 'GRN',
                            referenceId: batch.id,
                            description: `Stock received - ${data.batchNumber}`,
                            voucherNumber,
                            tenantId: data.tenantId,
                            createdBy: data.receivedBy
                        }
                    });

                    // Dr GST Input Tax Credit (if applicable)
                    if (gstInputAccount && gstAmount > 0) {
                        await prismaTx.ledgerEntry.create({
                            data: {
                                accountId: gstInputAccount.id,
                                debitAmount: gstAmount,
                                creditAmount: 0,
                                referenceType: 'GRN',
                                referenceId: batch.id,
                                description: `GST Input on GRN - ${data.batchNumber}`,
                                voucherNumber,
                                tenantId: data.tenantId,
                                createdBy: data.receivedBy
                            }
                        });
                    }

                    // Cr Accounts Payable
                    await prismaTx.ledgerEntry.create({
                        data: {
                            accountId: apAccount.id,
                            debitAmount: 0,
                            creditAmount: totalAmount,
                            referenceType: 'GRN',
                            referenceId: batch.id,
                            description: `Supplier liability for GRN - ${data.batchNumber}`,
                            voucherNumber,
                            tenantId: data.tenantId,
                            createdBy: data.receivedBy
                        }
                    });

                    //  Create Daybook Entry
                    await prismaTx.daybook.create({
                        data: {
                            type: 'PURCHASE',
                            description: `Goods Receipt - ${data.batchNumber}`,
                            credit: totalAmount,
                            referenceId: batch.id,
                            status: 'APPROVED',
                            tenantId: data.tenantId
                        }
                    });

                    console.log(`✓ Ledger postings created for GRN: ₹${totalAmount}`);
                }

                // === INCENTIVE CALCULATION ===
                // Calculate purchase facilitation incentive if employee is eligible
                if (data.poId && data.receivedBy && data.supplierId) {
                    // Import IncentiveService dynamically to avoid circular dependencies
                    const { IncentiveService } = await import('./incentive.service');

                    // Get order details to fetch total order amount
                    const order = await prismaTx.order.findUnique({
                        where: { id: data.poId }
                    });

                    if (order) {
                        // Find employee record for receivedBy user
                        const employee = await prismaTx.employee.findFirst({
                            where: {
                                userId: data.receivedBy
                            }
                        });

                        if (employee?.eligibleForIncentive) {
                            await IncentiveService.calculatePurchaseIncentive({
                                orderId: data.poId,
                                employeeId: employee.id,
                                tenantId: data.tenantId,
                                orderAmount: order.totalAmount,
                                tx: prismaTx
                            });
                        }
                    }
                }

            } catch (error) {
                console.warn('Chart of Accounts not set up or incentive calculation failed:', error);
                // Continue without accounting entries
            }

            return batch;
        };

        if (tx) return runLogic(tx);
        return prisma.$transaction(runLogic);
    },

    /**
     * Deduct Stock for Sales (FIFO Logic)
     * Allocates stock from oldest batches first.
     */
    async deductStockForSale(data: {
        tenantId: string;
        productId: string;
        quantityRequired: number;
        invoiceId: string;
        salesmanId?: string;
    }, tx?: any) {
        const runLogic = async (prismaTx: any) => {
            let remainingQty = data.quantityRequired;
            const allocatedBatches = [];

            // 1. Fetch Active Batches (FIFO: Oldest First)
            // We assume strict FIFO. Expiry logic can be added (filter out expired).
            const batches = await prismaTx.productBatch.findMany({
                where: {
                    productId: data.productId,
                    quantityAvailable: { gt: 0 },
                    status: 'ACTIVE'
                },
                orderBy: { createdAt: 'asc' }
            });

            // Check total availability
            const totalAvailable = batches.reduce((sum: number, b: any) => sum + b.quantityAvailable, 0);
            if (totalAvailable < remainingQty) {
                throw new Error(`Insufficient stock for Product ${data.productId}. Required: ${remainingQty}, Available: ${totalAvailable}`);
            }

            // 2. Iterate and Deduct
            for (const batch of batches) {
                if (remainingQty <= 0) break;

                const deduct = Math.min(batch.quantityAvailable, remainingQty);

                // Update Batch
                const updatedBatch = await prismaTx.productBatch.update({
                    where: { id: batch.id },
                    data: {
                        quantityAvailable: { decrement: deduct },
                        status: (batch.quantityAvailable - deduct === 0) ? 'EXHAUSTED' : 'ACTIVE'
                    }
                });

                // Add to Sales Register
                await prismaTx.salesRegister.create({
                    data: {
                        tenantId: data.tenantId,
                        invoiceId: data.invoiceId,
                        productId: data.productId,
                        batchId: batch.id,
                        quantitySold: deduct,
                        stockBefore: batch.quantityAvailable,
                        stockAfter: batch.quantityAvailable - deduct,
                        transactionTimestamp: new Date()
                    }
                });

                // Add to Ledger with ref to Batch
                await prismaTx.stockLedger.create({
                    data: {
                        tenantId: data.tenantId,
                        productId: data.productId,
                        batchId: batch.id,
                        transactionType: 'SALE',
                        referenceType: 'SALES_INVOICE',
                        referenceId: data.invoiceId,
                        quantityIn: 0,
                        quantityOut: deduct,
                        balanceQuantity: updatedBatch.quantityAvailable,
                        createdBy: data.salesmanId || 'SYSTEM',
                        transactionDate: new Date()
                    }
                });

                remainingQty -= deduct;
                allocatedBatches.push({ batchId: batch.id, quantity: deduct });
            }

            // 3. Update Product Aggregate
            const updatedProduct = await prismaTx.product.update({
                where: { id: data.productId },
                data: { stockQuantity: { decrement: data.quantityRequired } }
            });

            // 4. Trigger Auto-Reorder Check
            if (updatedProduct.stockQuantity <= updatedProduct.reorderPoint) {
                // This typically would be an async event or separate service call
                // await this.triggerReorderIfRequired(data.tenantId, updatedProduct);
            }

            return allocatedBatches;
        };

        if (tx) return runLogic(tx);
        return prisma.$transaction(runLogic);
    },

    /**
     * Check and Trigger Reorder
     */
    async triggerReorderIfRequired(tenantId: string, product: Product) {
        // Check if open Requisition exists to avoid duplicates
        const openRequisition = await prisma.purchaseRequisitionItem.findFirst({
            where: {
                productId: product.id,
                requisition: {
                    status: { in: ['PENDING', 'APPROVED'] }
                }
            }
        });

        if (!openRequisition) {
            // Create Auto-Requisition logic here
            // or simply Log/Notify
            console.log(`[ALERT] Product ${product.sku} is below reorder level! Triggering Requisition...`);

            // Call ProcurementService.createAutoRequisition(...)
        }
    }

};
