const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const sales = await prisma.sale.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'asc' } });
  console.log('Sales count', sales.length);
  for (const sale of sales) {
    const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id, referenceId: sale.id }, orderBy: { createdAt: 'asc' } });
    const tot = entries.reduce((acc, e) => ({ debit: acc.debit + e.debitAmount, credit: acc.credit + e.creditAmount }), { debit: 0, credit: 0 });
    console.log('SALE', sale.invoiceNo, 'total', sale.totalAmount, 'tax', sale.taxAmount, 'paid', sale.payment?.amount, 'isPaid', sale.isPaid, 'dr', tot.debit.toFixed(2), 'cr', tot.credit.toFixed(2));
    entries.forEach(e => console.log('   ', e.referenceType, e.debitAmount, e.creditAmount, e.description));
  }
  await prisma.$disconnect();
})();
