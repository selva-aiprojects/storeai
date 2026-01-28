import { PrismaClient } from '@prisma/client';
import { InventoryService } from './inventory.service';

const prisma = new PrismaClient();

export const SalesService = {

    /**
     * Create New Sale Invoice
     * - Calculates Taxes (CGST/SGST vs IGST)
     * - Creates Sale Record
     * - Triggers Stock Deduction (FIFO) via InventoryService
     */
    async createSale(data: {
        tenantId: string;
        customerId?: string;
        salesmanId?: string;
        items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
        paymentMethod: string; // CASH, CARD, UPI
        amountPaid: number;
        isHomeDelivery?: boolean;
        deliveryAddress?: string;
    }) {
        return await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            let totalTax = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;
            let totalDiscount = 0;

            // 1. Fetch Tenant (Company) State for Tax Logic
            // Assuming Tenant has 'address' field which contains state, or we default to 'MH' for example.
            // For now, we assume INTRA-STATE (CGST+SGST) is default unless Customer is from different state.
            const isInterState = false; // Logic to derive from Customer Address vs Tenant Address

            const saleItemsData = [];

            for (const item of data.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error(`Product ${item.productId} not found`);

                // Tax Calculation (Inclusive or Exclusive? Let's assume Exclusive for B2B, Inclusive for Retail usually. 
                // Prompt says "Calculate GST dynamically", implying strictly calculating it)

                const taxableValue = (item.unitPrice * item.quantity) - (item.discount || 0);
                const gstRate = product.gstRate || 18; // Default 18%

                const taxAmount = (taxableValue * gstRate) / 100;
                let cgst = 0, sgst = 0, igst = 0;

                if (isInterState) {
                    igst = taxAmount;
                    totalIGST += igst;
                } else {
                    cgst = taxAmount / 2;
                    sgst = taxAmount / 2;
                    totalCGST += cgst;
                    totalSGST += sgst;
                }

                totalTax += taxAmount;
                totalDiscount += (item.discount || 0);
                totalAmount += (taxableValue + taxAmount);

                saleItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxAmount: taxAmount,
                    cgst,
                    sgst,
                    igst
                });
            }

            // Generate Invoice No
            const count = await tx.sale.count({ where: { tenantId: data.tenantId } });
            const invoiceNo = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    tenantId: data.tenantId,
                    invoiceNo,
                    customerId: data.customerId || null,
                    salesmanId: data.salesmanId || null,
                    totalAmount,
                    taxAmount: totalTax,
                    cgstAmount: totalCGST,
                    sgstAmount: totalSGST,
                    igstAmount: totalIGST,
                    discountAmount: totalDiscount,
                    status: 'COMPLETED', // POS usually immediate
                    payment: {
                        create: {
                            amount: data.amountPaid,
                            method: data.paymentMethod,
                            tenantId: data.tenantId,
                            type: 'RECEIVABLE'
                        }
                    },
                    items: {
                        create: saleItemsData
                    }
                },
                include: { items: true }
            });

            // 2.1 Post GST Output to Ledger
            if (totalTax > 0) {
                await tx.ledger.create({
                    data: {
                        title: `GST Output Liability: ${invoiceNo}`,
                        type: 'CREDIT',
                        amount: totalTax,
                        category: 'GST_PAYABLE',
                        description: `GST collected on Sale ${invoiceNo}`,
                        tenantId: data.tenantId
                    }
                });
            }

            // 3. Trigger Stock Deduction (FIFO)
            // We do this AFTER creating Sale so we have constraints checked, 
            // but inside the transaction so it rolls back if stock fails.
            for (const item of data.items) {
                await InventoryService.deductStockForSale({
                    tenantId: data.tenantId,
                    productId: item.productId,
                    quantityRequired: item.quantity,
                    invoiceId: sale.id,
                    salesmanId: data.salesmanId
                }, tx); // Pass tx
            }

            return sale;
        }, { timeout: 30000 });
    }
};
