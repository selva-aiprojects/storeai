import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Enterprise Seeding...');

    // 1. Categories
    const electronics = await prisma.category.upsert({
        where: { name: 'High-Performance Computing' },
        update: {},
        create: { name: 'High-Performance Computing', description: 'Advanced workstations, servers, and processing units.' }
    });

    const networking = await prisma.category.upsert({
        where: { name: 'Network Infrastructure' },
        update: {},
        create: { name: 'Network Infrastructure', description: 'Enterprise-grade routing, switching, and fiber optics.' }
    });

    // 2. Suppliers
    const nexa = await prisma.supplier.create({
        data: {
            name: 'NexaCorp Solutions',
            contact: 'Marcus Vance',
            email: 'm.vance@nexacorp.global',
            address: 'Sky Tower 4, Silicon Valley, CA'
        }
    });

    // 3. Products
    const p1 = await prisma.product.create({
        data: {
            sku: 'SRV-QN-900',
            name: 'Quantum Node 900 Server',
            price: 12500,
            costPrice: 9800,
            stockQuantity: 15,
            categoryId: electronics.id
        }
    });

    const p2 = await prisma.product.create({
        data: {
            sku: 'SW-10G-PRO',
            name: 'Titan 10G Fiber Switch',
            price: 3400,
            costPrice: 2100,
            stockQuantity: 4,
            categoryId: networking.id
        }
    });

    // 4. Sample Sale
    await prisma.sale.create({
        data: {
            invoiceNo: 'INV-SAMPLE-001',
            totalAmount: 15900,
            taxAmount: 0,
            items: {
                create: [
                    { productId: p1.id, quantity: 1, unitPrice: 12500 },
                    { productId: p2.id, quantity: 1, unitPrice: 3400 }
                ]
            }
        }
    });

    console.log('✅ Strategic Seeding Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
