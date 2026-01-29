
import { PrismaClient } from '@prisma/client';
import { addDays, subDays, format, isBefore } from 'date-fns';
// Use built-in crypto for UUIDs
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

const DAYS_OF_HISTORY = 365;
const START_DATE = subDays(new Date(), DAYS_OF_HISTORY);
const END_DATE = new Date();

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function chunkInsert(model: any, data: any[]) {
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await model.createMany({ data: chunk, skipDuplicates: true });
    }
}

async function main() {
    console.log('🚀 TURBO Seeding: Final Reliable Pass...');

    let tenants = await prisma.tenant.findMany({
        include: { products: true, customers: true, suppliers: true, warehouses: true }
    });
    tenants = tenants.filter(t => t.products.length > 0 && t.customers.length > 0);

    const allProductBatches: any[] = [];
    const allSales: any[] = [];
    const allSaleItems: any[] = [];
    const allStockLedgers: any[] = [];
    const productToBatchMap: Record<string, string> = {};

    // 1. Create a master batch for every product
    console.log('📦 Preparing Master Batches...');
    for (const tenant of tenants) {
        for (const p of tenant.products) {
            const batchId = randomUUID();
            productToBatchMap[p.id] = batchId;
            allProductBatches.push({
                id: batchId,
                batchNumber: 'INIT-STOCK',
                productId: p.id,
                quantityReceived: 100000,
                quantityAvailable: 100000,
                costPrice: p.costPrice,
                status: 'ACTIVE',
                inwardDate: START_DATE
            });
        }
    }

    // 2. Generate Sales
    console.log('⏳ Generating 365 days of sales data...');
    let currentDate = START_DATE;
    while (isBefore(currentDate, addDays(END_DATE, 1))) {
        for (const tenant of tenants) {
            const salesCount = getRandomInt(10, 20);
            for (let i = 0; i < salesCount; i++) {
                const customer = getRandomItem(tenant.customers);
                const product = getRandomItem(tenant.products);
                const qty = getRandomInt(1, 4);
                const saleId = randomUUID();
                const batchId = productToBatchMap[product.id];
                const total = qty * product.price;

                allSales.push({
                    id: saleId,
                    invoiceNo: `INV-${format(currentDate, 'yyyyMMdd')}-${i}-${randomUUID().slice(0, 4)}`,
                    totalAmount: total,
                    taxAmount: total * 0.18,
                    status: 'COMPLETED',
                    customerId: customer.id,
                    tenantId: tenant.id,
                    createdAt: currentDate,
                    updatedAt: currentDate
                });

                allSaleItems.push({
                    id: randomUUID(),
                    saleId: saleId,
                    productId: product.id,
                    quantity: qty,
                    unitPrice: product.price,
                    batchId: batchId,
                    taxAmount: total * 0.18
                });

                allStockLedgers.push({
                    id: randomUUID(),
                    productId: product.id,
                    batchId: batchId,
                    transactionType: 'SALE',
                    referenceType: 'INV',
                    referenceId: saleId,
                    quantityOut: qty,
                    balanceQuantity: 1000, // Dummy balance
                    transactionDate: currentDate,
                    tenantId: tenant.id
                });
            }
        }
        currentDate = addDays(currentDate, 1);
    }

    console.log('✅ Simulation Complete. Writing to DB...');

    console.log(' - Batches...');
    await chunkInsert(prisma.productBatch, allProductBatches);

    console.log(' - Sales...');
    await chunkInsert(prisma.sale, allSales);

    console.log(' - Sale Items...');
    await chunkInsert(prisma.saleItem, allSaleItems);

    console.log(' - Stock Ledger...');
    await chunkInsert(prisma.stockLedger, allStockLedgers);

    console.log('🏁 DATA READY FOR DEMO!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
