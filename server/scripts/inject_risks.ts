
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('💉 Injecting Synthetic Risks...');

    // 1. Create LOW STOCK Risk
    // Find a product
    const product = await prisma.product.findFirst();
    if (product) {
        console.log(`📉 Setting Low Stock for: ${product.name}`);
        await prisma.product.update({
            where: { id: product.id },
            data: { stockQuantity: 2, reorderPoint: 10 }
        });
    }

    // 2. Create EXPIRY Risk
    // Find a batch
    const batch = await prisma.productBatch.findFirst({
        where: { quantityAvailable: { gt: 0 } },
        include: { product: true }
    });

    if (batch) {
        console.log(`☣️ Setting Near Expiry for: ${batch.product.name} (Batch: ${batch.batchNumber})`);
        const expiry = addDays(new Date(), 3); // Expires in 3 days
        await prisma.productBatch.update({
            where: { id: batch.id },
            data: { expiryDate: expiry }
        });
    }

    console.log('✅ Risks Injected!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
