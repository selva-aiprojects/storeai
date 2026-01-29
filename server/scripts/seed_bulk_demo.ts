
import { PrismaClient } from '@prisma/client';
import { addDays, subDays, format, isBefore } from 'date-fns';

const prisma = new PrismaClient();

// Configuration
const DAYS_OF_HISTORY = 365;
const START_DATE = subDays(new Date(), DAYS_OF_HISTORY);
const END_DATE = new Date();

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log('🚀 Starting BULK HYPER-SEEDING for AI Intelligence Demo...');

    const tenants = await prisma.tenant.findMany({
        where: { slug: { not: 'storeai' } },
        include: {
            products: true,
            customers: true,
            suppliers: true,
            warehouses: true
        }
    });

    for (const tenant of tenants) {
        console.log(`📦 Processing Tenant: ${tenant.name}`);
        const warehouse = tenant.warehouses[0] || await prisma.warehouse.create({
            data: { name: 'Main', location: 'HQ', isDefault: true, tenantId: tenant.id }
        });

        if (tenant.products.length === 0 || tenant.customers.length === 0 || tenant.suppliers.length === 0) {
            console.log(`⚠️ Skipping ${tenant.name} - Missing master data (products/customers/suppliers)`);
            continue;
        }

        const salesToCreate: any[] = [];
        const orderToCreate: any[] = [];

        let currentDate = START_DATE;

        // 1. Initial Inventory Inward (Bulk)
        console.log(`Inventory: Injecting initial stock for ${tenant.products.length} products...`);
        const initBatchData = tenant.products.map(p => ({
            batchNumber: 'INIT-BATCH',
            productId: p.id,
            quantityReceived: 500,
            quantityAvailable: 500,
            costPrice: p.costPrice,
            status: 'ACTIVE'
        }));

        for (const batch of initBatchData) {
            await prisma.productBatch.upsert({
                where: { productId_batchNumber: { productId: batch.productId, batchNumber: 'INIT-BATCH' } },
                update: { quantityAvailable: 500 },
                create: batch
            });
        }

        // 2. Generate Transaction Data in Memory
        console.log(`Logic: Simulating 365 days of activity...`);
        while (isBefore(currentDate, addDays(END_DATE, 1))) {
            // Random POs
            if (getRandomInt(1, 10) === 1) {
                const supplier = getRandomItem(tenant.suppliers);
                const randomProducts = tenant.products.slice(0, 3);
                orderToCreate.push({
                    orderNumber: `PO-${Date.now()}-${getRandomInt(1000, 9999)}`,
                    status: 'RECEIVED',
                    totalAmount: 5000,
                    supplierId: supplier.id,
                    tenantId: tenant.id,
                    createdAt: new Date(currentDate)
                });
            }

            // Random Sales
            const dailySalesCount = getRandomInt(10, 25);
            for (let i = 0; i < dailySalesCount; i++) {
                const customer = getRandomItem(tenant.customers);
                const product = getRandomItem(tenant.products);
                const qty = getRandomInt(1, 5);
                const total = qty * product.price;

                salesToCreate.push({
                    invoiceNo: `INV-${currentDate.getTime()}-${i}-${getRandomInt(100, 999)}`,
                    totalAmount: total,
                    taxAmount: total * 0.1,
                    status: 'COMPLETED',
                    customerId: customer.id,
                    tenantId: tenant.id,
                    createdAt: new Date(currentDate)
                });
            }
            currentDate = addDays(currentDate, 1);
        }

        // 3. MASSIVE BULK INSERT
        console.log(`Database: Flushing ${salesToCreate.length} sales to DB...`);
        // Prisma doesn't support createMany for nested, so we use loop but skip await in a clever way or use chunks
        const CHUNK_SIZE = 100;
        for (let i = 0; i < salesToCreate.length; i += CHUNK_SIZE) {
            const chunk = salesToCreate.slice(i, i + CHUNK_SIZE);
            await prisma.sale.createMany({ data: chunk });
        }

        console.log(`Database: Flushing ${orderToCreate.length} purchase orders...`);
        for (let i = 0; i < orderToCreate.length; i += CHUNK_SIZE) {
            const chunk = orderToCreate.slice(i, i + CHUNK_SIZE);
            await prisma.order.createMany({ data: chunk });
        }
    }

    console.log('✅ BULK HYPER-SEEDING COMPLETE. System ready for AI Analysis.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
