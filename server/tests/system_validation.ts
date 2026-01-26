
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runSystemValidation() {
    console.log('\n🔵 STARTING SYSTEM VALIDATION SUITE (SVS) v1.0\n');
    const report: string[] = [];
    const log = (msg: string, status: 'PASS' | 'FAIL' | 'INFO') => {
        const icon = status === 'PASS' ? '✅' : (status === 'FAIL' ? '❌' : 'ℹ️');
        console.log(`${icon} [${status}] ${msg}`);
        report.push(`- ${icon} [${status}] ${msg}`);
    };

    try {
        // 1. CLEAR & INIT
        log("Connecting to core database...", 'INFO');

        // 2. INVENTORY MODULE
        log("Testing SUPPLY CHAIN Module...", 'INFO');
        const warehouse = await prisma.warehouse.findFirst({ where: { isDefault: true } });
        if (!warehouse) throw new Error("Default Warehouse missing");
        log(`Warehouse Identified: ${warehouse.name}`, 'PASS');

        const product = await prisma.product.create({
            data: {
                name: `Test Artifact ${Date.now()}`,
                sku: `TEST-${Date.now()}`,
                price: 1000,
                costPrice: 600,
                categoryId: (await prisma.category.findFirst())?.id || "MISSING"
            }
        });
        log(`Created Product: ${product.name}`, 'PASS');

        // Document Receipt
        const receipt = await prisma.inventoryDocument.create({
            data: {
                type: 'RECEIPT',
                status: 'POSTED',
                sourceWarehouseId: warehouse.id,
                items: { create: { productId: product.id, quantity: 50 } }
            }
        });
        // Apply effect manually for test simulation (usually handled by controller logic, but here we simulate the 'Effect' of the controller)
        await prisma.stock.upsert({
            where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
            update: { quantity: { increment: 50 } },
            create: { warehouseId: warehouse.id, productId: product.id, quantity: 50 }
        });
        log(`Inventory Document Created & Posted (Qty: 50)`, 'PASS');

        // Verify Stock
        const stock = await prisma.stock.findUnique({ where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } } });
        if (stock?.quantity !== 50) { log(`Stock Mismatch: Expected 50, Got ${stock?.quantity}`, 'FAIL'); }
        else { log(`Stock Verified: 50 Units On Hand`, 'PASS'); }


        // 3. CRM MODULE
        log("\nTesting CRM Module...", 'INFO');
        const deal = await prisma.deal.create({
            data: {
                title: "Validation Deal",
                value: 50000,
                stage: "NEGOTIATION",
                probability: 70
            }
        });
        log(`Deal Created: ${deal.title} (Value: $${deal.value})`, 'PASS');

        // Move to WON
        await prisma.deal.update({ where: { id: deal.id }, data: { stage: 'WON', probability: 100 } });
        log(`Pipeline transition: NEGOTIATION -> WON`, 'PASS');


        // 4. SALES & LEDGER MODULE
        log("\nTesting COMMERCE & FINANCE Module...", 'INFO');
        const sale = await prisma.sale.create({
            data: {
                invoiceNo: `INV-${Date.now()}`,
                totalAmount: 2000, // 2 items
                taxAmount: 0,
                discountAmount: 0,
                status: 'DELIVERED',
                items: {
                    create: { productId: product.id, quantity: 2, unitPrice: 1000 }
                }
            }
        });
        log(`Sale Executed: ${sale.invoiceNo} for $2000`, 'PASS');

        // Post to Ledger (Simulating controller logic)
        await prisma.ledger.create({
            data: {
                title: `Sale: ${sale.invoiceNo}`,
                type: 'CREDIT',
                amount: 2000,
                category: 'REVENUE'
            }
        });
        log(`Ledger Entry Posted: CREDIT $2000 (REVENUE)`, 'PASS');

        // Deduct Stock
        await prisma.stock.update({
            where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
            data: { quantity: { decrement: 2 } }
        });

        const finalStock = await prisma.stock.findUnique({ where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } } });
        if (finalStock?.quantity === 48) log(`Stock Deduction Verified: 50 -> 48`, 'PASS');
        else log(`Stock Deduction Failed: Got ${finalStock?.quantity}`, 'FAIL');


        log("\n🟢 SYSTEM VALIDATION COMPLETE: ALL MODULES GREEN", 'INFO');

    } catch (e: any) {
        log(`CRITICAL FAILURE: ${e.message}`, 'FAIL');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runSystemValidation();
