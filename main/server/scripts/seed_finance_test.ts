
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFinanceData() {
    console.log('🚀 Starting Targeted Finance Data Seeding for STOREAI CORPORATE HUB...');

    // 1. Get Tenant
    const tenantSlug = 'storeai'; // Assuming this is the slug for "StoreAI Hub Platform" from previous seed
    // If not, let's search by name or fallback
    let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

    if (!tenant) {
        // Fallback or find by name
        tenant = await prisma.tenant.findFirst({ where: { name: 'StoreAI Corporate Hub' } });
        if (!tenant) {
            // Try technova (from seed_real_world_data.ts) if storeai not found
            tenant = await prisma.tenant.findUnique({ where: { slug: 'technova' } });
        }
    }

    if (!tenant) {
        console.error('❌ Tenant not found! Please run the main seed script first.');
        return;
    }

    console.log(`✅ Using Tenant: ${tenant.name} (${tenant.id})`);

    // 2. Capital Injection
    console.log('💰 Injecting Capital...');
    await prisma.daybook.create({
        data: {
            tenantId: tenant.id,
            date: new Date(),
            type: 'CAPITAL',
            description: 'Initial Capital Investment',
            debit: 100000,
            credit: 0,
            status: 'APPROVED'
        }
    });
    console.log('✅ Capital Injected: $100,000');

    // 3. Setup Prerequisite Data (Products, Supplier, Customer)

    // Supplier
    let supplier = await prisma.supplier.findFirst({ where: { tenantId: tenant.id } });
    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: {
                tenantId: tenant.id,
                name: 'MegaCorp Suppliers',
                email: 'orders@megacorp.com',
                contact: 'John Doe',
                address: '123 Industrial Park'
            }
        });
    }

    // Customer
    let customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id } });
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                tenantId: tenant.id,
                name: 'Tech Solutions Inc',
                email: 'purchasing@techsol.com',
                phone: '555-0199',
                city: 'Metropolis',
                address: '100 Tech Blvd'
            }
        });
    }

    // Products (Create 2 distinct products)
    const productData = [
        { name: 'High-End Server Rack', sku: 'SRV-001', price: 5000, cost: 3000 },
        { name: 'Enterprise Switch', sku: 'SW-001', price: 1500, cost: 800 }
    ];

    const products = [];
    for (const p of productData) {
        const product = await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
            update: { price: p.price, costPrice: p.cost },
            create: {
                tenantId: tenant.id,
                name: p.name,
                sku: p.sku,
                price: p.price,
                costPrice: p.cost,
                categoryId: (await prisma.category.findFirst({ where: { tenantId: tenant.id } }))?.id || '',
                stockQuantity: 0 // Start with 0 to prove GRN works
            }
        });
        products.push(product);
    }

    // 0. Ensure Warehouse Exists
    let warehouse = await prisma.warehouse.findFirst({ where: { tenantId: tenant.id } });
    if (!warehouse) {
        warehouse = await prisma.warehouse.create({
            data: {
                name: 'Main Warehouse',
                location: 'HQ',
                tenantId: tenant.id,
                isDefault: true
            }
        });
    }

    // 4. Create 2 Purchase Orders & Inwards (GRN)
    console.log('📦 Processing Purchase Orders & Inwards...');

    // PO 1: 10 Servers
    const po1Qty = 10;
    const po1Total = po1Qty * products[0].costPrice;

    const po1 = await prisma.order.create({
        data: {
            tenantId: tenant.id,
            orderNumber: `PO-${Date.now()}-1`,
            supplierId: supplier.id,
            status: 'RECEIVED', // Simulate Completed GRN
            totalAmount: po1Total,
            expectedDeliveryDate: new Date(),
            items: {
                create: {
                    productId: products[0].id,
                    quantity: po1Qty,
                    unitPrice: products[0].costPrice
                }
            }
        }
    });

    // Update Stock for PO 1
    await prisma.stock.upsert({
        where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: products[0].id, batchNumber: 'GENERAL' } },
        update: { quantity: { increment: po1Qty } },
        create: { warehouseId: warehouse.id, productId: products[0].id, quantity: po1Qty, batchNumber: 'GENERAL' }
    });
    console.log(`✅ PO 1 Processed: ${po1Qty} x ${products[0].name} (Total Cost: $${po1Total}) -> Stock Updated`);

    // PO 2: 20 Switches
    const po2Qty = 20;
    const po2Total = po2Qty * products[1].costPrice;

    const po2 = await prisma.order.create({
        data: {
            tenantId: tenant.id,
            orderNumber: `PO-${Date.now()}-2`,
            supplierId: supplier.id,
            status: 'RECEIVED',
            totalAmount: po2Total,
            expectedDeliveryDate: new Date(),
            items: {
                create: {
                    productId: products[1].id,
                    quantity: po2Qty,
                    unitPrice: products[1].costPrice
                }
            }
        }
    });

    // Update Stock for PO 2
    await prisma.stock.upsert({
        where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: products[1].id, batchNumber: 'GENERAL' } },
        update: { quantity: { increment: po2Qty } },
        create: { warehouseId: warehouse.id, productId: products[1].id, quantity: po2Qty, batchNumber: 'GENERAL' }
    });
    console.log(`✅ PO 2 Processed: ${po2Qty} x ${products[1].name} (Total Cost: $${po2Total}) -> Stock Updated`);


    // 5. Create 2 Sales
    console.log('🏷️ Processing Sales...');

    // Sale 1: 5 Servers (PAID) - affects Cash
    const sale1Qty = 5;
    const sale1Total = sale1Qty * products[0].price;
    const sale1Tax = sale1Total * 0.18; // 18% Tax

    const sale1 = await prisma.sale.create({
        data: {
            tenantId: tenant.id,
            customerId: customer.id,
            invoiceNo: `INV-${Date.now()}-1`,
            totalAmount: sale1Total + sale1Tax,
            taxAmount: sale1Tax,
            status: 'COMPLETED',
            isPaid: true,
            createdAt: new Date(),
            items: {
                create: {
                    productId: products[0].id,
                    quantity: sale1Qty,
                    unitPrice: products[0].price,
                    taxAmount: sale1Tax
                }
            }
        }
    });

    // Deduct Stock
    await prisma.stock.update({
        where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: products[0].id, batchNumber: 'GENERAL' } },
        data: { quantity: { decrement: sale1Qty } }
    });

    // Daybook Entry for Paid Sale
    await prisma.daybook.create({
        data: {
            tenantId: tenant.id,
            date: new Date(),
            type: 'SALE',
            description: `Sales Revenue - Invoice ${sale1.invoiceNo}`,
            debit: sale1Total + sale1Tax, // Cash In
            credit: 0,
            referenceId: sale1.id,
            status: 'APPROVED'
        }
    });
    console.log(`✅ Sale 1 (Paid): ${sale1Qty} x ${products[0].name} (Amount: $${sale1Total + sale1Tax}) -> Stock Deducted, Daybook Entry Created`);


    // Sale 2: 10 Switches (UNPAID/CREDIT) - creates AR
    const sale2Qty = 10;
    const sale2Total = sale2Qty * products[1].price;
    const sale2Tax = sale2Total * 0.18;

    const sale2 = await prisma.sale.create({
        data: {
            tenantId: tenant.id,
            customerId: customer.id,
            invoiceNo: `INV-${Date.now()}-2`,
            totalAmount: sale2Total + sale2Tax,
            taxAmount: sale2Tax,
            status: 'COMPLETED',
            isPaid: false, // Credit Sale
            createdAt: new Date(),
            items: {
                create: {
                    productId: products[1].id,
                    quantity: sale2Qty,
                    unitPrice: products[1].price,
                    taxAmount: sale2Tax
                }
            }
        }
    });

    // Deduct Stock
    await prisma.stock.update({
        where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: products[1].id, batchNumber: 'GENERAL' } },
        data: { quantity: { decrement: sale2Qty } }
    });
    console.log(`✅ Sale 2 (Credit): ${sale2Qty} x ${products[1].name} (Amount: $${sale2Total + sale2Tax}) -> Stock Deducted, AR Created`);

    console.log('✅ Finance Data Seeding Complete!');
}

seedFinanceData()
    .catch((e) => {
        console.error('❌ Error seeding finance data:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
