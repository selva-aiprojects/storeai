import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING ENTERPRISE SEEDING ---');

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    // 1. Core Departments
    const salesDept = await prisma.department.upsert({
        where: { name: 'Sales & Marketing' },
        update: {},
        create: { name: 'Sales & Marketing' },
    });

    const opsDept = await prisma.department.upsert({
        where: { name: 'Operations & Logistics' },
        update: {},
        create: { name: 'Operations & Logistics' },
    });

    // 2. Identities
    const admin = await prisma.user.upsert({
        where: { email: 'admin@storeai.com' },
        update: { role: 'SUPER_ADMIN' },
        create: {
            email: 'admin@storeai.com',
            password: hashedPassword,
            firstName: 'Chief',
            lastName: 'Administrator',
            role: 'SUPER_ADMIN',
        },
    });

    const shipmentUser = await prisma.user.upsert({
        where: { email: 'shipment@storeai.com' },
        update: { role: 'SHIPMENT' },
        create: {
            email: 'shipment@storeai.com',
            password: hashedPassword,
            firstName: 'Logistics',
            lastName: 'Officer',
            role: 'SHIPMENT',
        },
    });

    // 3. Employee Mapping
    await prisma.employee.upsert({
        where: { employeeId: 'EMP-ADM-001' },
        update: {},
        create: {
            employeeId: 'EMP-ADM-001',
            designation: 'Managing Director',
            joiningDate: new Date(),
            salary: 120000,
            departmentId: salesDept.id,
            userId: admin.id
        }
    });

    // 4. Sample Products & Suppliers
    const category = await prisma.category.upsert({
        where: { name: 'Enterprise Hardware' },
        update: {},
        create: { name: 'Enterprise Hardware' },
    });

    const product = await prisma.product.upsert({
        where: { sku: 'PRO-X1-SER' },
        update: {},
        create: {
            name: 'StoreAI Rack Server v4',
            sku: 'PRO-X1-SER',
            price: 5500,
            costPrice: 3200,
            stockQuantity: 15,
            lowStockThreshold: 5,
            categoryId: category.id
        }
    });

    // 5. Warehouse & Stock Init (MIGRATION FIX)
    const warehouse = await prisma.warehouse.upsert({
        where: { name: 'Main Distribution Hub' },
        update: {},
        create: {
            name: 'Main Distribution Hub',
            location: 'Building A, Grid 4',
            isDefault: true
        }
    });

    // Ensure stock record exists
    await prisma.stock.upsert({
        where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
        update: { quantity: product.stockQuantity },
        create: {
            warehouseId: warehouse.id,
            productId: product.id,
            quantity: product.stockQuantity,
            reserved: 0
        }
    });

    // 6. CRM Seed
    // 6. CRM Seed
    const customer = await prisma.customer.upsert({
        where: { email: "purchasing@megacorp.com" }, // Assuming email is unique or we use it as key
        update: {},
        create: {
            name: "MegaCorp Industries",
            email: "purchasing@megacorp.com",
            address: "100 Industrial Way",
        }
    });

    const deal = await prisma.deal.findFirst({ where: { title: "Q1 Server Upgrade" } });
    if (!deal) {
        await prisma.deal.create({
            data: {
                title: "Q1 Server Upgrade",
                value: 25000,
                stage: "NEGOTIATION",
                customerId: customer.id,
                items: {
                    create: {
                        productId: product.id,
                        quantity: 4,
                        price: 22000 // Negotiated price
                    }
                }
            }
        });
    }

    console.log('✔ Identity Hub Ready: admin@storeai.com / shipment@storeai.com');
    console.log('✔ HR Infrastructure Seeded');
    console.log('--- SEEDING COMPLETE ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
