
import { PrismaClient, Product } from '@prisma/client';
import { addDays, subDays, format, isBefore, isAfter } from 'date-fns';

const prisma = new PrismaClient();

// Configuration
const DAYS_OF_HISTORY = 365;
const START_DATE = subDays(new Date(), DAYS_OF_HISTORY);
const END_DATE = new Date(); // Today

// Helpers
function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Main Seeding Function
async function main() {
    console.log('🚀 Starting Transaction Data Seeding...');
    console.log(`📅 Period: ${format(START_DATE, 'yyyy-MM-dd')} to ${format(END_DATE, 'yyyy-MM-dd')}`);

    // 1. Load Reference Data
    let tenants = await prisma.tenant.findMany({
        include: {
            products: { include: { category: true } },
            customers: true,
            suppliers: true,
            warehouses: true
        }
    });

    if (tenants.length === 0) {
        console.error('❌ No tenants found! Please run seed_real_world_data.ts first.');
        return;
    }

    // Filter out tenants that don't have enough data to simulate
    tenants = tenants.filter(t => t.products.length > 0 && t.suppliers.length > 0 && t.customers.length > 0);
    console.log(`ℹ️ Simulating for ${tenants.length} valid tenants.`);

    // Initialize local "Simulated Stock" tracking
    const stockCache: Record<string, Record<string, number>> = {};
    const batchCache: Record<string, Record<string, { id: string, batchNumber: string, quantity: number, expiry: Date | null }[]>> = {};

    // Initialize default warehouse for tenants if missing
    for (const tenant of tenants) {
        if (tenant.warehouses.length === 0) {
            console.log(`🔧 Creating default warehouse for ${tenant.name}`);
            const wh = await prisma.warehouse.create({
                data: {
                    name: 'Main Warehouse',
                    location: 'Headquarters',
                    isDefault: true,
                    tenantId: tenant.id
                }
            });
            tenant.warehouses.push(wh);
        }

        stockCache[tenant.id] = {};
        batchCache[tenant.id] = {};

        // Initial Stock Setup (Assume start low)
        for (const p of tenant.products) {
            stockCache[tenant.id][p.id] = getRandomInt(5, 20);
            batchCache[tenant.id][p.id] = [];
        }
    }

    // 2. Simulation Loop
    let currentDate = START_DATE;
    let totalSales = 0;
    let totalPOs = 0;

    // list of { tenantId, poId, supplierId, items: [], deliveryDate }
    const pendingReceipts: any[] = [];

    while (isBefore(currentDate, addDays(END_DATE, 1))) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (getRandomInt(1, 10) === 1) console.log(`⏳ Processing: ${dateStr}`);

        for (const tenant of tenants) {
            const warehouse = tenant.warehouses[0];
            const tenantStock = stockCache[tenant.id];

            // --- A. PURCHASING LOGIC (Morning) ---
            const productsNeedingStock = tenant.products.filter(p => (tenantStock[p.id] || 0) < (p.reorderPoint || 10));

            if (productsNeedingStock.length > 0) {
                const supplier = getRandomItem(tenant.suppliers);
                if (supplier) {
                    const poItems = productsNeedingStock.slice(0, getRandomInt(1, 5)).map(p => ({
                        productId: p.id,
                        quantity: p.reorderQuantity || 50,
                        unitPrice: p.costPrice
                    }));

                    if (poItems.length > 0) {
                        const orderTotal = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

                        const po = await prisma.order.create({
                            data: {
                                orderNumber: `PO-${format(currentDate, 'yyMMdd')}-${getRandomInt(1000, 9999)}`,
                                status: 'APPROVED',
                                approvalStatus: 'APPROVED',
                                totalAmount: orderTotal,
                                supplierId: supplier.id,
                                tenantId: tenant.id,
                                createdAt: currentDate,
                                updatedAt: currentDate,
                                items: {
                                    create: poItems.map(i => ({
                                        productId: i.productId,
                                        quantity: i.quantity,
                                        unitPrice: i.unitPrice
                                    }))
                                }
                            }
                        });

                        const leadTime = 5 + getRandomInt(-1, 3);
                        const deliveryDate = addDays(currentDate, leadTime);

                        pendingReceipts.push({
                            tenantId: tenant.id,
                            poId: po.id,
                            warehouseId: warehouse.id,
                            supplierId: supplier.id,
                            items: poItems,
                            deliveryDate: deliveryDate
                        });
                        totalPOs++;
                    }
                }
            }

            // --- B. RECEIVING LOGIC (Mid-Day) ---
            const dueReceipts = pendingReceipts.filter(r =>
                r.tenantId === tenant.id && isBefore(r.deliveryDate, addDays(currentDate, 1))
            );

            for (const receipt of dueReceipts) {
                const index = pendingReceipts.indexOf(receipt);
                if (index > -1) pendingReceipts.splice(index, 1);

                const grn = await prisma.goodsReceipt.create({
                    data: {
                        grnNumber: `GRN-${format(currentDate, 'yyMMdd')}-${getRandomInt(1000, 9999)}`,
                        orderId: receipt.poId,
                        warehouseId: receipt.warehouseId,
                        receivedById: null,
                        items: {
                            create: receipt.items.map((item: any) => {
                                let expiryDate = null;
                                const isPerishable = ['gastroglore', 'healthfirst'].includes(tenant.slug);
                                if (isPerishable) {
                                    expiryDate = addDays(currentDate, getRandomInt(30, 365));
                                    if (Math.random() < 0.01) expiryDate = addDays(currentDate, getRandomInt(5, 15));
                                }

                                return {
                                    productId: item.productId,
                                    quantity: item.quantity,
                                    batchNumber: `BAT-${format(currentDate, 'yyMMdd')}-${getRandomInt(100, 999)}`,
                                    expiryDate: expiryDate
                                };
                            })
                        }
                    },
                    include: { items: true }
                });

                await prisma.order.update({
                    where: { id: receipt.poId },
                    data: { status: 'COMPLETED' }
                });

                for (const item of grn.items) {
                    const prod = tenant.products.find(p => p.id === item.productId);
                    if (!prod) continue;

                    const batch = await prisma.productBatch.create({
                        data: {
                            batchNumber: item.batchNumber!,
                            productId: item.productId,
                            quantityReceived: item.quantity,
                            quantityAvailable: item.quantity,
                            costPrice: prod.costPrice,
                            expiryDate: item.expiryDate,
                            inwardDate: currentDate,
                            status: 'ACTIVE'
                        }
                    });

                    if (!batchCache[tenant.id][item.productId]) batchCache[tenant.id][item.productId] = [];
                    batchCache[tenant.id][item.productId].push({
                        id: batch.id,
                        batchNumber: batch.batchNumber,
                        quantity: item.quantity,
                        expiry: item.expiryDate
                    });

                    stockCache[tenant.id][item.productId] = (stockCache[tenant.id][item.productId] || 0) + item.quantity;

                    // Stock Ledger (INWARD)
                    await prisma.stockLedger.create({
                        data: {
                            productId: item.productId,
                            batchId: batch.id,
                            transactionType: 'INWARD',
                            referenceType: 'GRN',
                            referenceId: grn.id,
                            quantityIn: item.quantity,
                            quantityOut: 0,
                            balanceQuantity: stockCache[tenant.id][item.productId],
                            transactionDate: currentDate,
                            tenantId: tenant.id
                        }
                    });

                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { increment: item.quantity } }
                    });

                    await prisma.stock.upsert({
                        where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: item.productId, batchNumber: batch.batchNumber } },
                        update: { quantity: { increment: item.quantity } },
                        create: {
                            warehouseId: warehouse.id,
                            productId: item.productId,
                            batchNumber: batch.batchNumber,
                            quantity: item.quantity,
                            expiryDate: item.expiryDate
                        }
                    });
                }
            }


            // --- C. SALES LOGIC (Afternoon) ---
            let salesCount = getRandomInt(4, 12);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            if (isWeekend) salesCount += getRandomInt(2, 5);

            for (let i = 0; i < salesCount; i++) {
                const customer = getRandomItem(tenant.customers);

                const numItems = getRandomInt(1, 5);
                const salesItems = [];

                for (let j = 0; j < numItems; j++) {
                    const product = getRandomItem(tenant.products);

                    const currentStock = stockCache[tenant.id][product.id] || 0;
                    if (currentStock <= 0) continue;

                    const qty = getRandomInt(1, Math.min(3, currentStock));

                    salesItems.push({
                        product,
                        quantity: qty,
                        price: product.price
                    });

                    stockCache[tenant.id][product.id] -= qty;
                }

                if (salesItems.length === 0) continue;

                const taxRate = 0.10;
                const subTotal = salesItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
                const taxAmount = subTotal * taxRate;
                const totalAmount = subTotal + taxAmount;

                const sale = await prisma.sale.create({
                    data: {
                        invoiceNo: `INV-${format(currentDate, 'yyMM')}-${getRandomInt(10000, 99999)}`,
                        totalAmount: totalAmount,
                        taxAmount: taxAmount,
                        cgstAmount: taxAmount / 2,
                        sgstAmount: taxAmount / 2,
                        customerId: customer?.id,
                        tenantId: tenant.id,
                        status: 'COMPLETED',
                        createdAt: currentDate,
                        updatedAt: currentDate
                    }
                });

                for (const item of salesItems) {
                    const batches = batchCache[tenant.id][item.product.id] || [];
                    let remQty = item.quantity;

                    for (const batch of batches) {
                        if (remQty <= 0) break;
                        if (batch.quantity <= 0) continue;

                        const allocQty = Math.min(remQty, batch.quantity);

                        // DB Update Batch
                        await prisma.productBatch.update({
                            where: { id: batch.id },
                            data: { quantityAvailable: { decrement: allocQty } }
                        });

                        // Update In-Memory Batch
                        batch.quantity -= allocQty;

                        // Create SaleItem
                        await prisma.saleItem.create({
                            data: {
                                saleId: sale.id,
                                productId: item.product.id,
                                quantity: allocQty,
                                unitPrice: item.price,
                                taxAmount: (item.price * allocQty) * taxRate,
                                batchId: batch.id
                            }
                        });

                        // Create SalesRegister
                        await prisma.salesRegister.create({
                            data: {
                                invoiceId: sale.id,
                                productId: item.product.id,
                                batchId: batch.id,
                                quantitySold: allocQty,
                                stockBefore: stockCache[tenant.id][item.product.id] + remQty,
                                stockAfter: stockCache[tenant.id][item.product.id] + (remQty - allocQty),
                                tenantId: tenant.id,
                                transactionTimestamp: currentDate
                            }
                        });

                        // Stock Ledger
                        await prisma.stockLedger.create({
                            data: {
                                productId: item.product.id,
                                batchId: batch.id,
                                transactionType: 'SALE',
                                referenceType: 'INVOICE',
                                referenceId: sale.id,
                                quantityIn: 0,
                                quantityOut: allocQty,
                                balanceQuantity: stockCache[tenant.id][item.product.id],
                                transactionDate: currentDate,
                                tenantId: tenant.id
                            }
                        });

                        // Update Warehouse Stock (Specific Batch using batchNumber)
                        await prisma.stock.updateMany({
                            where: {
                                warehouseId: warehouse.id,
                                productId: item.product.id,
                                batchNumber: batch.batchNumber // Corrected
                            },
                            data: { quantity: { decrement: allocQty } }
                        });

                        remQty -= allocQty;
                    }

                    // Update Product Aggregate
                    await prisma.product.update({
                        where: { id: item.product.id },
                        data: { stockQuantity: { decrement: item.quantity } }
                    });
                }

                await prisma.payment.create({
                    data: {
                        amount: totalAmount,
                        method: getRandomItem(['CASH', 'CARD', 'UPI']),
                        type: 'RECEIVABLE',
                        saleId: sale.id,
                        tenantId: tenant.id,
                        createdAt: currentDate
                    }
                });

                totalSales++;
            }
        }

        currentDate = addDays(currentDate, 1);
    }

    console.log(`✅ Seeding Complete! Generated ${totalSales} sales and ${totalPOs} POs.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
