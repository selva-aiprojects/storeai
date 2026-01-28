
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Starting Demo Data Seed...');

    // 2. CREATE TENANT
    const tenantName = 'Demo Tech Store';
    let tenantId = '';
    try {
        let tenant = await prisma.tenant.findFirst({ where: { name: tenantName } });
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: tenantName,
                    slug: 'demo-tech-store',
                    status: 'ACTIVE',
                    features: { inventory: true, sales: true, hr: true, procurement: true }
                }
            });
            console.log('✅ Tenant Created:', tenant.name);
        } else {
            console.log('ℹ️ Tenant Exists:', tenant.name);
        }
        tenantId = tenant.id;
    } catch (e: any) {
        console.error('❌ Tenant Error:', e.message);
        return; // Critical
    }

    // 3. CREATE USERS
    try {
        const password = await bcrypt.hash('DemoPass123!', 10);
        const users = [
            { email: 'admin@storeai.com', role: 'SUPER_ADMIN', first: 'Admin', last: 'User' },
            { email: 'manager@storeai.com', role: 'MANAGER', first: 'Store', last: 'Manager' },
            { email: 'sales@storeai.com', role: 'STAFF', first: 'Sales', last: 'Rep' },
        ];

        for (const u of users) {
            // simplified upsert
            const existing = await prisma.user.findUnique({ where: { email: u.email } });
            if (!existing) {
                await prisma.user.create({
                    data: {
                        email: u.email,
                        password,
                        firstName: u.first,
                        lastName: u.last,
                        role: u.role,
                        tenants: { create: { tenantId, roleId: 'admin' } } // Mock roleId
                    }
                });
            }
        }
        console.log('✅ Users Seeded');
    } catch (e: any) {
        console.error('❌ User Error:', e.message);
    }

    // 4. CREATE CATEGORIES
    const catMap = new Map();
    try {
        const categories = ['Electronics', 'Furniture', 'Accessories', 'Stationery'];
        for (const c of categories) {
            const cat = await prisma.category.upsert({
                where: { tenantId_name: { tenantId, name: c } },
                update: {},
                create: { name: c, description: `Demo ${c}`, tenantId }
            });
            catMap.set(c, cat.id);
        }
        console.log('✅ Categories Seeded');
    } catch (e: any) {
        console.error('❌ Category Error:', e.message);
    }

    // 5. CREATE PRODUCTS (CAPITAL/ASSETS)
    const productIds: string[] = [];
    try {
        const products = [
            { name: 'Gaming Laptop', sku: 'LAP-001', price: 1200, cost: 900, cat: 'Electronics', stock: 50 },
            { name: 'Wireless Mouse', sku: 'ACC-002', price: 25, cost: 10, cat: 'Accessories', stock: 200 },
            { name: 'Ergo Chair', sku: 'FUR-003', price: 300, cost: 150, cat: 'Furniture', stock: 20 },
            { name: 'USB-C Cable', sku: 'ACC-004', price: 15, cost: 5, cat: 'Accessories', stock: 500 },
            { name: 'Monitor 4K', sku: 'MON-005', price: 400, cost: 250, cat: 'Electronics', stock: 30 },
        ];

        for (const p of products) {
            const catId = catMap.get(p.cat);
            if (!catId) {
                console.warn(`Skipping ${p.name}: Cat ${p.cat} not found`);
                continue;
            }
            const prod = await prisma.product.upsert({
                where: { tenantId_sku: { tenantId, sku: p.sku } },
                update: { stockQuantity: p.stock },
                create: {
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    costPrice: p.cost,
                    stockQuantity: p.stock,
                    categoryId: catId,
                    tenantId
                }
            });
            productIds.push(prod.id);
        }
        console.log('✅ Products & Opening Stock Seeded');
    } catch (e: any) {
        console.error('❌ Product Error:', e.message);
    }

    // 6. CREATE WAREHOUSE
    let warehouseId = '';
    try {
        const warehouse = await prisma.warehouse.upsert({
            where: { tenantId_name: { tenantId, name: 'Main Warehouse' } },
            update: {},
            create: { name: 'Main Warehouse', location: 'HQ', isDefault: true, tenantId }
        });
        warehouseId = warehouse.id;
        console.log('✅ Warehouse Seeded');
    } catch (e: any) {
        console.error('❌ Warehouse Error:', e.message);
    }

    // 7. SUPPLIERS
    let supplierId = '';
    try {
        const supplier = await prisma.supplier.create({
            data: {
                name: 'Global Tech Distributors',
                email: `supply-${Date.now()}@globaltech.com`, // Unique email
                phone: '555-0199',
                status: 'ACTIVE',
                tenantId
            }
        });
        supplierId = supplier.id;
    } catch (e: any) {
        console.error('❌ Supplier Error:', e.message);
        // Try find existing?
        const exist = await prisma.supplier.findFirst({ where: { tenantId } });
        if (exist) supplierId = exist ? exist.id : '';
    }

    // 8. TRANSACTIONS: PROCUREMENT (PO -> GRN)
    try {
        console.log('🔄 Generating Procurement Transactions...');
        if (productIds.length > 0 && supplierId && warehouseId) {
            for (let i = 0; i < 10; i++) {
                const po = await prisma.order.create({
                    data: {
                        orderNumber: `PO-${Date.now()}-${i}`,
                        status: 'COMPLETED',
                        totalAmount: 5000,
                        supplierId,
                        tenantId,
                        items: {
                            create: {
                                productId: productIds[i % productIds.length],
                                quantity: 10,
                                unitPrice: 100
                            }
                        }
                    }
                });

                // Associated GRN
                await prisma.goodsReceipt.create({
                    data: {
                        grnNumber: `GRN-${Date.now()}-${i}`,
                        orderId: po.id,
                        warehouseId,
                        items: {
                            create: {
                                productId: productIds[i % productIds.length],
                                quantity: 10,
                                batchNumber: `BATCH-${i}`,
                                expiryDate: new Date('2025-12-31')
                            }
                        }
                    }
                });
            }
        } else {
            console.warn('⚠️ Skipping Procurement: Missing dependencies');
        }
    } catch (e: any) {
        console.error('❌ Procurement Error:', e.message);
    }

    // 9. TRANSACTIONS: SALES (Invoice)
    try {
        console.log('🔄 Generating Sales Transactions...');
        const customers = ['John Doe', 'Acme Corp', 'Jane Smith', 'Tech Startups Inc'];

        if (productIds.length > 0) {
            for (let i = 0; i < 15; i++) {
                // Create Customer on fly
                const custName = customers[i % customers.length];
                let cust = await prisma.customer.findFirst({ where: { email: `${custName.replace(' ', '').toLowerCase()}@demo.com` } });
                if (!cust) {
                    cust = await prisma.customer.create({
                        data: {
                            firstName: custName.split(' ')[0],
                            lastName: custName.split(' ')[1] || '',
                            email: `${custName.replace(' ', '').toLowerCase()}@demo.com`,
                            phone: '555-0000',
                            tenantId
                        }
                    });
                }

                await prisma.sale.create({
                    data: {
                        invoiceNo: `INV-${Date.now()}-${i}`,
                        status: 'COMPLETED',
                        paymentMethod: i % 2 === 0 ? 'CASH' : 'CARD',
                        paymentStatus: 'PAID',
                        subTotal: 500,
                        taxAmount: 50,
                        totalAmount: 550,
                        customerId: cust.id,
                        tenantId,
                        items: {
                            create: {
                                productId: productIds[i % productIds.length],
                                quantity: 1,
                                unitPrice: 500,
                                totalPrice: 500
                            }
                        }
                    }
                });
            }
        }
        console.log('✅ Seeding Complete: Transactions Created.');
    } catch (e: any) {
        console.error('❌ Sales Error:', e.message);
    }
}

seed()
    .catch((e) => {
        console.error('CRITICAL SEED ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
