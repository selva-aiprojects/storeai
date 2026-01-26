import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createSale = async (req: Request, res: Response) => {
    const { customerId, items, taxAmount } = req.body;
    // items: [{ productId, quantity, unitPrice }]

    try {
        const result = await prisma.$transaction(async (tx) => {
            // A. PRICING ENGINE: Calculate Discounts
            let calculatedTotal = 0;
            let totalDiscount = 0;

            const processedItems = await Promise.all(items.map(async (item: any) => {
                // Fetch product active rules
                const rules = await tx.pricingRule.findMany({
                    where: {
                        productId: item.productId,
                        isActive: true,
                        minQuantity: { lte: item.quantity } // Volume discount check
                    },
                    orderBy: { discountPercent: 'desc' } // Apply highest discount
                });

                const bestRule = rules[0];
                let finalPrice = item.unitPrice;
                let discountAmount = 0;

                if (bestRule) {
                    const discountVal = item.unitPrice * (bestRule.discountPercent / 100);
                    finalPrice -= discountVal;
                    discountAmount = discountVal * item.quantity;
                }

                calculatedTotal += (finalPrice * item.quantity);
                totalDiscount += discountAmount;

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: finalPrice, // Store the discounted rate
                    originalPrice: item.unitPrice
                };
            }));

            // 1. Create the Sale record
            const sale = await tx.sale.create({
                data: {
                    invoiceNo: `INV-${Date.now()}`,
                    totalAmount: calculatedTotal || 0,
                    discountAmount: totalDiscount || 0,
                    taxAmount: taxAmount || 0,
                    customerId,
                    team: req.body.team || 'SALES',
                    isHomeDelivery: req.body.isHomeDelivery || false,
                    deliveryAddress: req.body.deliveryAddress || null,
                    deliveryCity: req.body.deliveryCity || null,
                    estimatedDelivery: req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery) : null,
                    items: {
                        create: processedItems.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
                include: { items: true },
            });

            // 2. Update Stock for each product
            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product || product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product?.name || item.productId}`);
                }

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } },
                });
            }

            // 3. Log to Ledger (Accounting)
            await tx.ledger.create({
                data: {
                    title: `Sale Reference: ${sale.invoiceNo}`,
                    type: 'CREDIT',
                    amount: calculatedTotal,
                    description: `Sale to customer ${customerId || 'Walk-in'} (Saved $${totalDiscount.toFixed(2)})`,
                },
            });

            return sale;
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to process sale' });
    }
};

export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await prisma.sale.findMany({
            where: { isDeleted: false },
            include: {
                customer: true,
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

export const getSaleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                items: { include: { product: true } }
            },
        });
        res.json(sale);
    } catch (error) {
        res.status(404).json({ error: 'Sale not found' });
    }
};

export const updateSaleTracking = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { trackingNumber, shippingCarrier, status } = req.body;
    try {
        const sale = await prisma.sale.update({
            where: { id },
            data: {
                trackingNumber,
                shippingCarrier,
                status: status || 'SHIPPED',
                shippedAt: status === 'SHIPPED' ? new Date() : undefined
            }
        });
        res.json(sale);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update sale tracking' });
    }
};
