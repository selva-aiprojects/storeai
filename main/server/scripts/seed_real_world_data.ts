
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Real-World Data Seeding...');

    // 1. Get or Create Roles
    let superAdminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
        superAdminRole = await prisma.role.create({
            data: {
                name: 'Super Admin',
                code: 'SUPER_ADMIN',
            }
        });
        console.log('✅ Created Super Admin Role');
    }

    let adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                code: 'ADMIN',
            }
        });
        console.log('✅ Created Admin Role');
    }

    // 2. Get or Create Super Admin User
    const commonPassword = await bcrypt.hash('AdminPassword123!', 10);
    const superAdminEmail = 'superadmin@storeai.com';
    let superAdminUser = await prisma.user.findUnique({ where: { email: superAdminEmail } });
    if (!superAdminUser) {
        superAdminUser = await prisma.user.create({
            data: {
                email: superAdminEmail,
                password: commonPassword,
                firstName: 'Siddharth',
                lastName: 'Malhotra',
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ Created Super Admin User: Siddharth Malhotra');
    }

    const oldAdminEmail = 'admin@storeai.com';
    await prisma.user.upsert({
        where: { email: oldAdminEmail },
        update: { password: commonPassword, role: 'SUPER_ADMIN' },
        create: {
            email: oldAdminEmail,
            password: commonPassword,
            firstName: 'Alex',
            lastName: 'Master',
            role: 'SUPER_ADMIN'
        }
    });

    // 3. Define Tenants (Reduced to 3 as requested)
    const tenantsData = [
        {
            name: 'StoreAI Hub Platform',
            slug: 'technova',
            logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true, hr: true, finance: true, ai: true },
            categories: [
                { name: 'Enterprise Systems', description: 'Rack servers and data center infrastructure' },
                { name: 'Networking Logic', description: 'Enterprise-grade mesh routers and switches' }
            ],
            products: [
                { sku: 'HUB-PRO-001', name: 'Precision ProBook X1', price: 1299.00, cost: 850.00, brand: 'StoreAI Prime', unit: 'unit' },
                { sku: 'HUB-NET-002', name: 'Quantum Router G-5', price: 450.00, cost: 220.00, brand: 'StoreAI Connect', unit: 'unit' },
                { sku: 'HUB-DSK-003', name: 'Elite Station 900', price: 2100.00, cost: 1400.00, brand: 'StoreAI Core', unit: 'unit' }
            ],
            suppliers: [
                { name: 'Silicon Valley Logistics', email: 'supply@svlogistics.com', contact: 'Mark Silicon', address: 'Mountain View, CA' }
            ],
            customers: [
                { name: 'Innovation Labs Inc', email: 'procurement@innovation.com', phone: '+1-555-9000', city: 'Palo Alto', address: 'University Ave' }
            ],
            employees: [
                { first: 'Sanjeev', last: 'Verma', role: 'Head of Operations', salary: 120000 },
                { first: 'Meera', last: 'Nair', role: 'Accountant', salary: 75000 }
            ]
        },
        {
            name: 'GastroGlore Fine Foods',
            slug: 'gastroglore',
            logo: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: 'Gourmet Oils', description: 'Premium extra virgin and infused oils' },
                { name: 'Artisan Coffee', description: 'Single-origin and specialty blends' }
            ],
            products: [
                { sku: 'GGG-OIL-001', name: 'Extra Virgin Olive Oil (500ml)', price: 24.99, cost: 12.50, brand: 'Estate Reserve', unit: 'bottle' },
                { sku: 'GGG-COF-003', name: 'Whole Bean Arabica (1kg)', price: 34.50, cost: 18.00, brand: 'Highland Roasters', unit: 'bag' }
            ],
            suppliers: [
                { name: 'Global Gourmet Importers', email: 'orders@globalgourmet.com', contact: 'John Importer', address: '123 Port Road, Logistics City' }
            ],
            customers: [
                { name: 'The Ritz-Carlton', email: 'procurement@ritzcarlton.com', phone: '+1-555-0101', city: 'London', address: '150 Piccadilly' }
            ]
        },
        {
            name: 'Lumina Home Decor',
            slug: 'lumina-home',
            logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: 'Lighting', description: 'Modern and ambient lighting solutions' },
                { name: 'Furniture', description: 'Handcrafted wooden and modern furniture' }
            ],
            products: [
                { sku: 'LHD-LIT-001', name: 'Nordic Floor Lamp', price: 189.00, cost: 75.00, brand: 'Lumina', unit: 'pcs' },
                { sku: 'LHD-FUR-002', name: 'Walnut Coffee Table', price: 450.00, cost: 210.00, brand: 'ModernCraft', unit: 'pcs' }
            ],
            suppliers: [
                { name: 'Modern Craft Furniture', email: 'sales@moderncraft.com', contact: 'David Wood', address: 'Workshop Lane, Carpentry District' }
            ],
            customers: [
                { name: 'Interior Design Studio', email: 'projects@ids.com', phone: '+1-555-0201', city: 'New York', address: '200 Design Ave' }
            ]
        }
    ];

    for (const t of tenantsData) {
        console.log(`--- Seeding Tenant: ${t.name} ---`);

        const tenant = await prisma.tenant.upsert({
            where: { slug: t.slug },
            update: { name: t.name, logo: t.logo, status: t.status, features: t.features },
            create: { name: t.name, slug: t.slug, logo: t.logo, status: t.status, features: t.features }
        });

        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: superAdminUser.id, tenantId: tenant.id } },
            update: { roleId: superAdminRole.id },
            create: { userId: superAdminUser.id, tenantId: tenant.id, roleId: superAdminRole.id }
        });

        const tAdminEmail = `storeaiadmin@${t.slug}.com`;
        let tAdminUser = await prisma.user.findUnique({ where: { email: tAdminEmail } });
        if (!tAdminUser) {
            tAdminUser = await prisma.user.create({
                data: {
                    email: tAdminEmail,
                    password: commonPassword,
                    firstName: 'Tenant',
                    lastName: 'Admin',
                    role: 'ADMIN'
                }
            });
            console.log(`✅ Created Tenant Admin: ${tAdminEmail}`);
        }

        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: tAdminUser.id, tenantId: tenant.id } },
            update: { roleId: adminRole.id },
            create: { userId: tAdminUser.id, tenantId: tenant.id, roleId: adminRole.id }
        });

        const createdCategories = [];
        for (const cat of t.categories) {
            const category = await prisma.category.upsert({
                where: { tenantId_name: { tenantId: tenant.id, name: cat.name } },
                update: { description: cat.description },
                create: { name: cat.name, description: cat.description, tenantId: tenant.id }
            });
            createdCategories.push(category);
        }

        for (let i = 0; i < t.products.length; i++) {
            const p = t.products[i];
            const cat = createdCategories[i % createdCategories.length];
            await prisma.product.upsert({
                where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
                update: {
                    name: p.name,
                    price: p.price,
                    costPrice: p.cost,
                    brand: p.brand,
                    unit: p.unit,
                    categoryId: cat.id,
                    stockQuantity: 100
                },
                create: {
                    sku: p.sku,
                    name: p.name,
                    price: p.price,
                    costPrice: p.cost,
                    brand: p.brand,
                    unit: p.unit,
                    categoryId: cat.id,
                    tenantId: tenant.id,
                    stockQuantity: 100
                }
            });
        }

        for (const s of t.suppliers) {
            await prisma.supplier.upsert({
                where: { tenantId_email: { tenantId: tenant.id, email: s.email } },
                update: { name: s.name, contact: s.contact, address: s.address },
                create: { name: s.name, email: s.email, contact: s.contact, address: s.address, tenantId: tenant.id }
            });
        }

        const createdCustomers = [];
        for (const c of t.customers) {
            const customer = await prisma.customer.upsert({
                where: { tenantId_name: { tenantId: tenant.id, name: c.name } },
                update: { email: c.email, phone: c.phone, city: c.city, address: c.address },
                create: { name: c.name, email: c.email, phone: c.phone, city: c.city, address: c.address, tenantId: tenant.id }
            });
            createdCustomers.push(customer);
        }

        const createdEmployees = [];
        if (t.employees) {
            let dept = await prisma.department.findFirst({ where: { tenantId: tenant.id } });
            if (!dept) {
                dept = await prisma.department.create({
                    data: { name: 'Operations', tenantId: tenant.id }
                });
            }

            for (const e of t.employees) {
                const empId = `EMP-${tenant.slug.toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
                const employee = await prisma.employee.upsert({
                    where: { employeeId: empId },
                    update: { firstName: e.first, lastName: e.last, designation: e.role, salary: e.salary },
                    create: {
                        employeeId: empId,
                        firstName: e.first,
                        lastName: e.last,
                        designation: e.role,
                        salary: e.salary,
                        departmentId: dept.id,
                        joiningDate: new Date('2025-01-01')
                    }
                });
                createdEmployees.push(employee);
            }
        }

        console.log(`⏱️ Generating 12 months of historical data for ${t.name}...`);
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const endDate = new Date();

        const allProducts = await prisma.product.findMany({ where: { tenantId: tenant.id } });
        const allSuppliers = await prisma.supplier.findMany({ where: { tenantId: tenant.id } });

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const txCount = isWeekend ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 15) + 5;

            for (let i = 0; i < txCount; i++) {
                const product = allProducts[Math.floor(Math.random() * allProducts.length)];
                const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
                const salesman = createdEmployees.length > 0 ? createdEmployees[Math.floor(Math.random() * createdEmployees.length)] : null;
                const qty = Math.floor(Math.random() * 3) + 1;
                const price = product.price;
                const total = qty * price;
                const tax = total * 0.18;

                const sale = await prisma.sale.create({
                    data: {
                        invoiceNo: `INV-${currentDate.getTime()}-${i}`,
                        totalAmount: total + tax,
                        taxAmount: tax,
                        cgstAmount: tax / 2,
                        sgstAmount: tax / 2,
                        tenantId: tenant.id,
                        customerId: customer.id,
                        salesmanId: salesman?.id,
                        createdAt: currentDate,
                        status: 'COMPLETED',
                        items: {
                            create: {
                                productId: product.id,
                                quantity: qty,
                                unitPrice: price,
                                taxAmount: tax
                            }
                        }
                    }
                });

                if (Math.random() > 0.2) {
                    await prisma.payment.create({
                        data: {
                            amount: total + tax,
                            method: Math.random() > 0.5 ? 'UPI' : 'CASH',
                            tenantId: tenant.id,
                            saleId: sale.id,
                            createdAt: currentDate
                        }
                    });
                }
            }

            if (currentDate.getDate() % 10 === 0) {
                const supplier = allSuppliers[Math.floor(Math.random() * allSuppliers.length)];
                const product = allProducts[Math.floor(Math.random() * allProducts.length)];
                const poQty = 50;
                const poTotal = poQty * product.costPrice;

                await prisma.order.create({
                    data: {
                        orderNumber: `PO-${currentDate.getTime()}`,
                        totalAmount: poTotal,
                        status: 'RECEIVED',
                        tenantId: tenant.id,
                        supplierId: supplier.id,
                        createdAt: currentDate,
                        items: {
                            create: {
                                productId: product.id,
                                quantity: poQty,
                                unitPrice: product.costPrice
                            }
                        }
                    }
                });
            }
        }
    }

    console.log('✅ Real-World Data Seeding Complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
