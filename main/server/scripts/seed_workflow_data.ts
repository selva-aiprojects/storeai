
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Comprehensive Workflow Seeding for Master Store...');

    // 1. Roles & Super Admin
    const commonPassword = await bcrypt.hash('AdminPassword123!', 10);
    let superAdminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
        superAdminRole = await prisma.role.create({ data: { name: 'Super Admin', code: 'SUPER_ADMIN' } });
    }

    let adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    if (!adminRole) {
        adminRole = await prisma.role.create({ data: { name: 'Admin', code: 'ADMIN' } });
    }

    const superAdminEmail = 'superadmin@storeai.com';
    let superAdminUser = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: { password: commonPassword, role: 'SUPER_ADMIN' },
        create: {
            email: superAdminEmail,
            password: commonPassword,
            firstName: 'Siddharth',
            lastName: 'Malhotra',
            role: 'SUPER_ADMIN'
        }
    });

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

    // 2. The Master Store (StoreAI Hub Platform)
    const t = {
        name: 'StoreAI Hub Platform',
        slug: 'technova',
        logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=200&h=200&auto=format&fit=crop',
        status: 'ACTIVE',
        features: { inventory: true, sales: true, crm: true, procurement: true, hr: true, finance: true, ai: true },
        categories: [
            { name: 'Enterprise Systems', description: 'Rack servers and data center infrastructure' },
            { name: 'Networking Logic', description: 'Enterprise-grade mesh routers and switches' },
            { name: 'Cyber Assets', description: 'Secure computation and edge devices' }
        ],
        products: [
            { sku: 'HUB-PRO-001', name: 'Precision ProBook X1', price: 1299.00, cost: 850.00, brand: 'StoreAI Prime', unit: 'unit' },
            { sku: 'HUB-NET-002', name: 'Quantum Router G-5', price: 450.00, cost: 220.00, brand: 'StoreAI Connect', unit: 'unit' },
            { sku: 'HUB-DSK-003', name: 'Elite Station 900', price: 2100.00, cost: 1400.00, brand: 'StoreAI Core', unit: 'unit' },
            { sku: 'HUB-MSR-004', name: 'OLED Monitor 32"', price: 899.00, cost: 450.00, brand: 'StoreAI Vision', unit: 'unit' },
            { sku: 'HUB-ACS-005', name: 'Mechanical Keyboard R1', price: 180.00, cost: 65.00, brand: 'StoreAI Tactile', unit: 'unit' }
        ],
        suppliers: [
            { name: 'Silicon Valley Logistics', email: 'supply@svlogistics.com', contact: 'Mark Silicon', address: 'Mountain View, CA' },
            { name: 'Global Tech Distribution', email: 'orders@globaltech.com', contact: 'Sarah Tech', address: 'Singapore Tech Park' }
        ],
        customers: [
            { name: 'Innovation Labs Inc', email: 'procurement@innovation.com', phone: '+1-555-9000', city: 'Palo Alto', address: 'University Ave' },
            { name: 'NextGen Solutions', email: 'ops@nextgen.com', phone: '+1-555-8000', city: 'Austin', address: 'Congress Ave' }
        ],
        employees: [
            { first: 'Sanjeev', last: 'Verma', role: 'Head of Operations', salary: 120000, rating: 5 },
            { first: 'Meera', last: 'Nair', role: 'Accountant', salary: 75000, rating: 4 },
            { first: 'Rahul', last: 'Sharma', role: 'Sales Lead', salary: 85000, rating: 5 },
            { first: 'Anita', last: 'Desai', role: 'Inventory Manager', salary: 65000, rating: 4 }
        ]
    };

    console.log(`--- Seeding Master Store: ${t.name} ---`);
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
    const tAdminUser = await prisma.user.upsert({
        where: { email: tAdminEmail },
        update: { password: commonPassword, role: 'ADMIN' },
        create: {
            email: tAdminEmail,
            password: commonPassword,
            firstName: 'Hub',
            lastName: 'Administrator',
            role: 'ADMIN'
        }
    });

    await prisma.userTenant.upsert({
        where: { userId_tenantId: { userId: tAdminUser.id, tenantId: tenant.id } },
        update: { roleId: adminRole.id },
        create: { userId: tAdminUser.id, tenantId: tenant.id, roleId: adminRole.id }
    });

    // 3. Departments & Employees (Staffing Workflow)
    let opsDept = await prisma.department.findUnique({ where: { tenantId_name: { tenantId: tenant.id, name: 'Operations' } } });
    if (!opsDept) {
        opsDept = await prisma.department.create({ data: { name: 'Operations', tenantId: tenant.id } });
    }

    const createdEmployees = [];
    for (const em of t.employees) {
        const empId = `EMP-HUB-${em.first.toUpperCase()}`;
        const employee = await prisma.employee.upsert({
            where: { employeeId: empId },
            update: { firstName: em.first, lastName: em.last, designation: em.role, salary: em.salary, performanceRating: em.rating },
            create: {
                employeeId: empId,
                firstName: em.first,
                lastName: em.last,
                designation: em.role,
                salary: em.salary,
                departmentId: opsDept.id,
                performanceRating: em.rating,
                joiningDate: new Date('2025-01-01')
            }
        });
        createdEmployees.push(employee);

        // Attendance Workflow
        console.log(`⏱️ Seeding Attendance for ${em.first}...`);
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            await prisma.attendance.create({
                data: {
                    date,
                    status: Math.random() > 0.1 ? 'PRESENT' : 'ABSENT',
                    checkIn: new Date(date.setHours(9, 0, 0)),
                    checkOut: new Date(date.setHours(18, 0, 0)),
                    employeeId: employee.id
                }
            });
        }
    }

    // 4. Products & Categories
    const createdCategories = [];
    for (const cat of t.categories) {
        const category = await prisma.category.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: cat.name } },
            update: { description: cat.description },
            create: { name: cat.name, description: cat.description, tenantId: tenant.id }
        });
        createdCategories.push(category);
    }

    const allProducts = [];
    for (let i = 0; i < t.products.length; i++) {
        const p = t.products[i];
        const cat = createdCategories[i % createdCategories.length];
        const product = await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
            update: { name: p.name, price: p.price, costPrice: p.cost, brand: p.brand, unit: p.unit, categoryId: cat.id, stockQuantity: 100 },
            create: { sku: p.sku, name: p.name, price: p.price, costPrice: p.cost, brand: p.brand, unit: p.unit, categoryId: cat.id, tenantId: tenant.id, stockQuantity: 100 }
        });
        allProducts.push(product);
    }

    // 5. Suppliers (Procurement Workflow)
    const allSuppliers = [];
    for (const s of t.suppliers) {
        const supplier = await prisma.supplier.upsert({
            where: { tenantId_email: { tenantId: tenant.id, email: s.email } },
            update: { name: s.name, contact: s.contact, address: s.address },
            create: { name: s.name, email: s.email, contact: s.contact, address: s.address, tenantId: tenant.id }
        });
        allSuppliers.push(supplier);
    }

    // Purchase Requisition & Quotation Workflow
    console.log('⏱️ Seeding Procurement Workflow (PR -> PQ -> PO)...');
    const pr = await prisma.purchaseRequisition.create({
        data: {
            requisitionNo: `PR-HUB-${Date.now()}`,
            status: 'APPROVED',
            priority: 'HIGH',
            requestedById: createdEmployees[0].id,
            tenantId: tenant.id,
            items: {
                create: {
                    productId: allProducts[0].id,
                    quantity: 10
                }
            }
        }
    });

    const pq = await prisma.purchaseQuotation.create({
        data: {
            quotationNo: `PQ-HUB-${Date.now()}`,
            supplierId: allSuppliers[0].id,
            requisitionId: pr.id,
            totalAmount: allProducts[0].costPrice * 10,
            status: 'ACCEPTED',
            tenantId: tenant.id
        }
    });

    await prisma.order.create({
        data: {
            orderNumber: `PO-HUB-TRACK-001`,
            status: 'SHIPPED',
            totalAmount: pq.totalAmount,
            supplierId: allSuppliers[0].id,
            tenantId: tenant.id,
            quotationId: pq.id,
            trackingNumber: 'TRK99887766',
            shippingCarrier: 'FedEx Enterprise',
            expectedDeliveryDate: new Date(Date.now() + 86400000 * 3),
            items: {
                create: {
                    productId: allProducts[0].id,
                    quantity: 10,
                    unitPrice: allProducts[0].costPrice
                }
            }
        }
    });

    // 6. Customers & Sales (Fulfillment & Delivery Workflow)
    const allCustomers = [];
    for (const c of t.customers) {
        const customer = await prisma.customer.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: c.name } },
            update: { email: c.email, phone: c.phone, city: c.city, address: c.address },
            create: { name: c.name, email: c.email, phone: c.phone, city: c.city, address: c.address, tenantId: tenant.id }
        });
        allCustomers.push(customer);
    }

    console.log('⏱️ Seeding Fulfillment Workflow (Home Delivery)...');
    for (let i = 0; i < 5; i++) {
        const sale = await prisma.sale.create({
            data: {
                invoiceNo: `INV-HUB-DLV-00${i + 1}`,
                totalAmount: allProducts[i % allProducts.length].price * 2,
                taxAmount: 0,
                isHomeDelivery: true,
                deliveryAddress: allCustomers[i % allCustomers.length].address,
                deliveryCity: allCustomers[i % allCustomers.length].city,
                status: 'SHIPPED',
                trackingNumber: `SHIP-HUB-00${i + 1}`,
                shippingCarrier: 'BlueDart Premium',
                customerId: allCustomers[i % allCustomers.length].id,
                tenantId: tenant.id,
                items: {
                    create: {
                        productId: allProducts[i % allProducts.length].id,
                        quantity: 2,
                        unitPrice: allProducts[i % allProducts.length].price
                    }
                }
            }
        });
    }

    console.log('✅ Master Store Comprehensive Seeding Complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
