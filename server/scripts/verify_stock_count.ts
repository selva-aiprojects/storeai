import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyStock() {
    const products = await prisma.product.count({ where: { isDeleted: false } });
    const stocks = await prisma.stock.count();
    const headers = await prisma.stock.findFirst();

    console.log(`Verified: ${products} Products vs ${stocks} Stock Records.`);
    if (stocks < products) {
        console.log('WARNING: Stock records are fewer than products!');
    } else {
        console.log('SUCCESS: Stock records exist.');
    }
}

verifyStock();
