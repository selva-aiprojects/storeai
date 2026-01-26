import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedTest() {
    console.log('--- SYSTEM TEST INITIALIZED ---');

    // 1. Ensure Category exists
    const category = await prisma.category.upsert({
        where: { name: 'Electronics' },
        update: {},
        create: { name: 'Electronics', description: 'Tech artifacts' }
    });
    console.log('✔ Category Verified');

    // 2. Ensure Product exists
    const product = await prisma.product.upsert({
        where: { sku: 'PRO-TEST-001' },
        update: {},
        create: {
            sku: 'PRO-TEST-001',
            name: 'Neural Link Terminal',
            price: 1500,
            costPrice: 900,
            stockQuantity: 50,
            categoryId: category.id,
            lowStockThreshold: 10,
            avgDailySales: 2.5,
            leadTimeDays: 5
        }
    });
    console.log('✔ Product Catalogued');

    // 3. Create a Sale (Account Receivable)
    const sale = await prisma.sale.create({
        data: {
            invoiceNo: `INV-${Date.now()}`,
            totalAmount: 1500,
            taxAmount: 0,
            items: {
                create: {
                    productId: product.id,
                    quantity: 1,
                    unitPrice: 1500
                }
            }
        }
    });

    await prisma.payment.create({
        data: {
            amount: 1500,
            method: 'CARD',
            type: 'RECEIVABLE',
            transactionId: `TX-SALE-${Date.now()}`,
            saleId: sale.id
        }
    });

    await prisma.ledger.create({
        data: {
            title: 'Sales Revenue - Neural Link',
            type: 'CREDIT',
            amount: 1500,
            category: 'RECEIVABLE',
            description: `Invoice: ${sale.invoiceNo}`
        }
    });
    console.log('✔ Sale Transaction Committed (+$1500)');

    // 4. Create a Payable Entry (e.g., Electricity Bill)
    await prisma.payment.create({
        data: {
            amount: 200,
            method: 'TRANSFER',
            type: 'PAYABLE',
            transactionId: `TX-EXP-${Date.now()}`
        }
    });

    await prisma.ledger.create({
        data: {
            title: 'Operational Expense: Utilities',
            type: 'DEBIT',
            amount: 200,
            category: 'PAYABLE',
            description: 'Monthly utility protocol'
        }
    });
    console.log('✔ Expense Registered (-$200)');

    console.log('--- TEST TRANSACTION COMPLETE ---');
    console.log('Expected Net Balance: $1300');
}

seedTest()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
