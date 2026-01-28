import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemoData() {
    console.log('🚀 SEEDING DEMO DATA FOR ARCHITECTURAL VALIDATION...');

    const hashedPassword = await bcrypt.hash('DemoPassword123!', 10);
    const tenantId = 'storeai'; // Target the main tenant from seed.ts

    // 1. Fetch Tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantId } });
    if (!tenant) {
        console.error('❌ Tenant "storeai" not found. Run main seed first.');
        return;
    }

    // 2. Create Role-Specific Users
    const roles = await prisma.role.findMany();
    const procurementRole = roles.find(r => r.code === 'PROCUREMENT_TEAM');
    const salesRole = roles.find(r => r.code === 'SALES_TEAM');
    const hrRole = roles.find(r => r.code === 'HR_TEAM');

    const users = [
        { email: 'procure@storeai.com', first: 'Peter', last: 'Buyer', role: procurementRole },
        { email: 'sales@storeai.com', first: 'Sarah', last: 'Seller', role: salesRole },
        { email: 'hr@storeai.com', first: 'Helen', last: 'Human', role: hrRole }
    ];

    for (const u of users) {
        if (!u.role) continue;
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { password: hashedPassword },
            create: {
                email: u.email,
                password: hashedPassword,
                firstName: u.first,
                lastName: u.last,
                role: 'STAFF'
            }
        });

        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
            update: { roleId: u.role.id },
            create: {
                userId: user.id,
                tenantId: tenant.id,
                roleId: u.role.id
            }
        });
        console.log(`✅ Created User: ${u.email} [${u.role.code}]`);
    }

    // 3. Create Diverse Products & Batches (FIFO Scenarios)
    const category = await prisma.category.findFirst({ where: { tenantId: tenant.id } });
    const warehouse = await prisma.warehouse.findFirst({ where: { tenantId: tenant.id } });

    if (!category || !warehouse) {
        console.error('❌ Category or Warehouse missing.');
        return;
    }

    const demoProducts = [
        { sku: 'QNT-PXL-PRO-256', name: 'Quantum Pixel Pro - 256GB Platinum', price: 1499.00, cost: 950.00 },
        { sku: 'ENT-INF-HUB-X1', name: 'Enterprise Infrastructure Hub X1', price: 2999.00, cost: 1800.00 }
    ];

    for (const p of demoProducts) {
        const prod = await prisma.product.upsert({
            where: { tenantId_sku: { sku: p.sku, tenantId: tenant.id } },
            update: { stockQuantity: 100 },
            create: {
                sku: p.sku,
                name: p.name,
                price: p.price,
                costPrice: p.cost,
                stockQuantity: 100,
                categoryId: category.id,
                tenantId: tenant.id,
                isBatchTracked: true,
                unit: 'PCS'
            }
        });

        // Add 3 batches with different expiries
        const expiries = [
            { no: 'B-EXP-01', days: -5, qty: 10 },  // Expired
            { no: 'B-EXP-02', days: 15, qty: 30 },  // Risk (30D)
            { no: 'B-EXP-03', days: 120, qty: 60 }  // Safe
        ];

        for (const batch of expiries) {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + batch.days);

            // Check if batch exists
            const existingBatch = await prisma.productBatch.findUnique({
                where: { productId_batchNumber: { productId: prod.id, batchNumber: batch.no } }
            });

            if (!existingBatch) {
                await prisma.productBatch.create({
                    data: {
                        productId: prod.id,
                        batchNumber: batch.no,
                        quantityReceived: batch.qty,
                        quantityAvailable: batch.qty,
                        expiryDate: expDate,
                        costPrice: p.cost,
                        status: 'ACTIVE'
                    }
                });
            }
        }
        console.log(`✅ Created Product: ${p.name} with 3 test batches.`);
    }

    console.log('✔ DEMO DATA SEEDING COMPLETE');
}

seedDemoData().catch(console.error).finally(() => prisma.$disconnect());
