import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ProcurementService = {

    /**
     * Create Purchase Requisition (Manual or Auto)
     */
    async createRequisition(data: {
        tenantId: string;
        requestedById: string;
        items: { productId: string; quantity: number }[];
        priority?: string;
        notes?: string;
        isAuto?: boolean;
    }) {
        // Generate Requisition No
        const count = await prisma.purchaseRequisition.count({ where: { tenantId: data.tenantId } });
        const reqNo = `PR-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        return await prisma.purchaseRequisition.create({
            data: {
                tenantId: data.tenantId,
                requisitionNo: reqNo,
                requestedById: data.requestedById,
                status: 'PENDING',
                priority: data.priority || 'MEDIUM',
                notes: data.notes,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                }
            },
            include: { items: true }
        });
    },

    /**
     * Convert Requisition to Quotation Request
     * (Here we just record the Quotation received from Supplier)
     */
    async recordQuotation(data: {
        tenantId: string;
        requisitionId?: string;
        supplierId: string;
        quotationNo: string;
        totalAmount: number;
        validUntil?: Date;
        items: any; // PDF blob or JSON details
    }) {
        return await prisma.purchaseQuotation.create({
            data: {
                tenantId: data.tenantId,
                requisitionId: data.requisitionId,
                supplierId: data.supplierId,
                quotationNo: data.quotationNo,
                totalAmount: data.totalAmount,
                validUntil: data.validUntil,
                status: 'RECEIVED',
                items: data.items
            }
        });
    },

    /**
     * Create Purchase Order from Quotation
     */
    async createPOFromQuotation(data: {
        tenantId: string;
        quotationId: string;
        approvedById: string;
    }) {
        const quotation = await prisma.purchaseQuotation.findUnique({
            where: { id: data.quotationId },
            include: { supplier: true }
        });

        if (!quotation) throw new Error("Quotation not found");

        // Generate PO Number
        const count = await prisma.order.count({ where: { tenantId: data.tenantId } });
        const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // Create PO
        return await prisma.order.create({
            data: {
                tenantId: data.tenantId,
                orderNumber: poNumber,
                supplierId: quotation.supplierId,
                quotationId: quotation.id,
                status: 'DRAFT',
                approvalStatus: 'APPROVED',
                approvedById: data.approvedById,
                totalAmount: quotation.totalAmount,
                // For simplicity, we assume items are transferred. In real system, we'd copy items here.
            }
        });
    }
};
