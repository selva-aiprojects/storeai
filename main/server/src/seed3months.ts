import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

async function seedCompleteEnterpriseData() {
  console.log('🚀 Seeding complete 3-month enterprise data ecosystem (Procurement, GRN, Stock, Sales, HR, Accounts)...');

  const slug = `apex-retail-${Date.now()}`;
  const tenantName = 'Apex Global Retail Pvt Ltd';

  // 1. Get SuperAdmin Role
  const superAdminRole = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
  if (!superAdminRole) {
    console.error('SuperAdmin role missing.');
    process.exit(1);
  }

  const plan = await prisma.plan.findFirst({ where: { name: 'PRO' } });

  // 2. Create Tenant (Base Currency INR)
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: slug,
      status: 'ACTIVE',
      planId: plan?.id,
      features: { currency: 'INR', RETAIL_MODULE: true, INVENTORY_MODULE: true, CRM_MODULE: true, FINANCE_MODULE: true, HR_MODULE: true }
    }
  });

  console.log(`✅ Tenant Created: "${tenantName}" (slug: ${slug})`);

  // 3. Create Tenant SuperAdmin Operator
  const passwordHash = await bcrypt.hash('ApexAdmin@2026', 10);
  const user = await prisma.user.create({
    data: {
      email: `admin.${Date.now()}@apexretail.com`,
      password: passwordHash,
      firstName: 'Vikram',
      lastName: 'Mehta',
      role: 'SUPER_ADMIN',
      tenants: {
        create: {
          tenantId: tenant.id,
          roleId: superAdminRole.id
        }
      }
    }
  });

  console.log(`✅ Tenant Operator Created: Vikram Mehta (${user.email})`);

  // 4. Product Categories
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics & Audio', description: 'Consumer audio & gadgets', tenantId: tenant.id } });
  const catApparel = await prisma.category.create({ data: { name: 'Apparel & Wearables', description: 'Fashion apparel & shirts', tenantId: tenant.id } });
  const catHome = await prisma.category.create({ data: { name: 'Home & Office', description: 'Smart office supplies', tenantId: tenant.id } });

  // 5. Products with Cost Price, Selling Price, Transport Cost, GST Rate & Initial Stock
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Apex Wireless ANC Headphones', sku: `APX-ANC-${Date.now().toString().slice(-4)}`, price: 6999, costPrice: 4200, transportationCost: 150, gstRate: 18, stockQuantity: 120, reorderPoint: 25, unit: 'PCS', categoryId: catElectronics.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'Apex Smartwatch Pro', sku: `APX-SW-${Date.now().toString().slice(-4)}`, price: 9999, costPrice: 6100, transportationCost: 200, gstRate: 18, stockQuantity: 85, reorderPoint: 15, unit: 'PCS', categoryId: catElectronics.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'Ergonomic Mesh Executive Chair', sku: `APX-CH-${Date.now().toString().slice(-4)}`, price: 14500, costPrice: 9200, transportationCost: 450, gstRate: 18, stockQuantity: 40, reorderPoint: 10, unit: 'PCS', categoryId: catHome.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'Organic Cotton Polo T-Shirt', sku: `APX-TS-${Date.now().toString().slice(-4)}`, price: 1499, costPrice: 650, transportationCost: 30, gstRate: 12, stockQuantity: 250, reorderPoint: 50, unit: 'PCS', categoryId: catApparel.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'UltraHD 4K Portable Monitor', sku: `APX-MON-${Date.now().toString().slice(-4)}`, price: 18999, costPrice: 13400, transportationCost: 300, gstRate: 18, stockQuantity: 30, reorderPoint: 8, unit: 'PCS', categoryId: catElectronics.id, tenantId: tenant.id } }),
  ]);

  console.log(`✅ 5 Products & 3 Categories Created`);

  // 6. Product Batches with Expiry Dates (FIFO compliance)
  for (const p of products) {
    await prisma.productBatch.create({
      data: {
        productId: p.id,
        batchNumber: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
        quantityReceived: p.stockQuantity,
        quantityAvailable: p.stockQuantity,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        costPrice: p.costPrice
      }
    });
  }

  // 7. Suppliers & Customers
  const supplierA = await prisma.supplier.create({ data: { name: 'TechBridge Wholesale Pvt Ltd', email: 'supply@techbridge.in', contact: '+91 98765 11223', gstNumber: '27AAACT1234F1Z5', paymentTerms: 'Net 30', tenantId: tenant.id } });
  const supplierB = await prisma.supplier.create({ data: { name: 'Global Textile Hub', email: 'orders@textilehub.com', contact: '+91 98220 44556', gstNumber: '29BBBCT5678G2Z1', paymentTerms: 'Net 15', tenantId: tenant.id } });

  const customerA = await prisma.customer.create({ data: { name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', phone: '+91 98111 22334', city: 'Mumbai', tenantId: tenant.id } });
  const customerB = await prisma.customer.create({ data: { name: 'Priya Sharma', email: 'priya.s@yahoo.com', phone: '+91 98222 33445', city: 'Bengaluru', tenantId: tenant.id } });
  const customerC = await prisma.customer.create({ data: { name: 'Ananya Gupta', email: 'ananya.g@outlook.com', phone: '+91 98333 44556', city: 'Delhi', tenantId: tenant.id } });

  // 8. HR Departments & Employees
  const deptSales = await prisma.department.create({ data: { name: 'Sales & Store Operations', tenantId: tenant.id } });
  const deptWMS = await prisma.department.create({ data: { name: 'Warehouse & Logistics', tenantId: tenant.id } });

  const emp1 = await prisma.employee.create({
    data: {
      employeeId: `EMP-APX-${Date.now().toString().slice(-4)}-01`,
      firstName: 'Amit',
      lastName: 'Verma',
      designation: 'Senior Store Cashier',
      departmentId: deptSales.id,
      salary: 35000,
      joiningDate: new Date('2025-01-15'),
      status: 'ACTIVE'
    }
  });

  const emp2 = await prisma.employee.create({
    data: {
      employeeId: `EMP-APX-${Date.now().toString().slice(-4)}-02`,
      firstName: 'Suresh',
      lastName: 'Patil',
      designation: 'Warehouse Manager',
      departmentId: deptWMS.id,
      salary: 45000,
      joiningDate: new Date('2024-11-01'),
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Suppliers, Customers & HR Staff Created`);

  // 9. Initial Equity Capital Daybook Entry
  const now = new Date();
  await prisma.daybook.create({
    data: {
      type: 'INCOME',
      description: 'Owner Initial Equity Investment (Capital)',
      debit: 100000,
      credit: 0,
      date: new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)),
      tenantId: tenant.id
    }
  });

  // 10. Time Series Simulation (May, June, July 2026)
  const months = [
    { name: 'May 2026', monthNum: 5, daysAgoStart: 90, daysAgoEnd: 60, salesCount: 18, poCount: 3 },
    { name: 'June 2026', monthNum: 6, daysAgoStart: 60, daysAgoEnd: 30, salesCount: 28, poCount: 4 },
    { name: 'July 2026', monthNum: 7, daysAgoStart: 30, daysAgoEnd: 0, salesCount: 38, poCount: 5 },
  ];

  let totalRevenueSeeded = 0;
  let totalProcurementSeeded = 0;

  for (const m of months) {
    // Generate Purchase Orders & GRNs
    for (let i = 0; i < m.poCount; i++) {
      const daysAgo = Math.floor(Math.random() * (m.daysAgoStart - m.daysAgoEnd) + m.daysAgoEnd);
      const poDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const prod = products[i % products.length];
      const qty = 15 + (i * 10);
      const amount = qty * prod.costPrice;

      const order = await prisma.order.create({
        data: {
          orderNumber: `PO-APX-${Date.now().toString().slice(-6)}-${i}`,
          supplierId: i % 2 === 0 ? supplierA.id : supplierB.id,
          totalAmount: amount,
          status: 'RECEIVED',
          tenantId: tenant.id,
          createdAt: poDate,
          items: {
            create: [{ productId: prod.id, quantity: qty, unitPrice: prod.costPrice }]
          }
        }
      });

      // Daybook PO Expense
      await prisma.daybook.create({
        data: {
          type: 'EXPENSE',
          description: `PO Inward Disbursement for ${prod.name} (${qty} units)`,
          credit: amount,
          date: poDate,
          tenantId: tenant.id
        }
      });

      totalProcurementSeeded += amount;
    }

    // Generate Sales Invoices
    for (let j = 0; j < m.salesCount; j++) {
      const daysAgo = Math.floor(Math.random() * (m.daysAgoStart - m.daysAgoEnd) + m.daysAgoEnd);
      const saleDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const prod = products[j % products.length];
      const qty = Math.floor(Math.random() * 3) + 1;
      const amount = qty * prod.price;
      const taxAmount = Math.round(amount * (prod.gstRate / 100));
      const totalInvoiceAmount = amount + taxAmount;
      const customersList = [customerA, customerB, customerC];

      const sale = await prisma.sale.create({
        data: {
          invoiceNo: `INV-APX-${Date.now().toString().slice(-6)}-${j}`,
          customerId: customersList[j % customersList.length].id,
          totalAmount: totalInvoiceAmount,
          taxAmount: taxAmount,
          cgstAmount: Math.round(taxAmount / 2),
          sgstAmount: Math.round(taxAmount / 2),
          igstAmount: 0,
          discountAmount: 0,
          roundOff: 0,
          status: 'COMPLETED',
          isPaid: true,
          team: 'SALES',
          tenantId: tenant.id,
          createdAt: saleDate,
          items: {
            create: [{ productId: prod.id, quantity: qty, unitPrice: prod.price }]
          }
        }
      });

      // Post Revenue to Daybook
      await prisma.daybook.create({
        data: {
          type: 'INCOME',
          description: `Sales Revenue Invoice #${sale.invoiceNo}`,
          debit: totalInvoiceAmount,
          date: saleDate,
          tenantId: tenant.id
        }
      });

      totalRevenueSeeded += totalInvoiceAmount;
    }

    // Monthly Payroll Run for the month
    const payrollDate = new Date(2026, m.monthNum - 1, 28);
    for (const emp of [emp1, emp2]) {
      const basic = Math.round(emp.salary * 0.6);
      const hra = Math.round(emp.salary * 0.25);
      const allowances = Math.round(emp.salary * 0.15);
      const pfDeduction = Math.round(basic * 0.12);
      const netPay = emp.salary - pfDeduction;

      await prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month: `${m.name}`,
          basicSalary: basic,
          hra,
          allowances,
          deductions: pfDeduction,
          netSalary: netPay,
          amount: netPay,
          totalPayout: netPay,
          status: 'PAID',
          paymentDate: payrollDate
        }
      });

      // Daybook Payroll Expense
      await prisma.daybook.create({
        data: {
          type: 'EXPENSE',
          description: `Salary Disbursement - ${emp.firstName} ${emp.lastName} (${m.name})`,
          credit: netPay,
          date: payrollDate,
          tenantId: tenant.id
        }
      });
    }
  }

  console.log(`\n🎉 ENTERPRISE DEMO SEEDED SUCCESSFULLY!`);
  console.log(`  Tenant Name        : ${tenantName}`);
  console.log(`  Tenant Slug        : ${slug}`);
  console.log(`  Operator Email     : ${user.email}`);
  console.log(`  Password           : ApexAdmin@2026`);
  console.log(`  Total Revenue      : ₹${totalRevenueSeeded.toLocaleString('en-IN')}`);
  console.log(`  Total Procurement  : ₹${totalProcurementSeeded.toLocaleString('en-IN')}`);
  console.log(`  Net Profit Margin  : ₹${(totalRevenueSeeded - totalProcurementSeeded).toLocaleString('en-IN')}`);
  console.log(`\nLogin at http://localhost:5176/login with slug "${slug}"`);

  await prisma.$disconnect();
}

seedCompleteEnterpriseData().catch(e => {
  console.error('Seeding Error:', e);
  process.exit(1);
});
