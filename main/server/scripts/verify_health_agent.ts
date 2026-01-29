
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🧐 Verifying Auto-Draft POs...');

    // Find recent DRAFT orders
    const drafts = await prisma.order.findMany({
        where: {
            status: 'DRAFT',
            approvalStatus: 'PENDING',
            orderNumber: { startsWith: 'AUTO-PO' }
        },
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (drafts.length > 0) {
        console.log(`✅ Found ${drafts.length} Auto-Drafted POs:`);
        drafts.forEach(d => {
            console.log(`   - ${d.orderNumber} | Supplier: ${d.supplier.name}`);
            d.items.forEach(i => {
                console.log(`     * Item: ${i.product.name} (Qty: ${i.quantity})`);
            });
        });
    } else {
        console.error('❌ No Auto-Draft POs found!');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
