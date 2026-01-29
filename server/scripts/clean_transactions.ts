
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning Transaction Data...');

    // Order matters for Foreign Keys
    await prisma.stockLedger.deleteMany({});
    await prisma.salesRegister.deleteMany({});
    await prisma.saleItem.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.sale.deleteMany({});

    await prisma.goodsReceiptItem.deleteMany({});
    await prisma.goodsReceipt.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});

    // We also need to reset Stock and Batch?
    // Batches created during seeding have specific IDs/Numbers.
    await prisma.productBatch.deleteMany({});
    await prisma.stock.deleteMany({});

    // Reset Product Stock Levels to 100 (default from seed_real_world_data)
    await prisma.product.updateMany({
        data: { stockQuantity: 100 }
    });

    console.log('✨ Data Cleaned!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
