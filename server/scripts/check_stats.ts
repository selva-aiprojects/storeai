
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.count();
    const sales = await prisma.sale.count();
    const ledgers = await prisma.stockLedger.count();
    console.log(`Orders: ${orders}`);
    console.log(`Sales: ${sales}`);
    console.log(`StockLedger: ${ledgers}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
