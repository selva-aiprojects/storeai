
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
    console.log('🧹 Clearing transaction data for fresh seed...');
    try {
        await prisma.stockLedger.deleteMany({});
        await prisma.saleItem.deleteMany({});
        await prisma.sale.deleteMany({});
        await prisma.goodsReceiptItem.deleteMany({});
        await prisma.goodsReceipt.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.productBatch.deleteMany({});
        await prisma.stock.deleteMany({});
        console.log('✅ Data cleared.');
    } catch (e) {
        console.error('❌ Error clearing data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

clearData();
