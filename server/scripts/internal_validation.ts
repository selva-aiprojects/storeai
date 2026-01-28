import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runSystemValidation() {
    console.log('\n🔵 STARTING SYSTEM VALIDATION SUITE (SVS) - INTERNAL\n');

    try {
        // 1. INVENTORY MODULE
        console.log("Testing SUPPLY CHAIN Module...");
        const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });
        if (!warehouse) throw new Error("Default Warehouse missing");
        console.log(`✅ Warehouse Identified: ${warehouse.name}`);

        const category = await prisma.category.findFirst();
        if (!category) throw new Error("No categories found in DB.");

        const product = await prisma.product.create({
            data: {
                name: `Test Artifact ${Date.now()}`,
                sku: `TEST-${Date.now()}`,
                price: 1000,
                costPrice: 600,
                categoryId: category.id,
                tenantId: warehouse.tenantId
            }
        });
        console.log(`✅ Created Product: ${product.name}`);

        // 2. STOCK TRANSITIONS
        await prisma.stock.upsert({
            where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: product.id, batchNumber: 'GENERAL' } },
            update: { quantity: { increment: 50 } },
            create: { warehouseId: warehouse.id, productId: product.id, quantity: 50, batchNumber: 'GENERAL' }
        });
        console.log(`✅ Stock Initialized: 50 Units`);

        // 3. CRM MODULE
        console.log("\nTesting CRM Module...");
        const deal = await prisma.deal.create({
            data: {
                title: "Validation Deal",
                value: 50000,
                stage: "NEGOTIATION",
                probability: 70,
                tenantId: warehouse.tenantId
            }
        });
        console.log(`✅ Deal Created: ${deal.title}`);

        await prisma.deal.update({ where: { id: deal.id }, data: { stage: 'WON', probability: 100 } });
        console.log(`✅ Pipeline transition: NEGOTIATION -> WON`);

        // 4. SALES & DEDUCTION
        console.log("\nTesting COMMERCE & FINANCE Module...");
        const sale = await prisma.sale.create({
            data: {
                invoiceNo: `INV-VAL-${Date.now()}`,
                totalAmount: 2000,
                taxAmount: 0,
                discountAmount: 0,
                status: 'DELIVERED',
                tenantId: warehouse.tenantId,
                items: {
                    create: { productId: product.id, quantity: 2, unitPrice: 1000 }
                }
            }
        });
        console.log(`✅ Sale Executed: ${sale.invoiceNo}`);

        await prisma.stock.update({
            where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: product.id, batchNumber: 'GENERAL' } },
            data: { quantity: { decrement: 2 } }
        });

        const finalStock = await prisma.stock.findUnique({ where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: product.id, batchNumber: 'GENERAL' } } });
        if (finalStock?.quantity === 48) console.log(`✅ Stock Deduction Verified: 48 Units Remaining`);
        else throw new Error(`Stock Mismatch: Got ${finalStock?.quantity}`);

        console.log("\n🟢 SYSTEM VALIDATION COMPLETE: ALL MODULES GREEN");

    } catch (e: any) {
        console.error(`❌ CRITICAL FAILURE: ${e.message}`);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runSystemValidation();
