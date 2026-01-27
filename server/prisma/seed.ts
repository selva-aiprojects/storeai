import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING COMPREHENSIVE ENTERPRISE DATA SEED ---');

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    // 1. Clean Database
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
        console.log('⚠ Cleanup warning:', e);
    }

    // 2. Departments
    const depts = ["Sales", "Procurement", "Operations", "HR", "Finance", "Management", "IT Support"];
    const createdDepts: Record<string, any> = {};
    for (const name of depts) {
        createdDepts[name] = await prisma.department.create({ data: { name } });
    }

    // 3. Categories
    const categories = [
        { name: 'Server Infrastructure', desc: 'Compute & Rack hardware' },
        { name: 'Networking', desc: 'Enterprise connectivity' },
        { name: 'Storage Solutions', desc: 'SAN/NAS and Flash' },
        { name: 'Security Hardware', desc: 'Firewalls and CCTV' }
    ];
    const createdCats: Record<string, any> = {};
    for (const cat of categories) {
        createdCats[cat.name] = await prisma.category.create({ data: { name: cat.name, description: cat.desc } });
    }

    // 4. Warehouses
    const whMain = await prisma.warehouse.create({ data: { name: 'London Central Hub', location: 'Heathrow Logistics Park', isDefault: true } });
    const whRegional = await prisma.warehouse.create({ data: { name: 'Manchester North', location: 'Trafford Centre', isDefault: false } });
    const whBackup = await prisma.warehouse.create({ data: { name: 'Birmingham SEC', location: 'NEC Park', isDefault: false } });

    // 5. Products
    const products = [
        { sku: 'SRV-DL380', name: 'HPE ProLiant DL380 Gen11', price: 9500, cost: 6800, cat: 'Server Infrastructure', stock: 12 },
        { sku: 'NET-C9200', name: 'Cisco Catalyst 9200L', price: 2100, cost: 1400, cat: 'Networking', stock: 25 },
        { sku: 'STO-FLS-10TB', name: 'PureStorage FlashArray 10TB', price: 18000, cost: 13500, cat: 'Storage Solutions', stock: 5 },
        { sku: 'SEC-FW-100', name: 'FortiGate 100F Firewall', price: 3200, cost: 2400, cat: 'Security Hardware', stock: 18 }
    ];
    const createdProds: any[] = [];
    for (const p of products) {
        const prod = await prisma.product.create({
            data: {
                sku: p.sku, name: p.name, price: p.price, costPrice: p.cost,
                stockQuantity: p.stock, categoryId: createdCats[p.cat].id,
                isBatchTracked: true, reorderPoint: 5, avgDailySales: 0.5
            }
        });
        createdProds.push(prod);

        // Initial Stock with Batch
        await prisma.stock.create({
            data: {
                productId: prod.id, warehouseId: whMain.id, quantity: p.stock,
                batchNumber: 'LOT-2024-001', expiryDate: new Date('2028-12-01')
            }
        });
    }

    // 6. Users & Employees
    const staff = [
        { email: 'admin@storeai.com', f: 'Alex', l: 'Rivers', role: 'SUPER_ADMIN', des: 'System Architect', sal: 95000, dept: 'Management', eid: 'SA-101' },
        { email: 'sarah.c@storeai.com', f: 'Sarah', l: 'Chen', role: 'HR', des: 'HR Director', sal: 78000, dept: 'HR', eid: 'HR-202' },
        { email: 'mike.v@storeai.com', f: 'Michael', l: 'Vance', role: 'STAFF', des: 'Sales Lead', sal: 65000, dept: 'Sales', eid: 'SL-303' },
        { email: 'ellen.r@storeai.com', f: 'Ellen', l: 'Ripley', role: 'SHIPMENT', des: 'Logistics Spec', sal: 58000, dept: 'Operations', eid: 'OPS-404' }
    ];

    const adminUser = await prisma.user.create({ data: { email: staff[0].email, password: hashedPassword, firstName: staff[0].f, lastName: staff[0].l, role: staff[0].role } });
    await prisma.employee.create({ data: { employeeId: staff[0].eid, firstName: staff[0].f, lastName: staff[0].l, designation: staff[0].des, salary: staff[0].sal, joiningDate: new Date('2023-01-01'), departmentId: createdDepts['Management'].id, userId: adminUser.id } });

    for (let i = 1; i < staff.length; i++) {
        const s = staff[i];
        const user = await prisma.user.create({ data: { email: s.email, password: hashedPassword, firstName: s.f, lastName: s.l, role: s.role } });
        const emp = await prisma.employee.create({ data: { employeeId: s.eid, firstName: s.f, lastName: s.l, designation: s.des, salary: s.sal, joiningDate: new Date('2024-02-01'), departmentId: createdDepts[s.dept].id, userId: user.id } });

        await prisma.payroll.create({
            data: { employeeId: emp.id, amount: s.sal / 12, totalPayout: s.sal / 12, month: 'January 2026', status: 'PAID' }
        });
    }

    // 7. Partners & Customers (EXCESSIVE DATA FOR DEMO)
    const suppliers = [
        { name: 'Global Tech Distribution', email: 'orders@globaltech.com', contact: '+44 20 7946 0000', status: 'ACTIVE', rating: 4.9, terms: 'Net 30' },
        { name: 'Cisco Systems UK', email: 'supply@cisco.co.uk', contact: '+44 20 7946 1111', status: 'ACTIVE', rating: 4.7, terms: 'Net 45' },
        { name: 'SecureLink Ltd', email: 'sales@securelink.com', contact: '+44 20 7946 2222', status: 'ACTIVE', rating: 4.5, terms: 'Net 30' }
    ];
    const createdSuppliers = [];
    for (const s of suppliers) {
        createdSuppliers.push(await prisma.supplier.create({ data: { name: s.name, email: s.email, contact: s.contact, status: s.status, rating: s.rating, paymentTerms: s.terms } }));
    }

    const customers = [
        { name: 'DataFlow Systems UK', email: 'it@dataflow.co.uk', city: 'Manchester' },
        { name: 'CloudOps International', email: 'billing@cloudops.com', city: 'London' },
        { name: 'Fintech Solutions Ltd', email: 'procurement@fintech.io', city: 'Birmingham' },
        { name: 'Secure Bank PLC', email: 'ops@securebank.co.uk', city: 'Edinburgh' },
        { name: 'Retail Giants UK', email: 'inventory@retailgiants.com', city: 'Leeds' }
    ];
    const createdCustomers = [];
    for (const c of customers) {
        createdCustomers.push(await prisma.customer.create({ data: { name: c.name, email: c.email, city: c.city, address: 'Business Park Suite ' + Math.floor(Math.random() * 100) } }));
    }

    // 8. Workflows (Bulk Orders & Sales)
    // DRAFT
    await prisma.order.create({
        data: { orderNumber: 'PO-2026-001', supplierId: createdSuppliers[0].id, totalAmount: 13600, status: 'DRAFT', items: { create: [{ productId: createdProds[0].id, quantity: 2, unitPrice: 6800 }] } }
    });
    // APPROVED
    await prisma.order.create({
        data: { orderNumber: 'PO-2026-002', supplierId: createdSuppliers[1].id, totalAmount: 42000, status: 'APPROVED', items: { create: [{ productId: createdProds[1].id, quantity: 30, unitPrice: 1400 }] } }
    });
    // PARTIAL
    await prisma.order.create({
        data: { orderNumber: 'PO-2026-003', supplierId: createdSuppliers[2].id, totalAmount: 7200, status: 'PARTIAL_RECEIVED', items: { create: [{ productId: createdProds[3].id, quantity: 3, unitPrice: 2400 }] } }
    });

    // SALES
    await prisma.sale.create({
        data: { invoiceNo: 'INV-2026-101', totalAmount: 19000, taxAmount: 0, customerId: createdCustomers[0].id, team: 'SALES', status: 'DELIVERED', items: { create: [{ productId: createdProds[0].id, quantity: 2, unitPrice: 9500 }] } }
    });
    await prisma.sale.create({
        data: { invoiceNo: 'INV-2026-102', totalAmount: 10500, taxAmount: 0, customerId: createdCustomers[1].id, team: 'DIRECT', status: 'SHIPPED', items: { create: [{ productId: createdProds[1].id, quantity: 5, unitPrice: 2100 }] } }
    });
    await prisma.sale.create({
        data: { invoiceNo: 'INV-2026-103', totalAmount: 36000, taxAmount: 0, customerId: createdCustomers[2].id, team: 'SALES', status: 'PENDING', items: { create: [{ productId: createdProds[2].id, quantity: 2, unitPrice: 18000 }] } }
    });

    // 9. Financial Ledger - MAJOR INVESTMENT
    await prisma.ledger.create({ data: { title: 'Seed Series Investment Round', amount: 100000, type: 'CREDIT', category: 'INVESTMENT', description: 'Institutional investment for growth' } });
    await prisma.ledger.create({ data: { title: 'Operational Fixed Equity', amount: 500000, type: 'CREDIT', category: 'EQUITY' } });
    await prisma.ledger.create({ data: { title: 'Office Lease Q1', amount: 15000, type: 'DEBIT', category: 'OPERATIONAL' } });
    await prisma.ledger.create({ data: { title: 'Infrastructure Upgrade', amount: 8500, type: 'DEBIT', category: 'ASSETS' } });

    console.log('✔ DEMO READY: Massive Data Pulse established.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
