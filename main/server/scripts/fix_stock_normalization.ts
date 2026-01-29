import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStockNormalization() {
    console.log('--- STARTING STOCK NORMALIZATION REPAIR ---');

    try {
        const tenants = await prisma.tenant.findMany();
        console.log(`Found ${tenants.length} tenants.`);

        for (const tenant of tenants) {
            console.log(`Processing Tenant: ${tenant.name}`);

            // 1. Get Default Warehouse
            let warehouse = await prisma.warehouse.findFirst({
                where: { tenantId: tenant.id, isDefault: true }
            });

            if (!warehouse) {
                console.log(`- No default warehouse. Creating one.`);
                warehouse = await prisma.warehouse.create({
                    data: {
                        name: 'Main Warehouse',
                        location: 'HQ',
                        isDefault: true,
                        tenantId: tenant.id
                    }
                });
            }

            // 2. Get All Products
            const products = await prisma.product.findMany({
                where: { tenantId: tenant.id, isDeleted: false }
            });

            console.log(`- syncing ${products.length} products to Stock table...`);

            for (const p of products) {
                // Check if stock entry exists
                const stock = await prisma.stock.findFirst({
                    where: { productId: p.id, warehouseId: warehouse.id }
                });

                if (!stock) {
                    await prisma.stock.create({
                        data: {
                            productId: p.id,
                            warehouseId: warehouse.id,
                            quantity: p.stockQuantity,
                            batchNumber: 'GENERAL'
                        }
                    });
                    process.stdout.write('+');
                } else {
                    // Normalize: If stock exists, does it match?
                    // Strategy: If Product.stockQuantity > 0 and Stock is 0/missing, trust Product.
                    if (p.stockQuantity !== stock.quantity) {
                        await prisma.stock.update({
                            where: { id: stock.id },
                            data: { quantity: p.stockQuantity }
                        });
                        process.stdout.write('~');
                    } else {
                        process.stdout.write('.');
                    }
                }
            }
            console.log('\n- Sync complete.');
        }

        console.log('--- REPAIR COMPLETE ---');

    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixStockNormalization();
