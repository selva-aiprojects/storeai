
import { PrismaClient } from '@prisma/client';
import { addDays, subDays, format, isBefore } from 'date-fns';

const prisma = new PrismaClient();

// Configuration
const DAYS_OF_HISTORY = 365;
const START_DATE = subDays(new Date(), DAYS_OF_HISTORY);
const END_DATE = new Date();

// Helpers
function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Main Seeding Function
async function main() {
    console.log('🚀 Starting FAST Transaction Data Seeding...');
    console.log(`📅 Period: ${format(START_DATE, 'yyyy-MM-dd')} to ${format(END_DATE, 'yyyy-MM-dd')}`);

    // Load Data
    let tenants = await prisma.tenant.findMany({
        include: {
            products: { include: { category: true } },
            customers: true,
            suppliers: true,
            warehouses: true
        }
    });

    tenants = tenants.filter(t => t.products.length > 0 && t.suppliers.length > 0 && t.customers.length > 0);
    console.log(`ℹ️ Simulating for ${tenants.length} tenants.`);

    // In-Memory state
    const stockCache: Record<string, Record<string, number>> = {};
    const batchCache: Record<string, Record<string, { id: string, batchNumber: string, quantity: number, expiry: Date | null }[]>> = {};

    // Initialization
    for (const tenant of tenants) {
        if (tenant.warehouses.length === 0) {
            const wh = await prisma.warehouse.create({
                data: { name: 'Main', location: 'HQ', isDefault: true, tenantId: tenant.id }
            });
            tenant.warehouses.push(wh);
        }
        stockCache[tenant.id] = {};
        batchCache[tenant.id] = {};

        // Optimize: Batch Initial Stock? No, just set logic
        // We assume start at 0 or low, let POs fill it up.
        for (const p of tenant.products) {
            stockCache[tenant.id][p.id] = 50; // Start with some stock to avoid immediate blocking
            // Create a dummy initial batch in DB?
            // For speed, let's just create one generic initial batch for everyone
            const initialBatch = await prisma.productBatch.upsert({
                where: {
                    productId_batchNumber: {
                        productId: p.id,
                        batchNumber: 'INIT-BATCH'
                    }
                },
                update: {},
                create: {
                    batchNumber: 'INIT-BATCH',
                    productId: p.id,
                    quantityReceived: 1000,
                    quantityAvailable: 1000, // Infinite initial stock basically
                    costPrice: p.costPrice,
                    status: 'ACTIVE'
                }
            });
            batchCache[tenant.id][p.id] = [{
                id: initialBatch.id,
                batchNumber: 'INIT-BATCH',
                quantity: 1000,
                expiry: null
            }];
        }
    }

    let currentDate = START_DATE;
    let pendingReceipts: any[] = [];

    // BATCH CONTAINERS
    // specific types not strictly needed for JS/TS unless strict

    while (isBefore(currentDate, addDays(END_DATE, 1))) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (currentDate.getDate() === 1) console.log(`⏳ Processing Month: ${format(currentDate, 'MMM yyyy')}`);

        // We will collect all daily inserts here to run in parallel
        const dailyPromises: Promise<any>[] = [];

        for (const tenant of tenants) {
            const warehouse = tenant.warehouses[0];

            // 1. PO Logic (Simplified: Check every 3 days or random)
            if (getRandomInt(1, 3) === 1) {
                // ... same logic ...
                const productsNeedingStock = tenant.products.filter(p => (stockCache[tenant.id][p.id] || 0) < 20);
                if (productsNeedingStock.length > 0) {
                    const supplier = getRandomItem(tenant.suppliers);
                    const poItems = productsNeedingStock.slice(0, 3).map(p => ({
                        productId: p.id,
                        quantity: 100, // Bulk
                        unitPrice: p.costPrice
                    }));

                    if (poItems.length > 0) {
                        // Creating PO
                        const po = await prisma.order.create({
                            data: {
                                orderNumber: `PO-${getRandomInt(100000, 999999)}`,
                                status: 'APPROVED',
                                totalAmount: poItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0),
                                supplierId: supplier.id,
                                tenantId: tenant.id,
                                createdAt: currentDate,
                                items: { create: poItems }
                            }
                        });

                        pendingReceipts.push({
                            tenantId: tenant.id,
                            poId: po.id,
                            warehouseId: warehouse.id,
                            items: poItems,
                            deliveryDate: addDays(currentDate, getRandomInt(3, 7))
                        });
                    }
                }
            }

            // 2. Receiving
            const dueReceipts = pendingReceipts.filter(r =>
                r.tenantId === tenant.id && isBefore(r.deliveryDate, addDays(currentDate, 1))
            );

            for (const receipt of dueReceipts) {
                pendingReceipts = pendingReceipts.filter(r => r !== receipt); // heavy?

                const grn = await prisma.goodsReceipt.create({
                    data: {
                        grnNumber: `GRN-${getRandomInt(100000, 999999)}`,
                        orderId: receipt.poId,
                        warehouseId: receipt.warehouseId,
                        items: {
                            create: receipt.items.map((i: any) => ({
                                productId: i.productId,
                                quantity: i.quantity,
                                batchNumber: `BAT-${getRandomInt(10000, 99999)}`
                            }))
                        }
                    },
                    include: { items: true }
                });

                // Handle batches
                for (const item of grn.items) {
                    const batch = await prisma.productBatch.create({
                        data: {
                            batchNumber: item.batchNumber!,
                            productId: item.productId,
                            quantityReceived: item.quantity,
                            quantityAvailable: item.quantity,
                            costPrice: 0,
                            inwardDate: currentDate
                        }
                    });
                    if (!batchCache[tenant.id][item.productId]) batchCache[tenant.id][item.productId] = [];
                    batchCache[tenant.id][item.productId].push({
                        id: batch.id,
                        batchNumber: batch.batchNumber,
                        quantity: item.quantity,
                        expiry: null
                    });
                    stockCache[tenant.id][item.productId] = (stockCache[tenant.id][item.productId] || 0) + item.quantity;
                }
            }

            // 3. Sales
            const salesCount = getRandomInt(5, 15);
            for (let i = 0; i < salesCount; i++) {
                const customer = getRandomItem(tenant.customers);
                const product = getRandomItem(tenant.products);
                const qty = getRandomInt(1, 4);

                // Optimistic check
                if ((stockCache[tenant.id][product.id] || 0) < qty) continue;
                stockCache[tenant.id][product.id] -= qty;

                // Fire and Forget (mostly)
                // We need batch ID, so we look at cache
                const batches = batchCache[tenant.id][product.id] || [];
                const batch = batches.find(b => b.quantity >= qty); // Simple pick first
                if (!batch) continue;
                batch.quantity -= qty;

                // Create Sale
                const total = qty * product.price;
                const sale = await prisma.sale.create({
                    data: {
                        invoiceNo: `INV-${getRandomInt(1000000, 9999999)}`,
                        totalAmount: total,
                        taxAmount: total * 0.1,
                        status: 'COMPLETED',
                        customerId: customer.id,
                        tenantId: tenant.id,
                        createdAt: currentDate,
                        items: {
                            create: {
                                productId: product.id,
                                quantity: qty,
                                unitPrice: product.price,
                                batchId: batch.id
                            }
                        }
                    }
                });

                // Sales Register & Ledger
                await prisma.stockLedger.create({
                    data: {
                        productId: product.id,
                        batchId: batch.id,
                        transactionType: 'SALE',
                        referenceType: 'INV',
                        referenceId: sale.id,
                        quantityOut: qty,
                        balanceQuantity: stockCache[tenant.id][product.id], // approx
                        transactionDate: currentDate,
                        tenantId: tenant.id
                    }
                });
            }
        }

        // WAIT for all DB ops for this DAY to finish
        // to avoid overwhelming connection pool
        // await Promise.all(dailyPromises);

        currentDate = addDays(currentDate, 1);
    }

    console.log('✅ FAST Seeding Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
