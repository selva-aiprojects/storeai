import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed3MonthsData() {
  console.log('🚀 Seeding 3 months of enterprise commerce & financial data for new tenant...');

  const slug = `apex-retail-${Date.now()}`;
  const tenantName = 'Apex Global Retail Pvt Ltd';

  // 1. Get or Create SuperAdmin Role
  const superAdminRole = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
  if (!superAdminRole) {
    console.error('SuperAdmin role missing. Run database setup.');
    process.exit(1);
  }

  // 2. Get Plan
  const plan = await prisma.plan.findFirst({ where: { name: 'PRO' } });

  // 3. Create Tenant (Base Currency INR)
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: slug,
      status: 'ACTIVE',
      planId: plan?.id,
      features: { currency: 'INR', RETAIL_MODULE: true, INVENTORY_MODULE: true, CRM_MODULE: true, FINANCE_MODULE: true }
    }
  });

  console.log(`✅ Tenant Created: "${tenantName}" (slug: ${slug}, ID: ${tenant.id})`);

  // 4. Create Tenant SuperAdmin User
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

  // 5. Seed Product Categories
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics & Audio', description: 'Consumer audio & gadgets', tenantId: tenant.id } });
  const catApparel = await prisma.category.create({ data: { name: 'Apparel & Wearables', description: 'Fashion apparel', tenantId: tenant.id } });
  const catHome = await prisma.category.create({ data: { name: 'Home & Office', description: 'Smart office supplies', tenantId: tenant.id } });

  // 6. Seed Products
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Apex Wireless ANC Headphones', sku: 'APX-ANC-01', price: 6999, costPrice: 4200, stockQuantity: 120, reorderPoint: 25, unit: 'PCS', categoryId: catElectronics.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'Apex Smartwatch Pro', sku: 'APX-SW-02', price: 9999, costPrice: 6100, stockQuantity: 85, reorderPoint: 15, unit: 'PCS', categoryId: catElectronics.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'Ergonomic Mesh Executive Chair', sku: 'APX-CH-03', price: 14500, costPrice: 9200, stockQuantity: 40, reorderPoint: 10, unit: 'PCS', categoryId: catHome.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'Organic Cotton Polo T-Shirt', sku: 'APX-TS-04', price: 1499, costPrice: 650, stockQuantity: 250, reorderPoint: 50, unit: 'PCS', categoryId: catApparel.id, tenantId: tenant.id } }),
    prisma.product.create({ data: { name: 'UltraHD 4K Portable Monitor', sku: 'APX-MON-05', price: 18999, costPrice: 13400, stockQuantity: 30, reorderPoint: 8, unit: 'PCS', categoryId: catElectronics.id, tenantId: tenant.id } }),
  ]);

  console.log(`✅ 5 Products & 3 Categories Created`);

  // 7. Seed Suppliers
  const supplierA = await prisma.supplier.create({ data: { name: 'TechBridge Wholesale Pvt Ltd', email: 'supply@techbridge.in', contact: '+91 98765 11223', gstNumber: '27AAACT1234F1Z5', paymentTerms: 'Net 30', tenantId: tenant.id } });
  const supplierB = await prisma.supplier.create({ data: { name: 'Global Textile Hub', email: 'orders@textilehub.com', contact: '+91 98220 44556', gstNumber: '29BBBCT5678G2Z1', paymentTerms: 'Net 15', tenantId: tenant.id } });

  // 8. Seed Customers
  const customerA = await prisma.customer.create({ data: { name: 'Rajesh Kumar', email: 'rajesh.k@gmail.com', phone: '+91 98111 22334', city: 'Mumbai', tenantId: tenant.id } });
  const customerB = await prisma.customer.create({ data: { name: 'Priya Sharma', email: 'priya.s@yahoo.com', phone: '+91 98222 33445', city: 'Bengaluru', tenantId: tenant.id } });
  const customerC = await prisma.customer.create({ data: { name: 'Ananya Gupta', email: 'ananya.g@outlook.com', phone: '+91 98333 44556', city: 'Delhi', tenantId: tenant.id } });

  console.log(`✅ Suppliers & Customers Created`);

  // 9. Seed 3 Months Time Series (May, June, July 2026)
  const now = new Date();
  const months = [
    { name: 'May 2026', daysAgoStart: 90, daysAgoEnd: 60, salesCount: 18, poCount: 3, capital: 100000 },
    { name: 'June 2026', daysAgoStart: 60, daysAgoEnd: 30, salesCount: 28, poCount: 4, capital: 0 },
    { name: 'July 2026', daysAgoStart: 30, daysAgoEnd: 0, salesCount: 38, poCount: 5, capital: 0 },
  ];

  let totalRevenueSeeded = 0;
  let totalProcurementSeeded = 0;

  // Capital Equity Entry
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

  for (const m of months) {
    // Generate Purchase Orders
    for (let i = 0; i < m.poCount; i++) {
      const daysAgo = Math.floor(Math.random() * (m.daysAgoStart - m.daysAgoEnd) + m.daysAgoEnd);
      const poDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const prod = products[i % products.length];
      const qty = 15 + (i * 10);
      const amount = qty * prod.costPrice;

      await prisma.purchaseOrder.create({
        data: {
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

      // Post PO to Daybook Expense
      await prisma.daybook.create({
        data: {
          type: 'EXPENSE',
          description: `PO Disbursement for ${prod.name} (${qty} units)`,
          credit: amount,
          date: poDate,
          tenantId: tenant.id
        }
      });

      totalProcurementSeeded += amount;
    }

    // Generate Sales Orders
    for (let j = 0; j < m.salesCount; j++) {
      const daysAgo = Math.floor(Math.random() * (m.daysAgoStart - m.daysAgoEnd) + m.daysAgoEnd);
      const saleDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const prod = products[j % products.length];
      const qty = Math.floor(Math.random() * 3) + 1;
      const amount = qty * prod.price;
      const customersList = [customerA, customerB, customerC];

      const sale = await prisma.sale.create({
        data: {
          invoiceNo: `INV-APX-${Date.now().toString().slice(-6)}-${j}`,
          customerId: customersList[j % customersList.length].id,
          totalAmount: amount,
          paymentMethod: j % 2 === 0 ? 'CASH' : 'CARD',
          status: 'COMPLETED',
          tenantId: tenant.id,
          createdAt: saleDate,
          items: {
            create: [{ productId: prod.id, quantity: qty, unitPrice: prod.price }]
          }
        }
      });

      // Post Sales Revenue to Daybook
      await prisma.daybook.create({
        data: {
          type: 'INCOME',
          description: `Sales Revenue Invoice #${sale.invoiceNo}`,
          debit: amount,
          date: saleDate,
          tenantId: tenant.id
        }
      });

      totalRevenueSeeded += amount;
    }
  }

  console.log(`\n🎉 3 MONTHS DATA SEEDED SUCCESSFULLY!`);
  console.log(`  Tenant Slug        : ${slug}`);
  console.log(`  Operator Email     : ${user.email}`);
  console.log(`  Password           : ApexAdmin@2026`);
  console.log(`  Total Revenue      : ₹${totalRevenueSeeded.toLocaleString('en-IN')}`);
  console.log(`  Total Procurement  : ₹${totalProcurementSeeded.toLocaleString('en-IN')}`);
  console.log(`  Net Profit Margin  : ₹${(totalRevenueSeeded - totalProcurementSeeded).toLocaleString('en-IN')}`);
  console.log(`\nlogin at http://localhost:5176/login with slug "${slug}"`);

  await prisma.$disconnect();
}

seed3MonthsData().catch(e => {
  console.error('Seeding Error:', e);
  process.exit(1);
});
