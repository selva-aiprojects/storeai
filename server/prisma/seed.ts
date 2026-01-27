import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING SYSTEM RECOVERY SEED ---');

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    // 1. Clean ALL tables in correct dependency order to prevent FK constraints
    try {
        await prisma.goodsReceiptItem.deleteMany({});
        await prisma.goodsReceipt.deleteMany({});
        await prisma.payroll.deleteMany({});
        await prisma.attendance.deleteMany({});
        await prisma.activity.deleteMany({});
        await prisma.dealItem.deleteMany({});
        await prisma.salesOrderItem.deleteMany({});
        await prisma.salesOrder.deleteMany({});
        await prisma.deal.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.ledger.deleteMany({});
        await prisma.saleItem.deleteMany({});
        await prisma.sale.deleteMany({});
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.inventoryDocumentItem.deleteMany({});
        await prisma.inventoryDocument.deleteMany({});
        await prisma.stock.deleteMany({});
        await prisma.warehouse.deleteMany({});
        await prisma.pricingRule.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.category.deleteMany({});
        await prisma.supplier.deleteMany({});
        await prisma.customer.deleteMany({});
        await prisma.employee.deleteMany({});
        await prisma.department.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('✔ Database Cleaned');
    } catch (e) {
        console.log('⚠ Cleanup warning (likely empty db):', e);
    }

    // 2. Departments
    const deptNames = ["Sales", "Procurement", "Operations", "HR", "Support", "Shipment", "IT", "Management"];
    const createdDepts: Record<string, any> = {};
    for (const name of deptNames) {
        createdDepts[name] = await prisma.department.create({ data: { name } });
    }

    // 3. Categories & Products
    const computeCat = await prisma.category.create({ data: { name: 'Compute Nodes' } });
    const netCat = await prisma.category.create({ data: { name: 'Networking Gear' } });

    const products = [
        { sku: 'SRV-QN-100', name: 'Quantum Node 100', price: 12000, costPrice: 8500, stock: 2, low: 5, cat: computeCat.id },
        { sku: 'NET-SW-48G', name: 'GigaConnect 48GT', price: 1500, costPrice: 900, stock: 1, low: 10, cat: netCat.id },
        { sku: 'SRV-QN-200', name: 'Quantum Node 200 Plus', price: 18000, costPrice: 13000, stock: 12, low: 5, cat: computeCat.id }
    ];

    const createdProds: any[] = [];
    for (const p of products) {
        createdProds.push(await prisma.product.create({
            data: {
                sku: p.sku, name: p.name, price: p.price, costPrice: p.costPrice,
                stockQuantity: p.stock, categoryId: p.cat, lowStockThreshold: p.low,
                // New Fields with defaults
                avgDailySales: 1.5, leadTimeDays: 7, reorderPoint: 10, reorderQuantity: 50, isBatchTracked: false
            }
        }));
    }

    // 4. Warehouse & Real Stock
    const wh = await prisma.warehouse.create({ data: { name: 'Main Distribution Center', location: 'Sector 7G', isDefault: true } });
    for (const p of createdProds) {
        await prisma.stock.create({
            data: {
                productId: p.id,
                warehouseId: wh.id,
                quantity: p.stockQuantity,
                batchNumber: 'INITIAL_LOAD',
                expiryDate: null
            }
        });
    }

    // 5. HR: Users & Employees
    // Ensuring Role Matches Enum or String exactly as in schema
    const staff = [
        { email: 'admin@storeai.com', f: 'Chief', l: 'Admin', role: 'SUPER_ADMIN', des: 'CEO', sal: 150000, dept: createdDepts["Management"].id, eid: 'EMP-001' },
        { email: 'sarah.c@storeai.com', f: 'Sarah', l: 'Connor', role: 'HR', des: 'HR Manager', sal: 85000, dept: createdDepts["HR"].id, eid: 'EMP-002' },
        { email: 'michael.s@storeai.com', f: 'Michael', l: 'Scott', role: 'STAFF', des: 'Sales Head', sal: 90000, dept: createdDepts["Sales"].id, eid: 'EMP-003' },
        { email: 'dwight.s@storeai.com', f: 'Dwight', l: 'Schrute', role: 'STAFF', des: 'Operations Lead', sal: 75000, dept: createdDepts["Operations"].id, eid: 'EMP-004' }
    ];

    const createdEmployees: any[] = [];
    for (const s of staff) {
        const user = await prisma.user.create({
            data: { email: s.email, password: hashedPassword, firstName: s.f, lastName: s.l, role: s.role }
        });
        const emp = await prisma.employee.create({
            data: {
                employeeId: s.eid, firstName: s.f, lastName: s.l, designation: s.des,
                salary: s.sal, joiningDate: new Date('2024-01-01'), departmentId: s.dept, userId: user.id
            }
        });
        createdEmployees.push(emp);
    }

    // 6. Customers & Suppliers
    const supplier = await prisma.supplier.create({
        data: {
            name: 'Quantum Components',
            email: 'supply@quantum.com',
            status: 'ACTIVE',
            rating: 5.0
        }
    });
    const customer = await prisma.customer.create({ data: { name: 'Data Corp', email: 'it@datacorp.com' } });

    // 7. Orders (Procurement Process)
    await prisma.order.create({
        data: {
            orderNumber: 'PO-TEST-001',
            supplierId: supplier.id,
            totalAmount: 10000,
            status: 'PENDING', // Updated from DRAFT to PENDING for visibility
            items: { create: [{ productId: createdProds[0].id, quantity: 10, unitPrice: 1000 }] }
        }
    });

    console.log('✔ Staff, Attendance, Payroll, Sales, Orders Ready');
    console.log('✔ Admin User Restored: admin@storeai.com');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
