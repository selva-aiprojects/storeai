const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const sales = await prisma.sale.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'asc' } });
  for (const sale of sales) {
    const entries = await prisma.ledgerEntry.findMany({ where: { referenceId: sale.id } });
    const totals = entries.reduce((acc, e) => ({ debit: acc.debit + e.debitAmount, credit: acc.credit + e.creditAmount }), { debit: 0, credit: 0 });
    if (Math.abs(totals.debit - totals.credit) > 0.01) {
      console.log('unbalanced sale', sale.invoiceNo, sale.id, sale.totalAmount, sale.taxAmount, sale.isPaid, totals);
      entries.forEach(e => console.log('  ', e.referenceType, e.accountId, e.debitAmount, e.creditAmount, e.description));
    }
  }
  await prisma.$disconnect();
})();
