
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Expert Financial Seeding for Master Store (technova)...');

    const tenantSlug = 'technova';
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

    if (!tenant) {
        console.error(`❌ Tenant with slug "${tenantSlug}" not found!`);
        process.exit(1);
    }

    const tId = tenant.id;

    // --- 1. MANUALLY STAGED CASCADE CLEANUP (DIRECT ID PATHS) ---
    console.log('🧹 Cleaning up records for Master Store using direct-ID paths...');

    const deleteByTenant = async (model: string) => {
        try {
            await (prisma as any)[model].deleteMany({ where: { tenantId: tId } });
        } catch (e) {
            console.warn(`[CLEANUP] Model ${model} skip/fail: ${e.message}`);
        }
    };

    // Stage 0: Gather IDs
    const empIds = (await prisma.employee.findMany({ where: { department: { tenantId: tId } }, select: { id: true } })).map(e => e.id);
    const ordIds = (await prisma.order.findMany({ where: { tenantId: tId }, select: { id: true } })).map(o => o.id);
    const sleIds = (await prisma.sale.findMany({ where: { tenantId: tId }, select: { id: true } })).map(s => s.id);
    const retIds = (await prisma.salesReturn.findMany({ where: { tenantId: tId }, select: { id: true } })).map(r => r.id);
    const invIds = (await prisma.inventoryDocument.findMany({ where: { tenantId: tId }, select: { id: true } })).map(i => i.id);
    const delIds = (await prisma.deal.findMany({ where: { tenantId: tId }, select: { id: true } })).map(d => d.id);
    const sorIds = (await prisma.salesOrder.findMany({ where: { tenantId: tId }, select: { id: true } })).map(s => s.id);
    const reqIds = (await prisma.purchaseRequisition.findMany({ where: { tenantId: tId }, select: { id: true } })).map(r => r.id);

    // Stage 1: Deep children (items/logs)
    await prisma.attendance.deleteMany({ where: { employeeId: { in: empIds } } });
    await prisma.payroll.deleteMany({ where: { employeeId: { in: empIds } } });
    await prisma.salaryStructure.deleteMany({ where: { employeeId: { in: empIds } } });
    await prisma.leave.deleteMany({ where: { employeeId: { in: empIds } } });

    await prisma.goodsReceiptItem.deleteMany({ where: { goodsReceipt: { orderId: { in: ordIds } } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ordIds } } });
    await prisma.saleItem.deleteMany({ where: { saleId: { in: sleIds } } });
    await prisma.salesReturnItem.deleteMany({ where: { salesReturnId: { in: retIds } } });
    await prisma.inventoryDocumentItem.deleteMany({ where: { documentId: { in: invIds } } });
    await prisma.dealItem.deleteMany({ where: { dealId: { in: delIds } } });
    await prisma.activity.deleteMany({ where: { dealId: { in: delIds } } });
    await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: { in: sorIds } } });
    await prisma.purchaseRequisitionItem.deleteMany({ where: { requisitionId: { in: reqIds } } });

    // Stage 2: Transaction Headers
    await prisma.goodsReceipt.deleteMany({ where: { orderId: { in: ordIds } } });
    await deleteByTenant('order');
    await deleteByTenant('salesReturn');
    await deleteByTenant('salesRegister');
    await deleteByTenant('payment');
    await deleteByTenant('sale');
    await deleteByTenant('deal');
    await deleteByTenant('salesOrder');
    await deleteByTenant('purchaseQuotation');
    await deleteByTenant('purchaseRequisition');
    await deleteByTenant('inventoryDocument');

    // Stage 3: Secondary Masters & Ledgers
    await deleteByTenant('stockLedger');
    await deleteByTenant('stock');
    await deleteByTenant('productBatch');
    await deleteByTenant('supplierAgreement');
    await deleteByTenant('pricingRule');

    // Stage 4: Primary Masters
    await deleteByTenant('product');
    await prisma.employee.deleteMany({ where: { department: { tenantId: tId } } });
    await deleteByTenant('department');
    await deleteByTenant('category');
    await deleteByTenant('customer');
    await deleteByTenant('supplier');
    await deleteByTenant('daybook');
    await deleteByTenant('gSTLog');
    await deleteByTenant('activityLog');

    console.log('✅ Manual Cleanup complete. Starting Seeding...');

    // --- 2. CORE MASTER DATA (Using Upsert for Resilience) ---
    console.log('🏗️ Seeding Core Master Data...');

    const warehouse = await prisma.warehouse.upsert({
        where: { tenantId_name: { tenantId: tId, name: 'Main Hub Warehouse' } },
        update: {},
        create: { name: 'Main Hub Warehouse', location: 'Section A, Hub', isDefault: true, tenantId: tId }
    });

    const category = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tId, name: 'Cloud Infrastructure' } },
        update: { description: 'Enterprise Server Gear' },
        create: { name: 'Cloud Infrastructure', description: 'Enterprise Server Gear', tenantId: tId }
    });

    const supplier = await prisma.supplier.upsert({
        where: { tenantId_email: { tenantId: tId, email: 'sales@apex.com' } },
        update: { name: 'Apex Logistics' },
        create: { name: 'Apex Logistics', email: 'sales@apex.com', tenantId: tId }
    });

    const customer = await prisma.customer.upsert({
        where: { tenantId_name: { tenantId: tId, name: 'TechCorp Solutions' } },
        update: { email: 'proc@techcorp.com' },
        create: { name: 'TechCorp Solutions', email: 'proc@techcorp.com', tenantId: tId }
    });

    const product = await prisma.product.upsert({
        where: { tenantId_sku: { tenantId: tId, sku: 'SRV-ENT-001' } },
        update: {
            name: 'Enterprise Server Node X1',
            price: 1500,
            costPrice: 1000,
            stockQuantity: 0 // Reset for seeding
        },
        create: {
            sku: 'SRV-ENT-001',
            name: 'Enterprise Server Node X1',
            price: 1500,
            costPrice: 1000,
            categoryId: category.id,
            tenantId: tId,
            stockQuantity: 0,
            unit: 'unit'
        }
    });

    // --- 3. CAPITAL INVESTMENT ($100,000) ---
    console.log('💰 Seeding $100k Capital Investment (Balance Sheet Impact)...');
    await prisma.daybook.create({
        data: {
            date: new Date(),
            type: 'CAPITAL',
            description: 'Initial Capital Investment - Series Seed',
            debit: 100000,
            credit: 100000,
            status: 'COMPLETED',
            tenantId: tId
        }
    });

    // --- 4. PROCUREMENT WORKFLOW ($50,000 + 18% GST) ---
    console.log('📦 Seeding $50k Procurement (Bill/Invoice Stage)...');
    const procurementCost = 50000;
    const inputGst = procurementCost * 0.18;
    const apTotal = procurementCost + inputGst;

    const order = await prisma.order.create({
        data: {
            orderNumber: `PO-${Date.now()}`,
            status: 'RECEIVED',
            totalAmount: apTotal,
            taxAmount: inputGst,
            supplierId: supplier.id,
            tenantId: tId,
            items: {
                create: { productId: product.id, quantity: 50, unitPrice: 1000 }
            }
        }
    });

    await prisma.gSTLog.create({
        data: {
            type: 'INPUT',
            amount: inputGst,
            isPaid: true,
            referenceId: order.id,
            tenantId: tId
        }
    });

    await prisma.goodsReceipt.create({
        data: {
            grnNumber: `GRN-${Date.now()}`,
            orderId: order.id,
            warehouseId: warehouse.id,
            items: { create: { productId: product.id, quantity: 50 } }
        }
    });

    await prisma.stockLedger.create({
        data: {
            productId: product.id,
            quantityIn: 50,
            quantityOut: 0,
            balanceQuantity: 50,
            transactionType: 'INWARD',
            referenceType: 'PURCHASE_ORDER',
            referenceId: order.id,
            tenantId: tId
        }
    });

    await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: 50 }
    });

    // --- 5. SALES WORKFLOW ($57,500 + 18% GST = 15% Margin) ---
    console.log('💵 Seeding Sales with Revenue, COGS, and GST Output...');
    const revenue = 57500;
    const outputGst = revenue * 0.18;
    const arTotal = revenue + outputGst;
    const cogsValue = 50000;

    const sale = await prisma.sale.create({
        data: {
            invoiceNo: `INV-${Date.now()}`,
            totalAmount: arTotal,
            taxAmount: outputGst,
            status: 'PENDING',
            isPaid: false,
            customerId: customer.id,
            tenantId: tId,
            items: {
                create: { productId: product.id, quantity: 50, unitPrice: 1150 }
            }
        }
    });

    await prisma.gSTLog.create({
        data: {
            type: 'OUTPUT',
            amount: outputGst,
            isPaid: false,
            referenceId: sale.id,
            tenantId: tId
        }
    });

    await prisma.stockLedger.create({
        data: {
            productId: product.id,
            quantityIn: 0,
            quantityOut: 50,
            balanceQuantity: 0,
            transactionType: 'OUTWARD',
            referenceType: 'SALE',
            referenceId: sale.id,
            tenantId: tId
        }
    });

    // Accounting Entry: COGS Expense
    await prisma.daybook.create({
        data: {
            date: new Date(),
            type: 'EXPENSE',
            description: `COGS for INV-${sale.invoiceNo}`,
            debit: 0,
            credit: cogsValue,
            status: 'COMPLETED',
            tenantId: tId
        }
    });

    // Accounting Entry: Sales Revenue
    await prisma.daybook.create({
        data: {
            date: new Date(),
            type: 'INCOME',
            description: `Revenue from Sales - ${sale.invoiceNo}`,
            debit: revenue,
            credit: 0,
            status: 'COMPLETED',
            tenantId: tId
        }
    });

    await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: 0 }
    });

    // --- 6. HR & PAYROLL ---
    console.log('👥 Seeding HR (Salary Expense & Net Payables)...');
    const deptName = 'Operations Hub';
    const dept = await prisma.department.upsert({
        where: { tenantId_name: { tenantId: tId, name: deptName } },
        update: {},
        create: { name: deptName, tenantId: tId }
    });

    const emp = await prisma.employee.create({
        data: {
            employeeId: `EMP-${Date.now()}`,
            firstName: 'Alice',
            lastName: 'Master',
            designation: 'Architect',
            salary: 120000,
            departmentId: dept.id,
            joiningDate: new Date('2025-01-01')
        }
    });

    await prisma.payroll.create({
        data: {
            amount: 10000,
            basicSalary: 6000,
            netSalary: 9000,
            totalPayout: 10000,
            month: 'January 2026',
            status: 'PAID',
            employeeId: emp.id
        }
    });

    // Accounting Entry: Salary Expense
    await prisma.daybook.create({
        data: {
            date: new Date(),
            type: 'EXPENSE',
            description: `Salary Payout - Jan 2026`,
            debit: 0,
            credit: 10000,
            status: 'COMPLETED',
            tenantId: tId
        }
    });

    console.log('✅ MASTER STORE SEEDED WITH ACCURATE ACCOUNTING!');
    console.log('📈 Financial Reconciliation:');
    console.log(`- GST Position: Output($${outputGst}) - Input($${inputGst}) = $${outputGst - inputGst} Payable`);
    console.log(`- Net Profit: Revenue($${revenue}) - COGS($${cogsValue}) = $${revenue - cogsValue}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding Fatal Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
