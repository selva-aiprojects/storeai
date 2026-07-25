import prisma from './lib/prisma';

async function checkSeededData() {
  const salesCount = await prisma.sale.count();
  const salesTotal = await prisma.sale.aggregate({ _sum: { totalAmount: true } });
  const poCount = await prisma.order.count();
  const poTotal = await prisma.order.aggregate({ _sum: { totalAmount: true } });
  const daybookCount = await prisma.daybook.count();
  const empCount = await prisma.employee.count();
  const payrollCount = await prisma.payroll.count();

  console.log(`=== DATABASE SEED CHECK RESULTS ===`);
  console.log(`Total Sales Invoices Logged : ${salesCount} (Value: ₹${salesTotal._sum.totalAmount?.toLocaleString('en-IN')})`);
  console.log(`Total Purchase Orders Logged: ${poCount} (Value: ₹${poTotal._sum.totalAmount?.toLocaleString('en-IN')})`);
  console.log(`Total Daybook Journal Entries: ${daybookCount}`);
  console.log(`Total Employees & Payroll    : ${empCount} employees (${payrollCount} monthly payroll slips)`);
  
  await prisma.$disconnect();
}

checkSeededData();
