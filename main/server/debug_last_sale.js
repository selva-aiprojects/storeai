const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) { console.error('No tenant'); process.exit(1); }
  const sale = await prisma.sale.findFirst({ where: { tenantId: tenant.id }, orderBy: { createdAt: 'desc' } });
  console.log('Latest sale', sale ? { id: sale.id, invoiceNo: sale.invoiceNo, totalAmount: sale.totalAmount, taxAmount: sale.taxAmount, isPaid: sale.isPaid } : null);
  const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id, referenceId: sale ? sale.id : undefined }, orderBy: { createdAt: 'asc' } });
  const accounts = await prisma.chartOfAccounts.findMany({ where: { tenantId: tenant.id } });
  const acct = Object.fromEntries(accounts.map(a => [a.id, a]));
  entries.forEach(e => {
    const a = acct[e.accountId];
    console.log('entry', e.referenceType, a ? a.code+' '+a.accountType+' '+a.accountGroup : e.accountId, 'Dr', e.debitAmount, 'Cr', e.creditAmount, 'desc', e.description);
  });
  const tot = entries.reduce((acc, e) => ({ debit: acc.debit + e.debitAmount, credit: acc.credit + e.creditAmount }), { debit: 0, credit: 0 });
  console.log('sale totals', tot);
  await prisma.$disconnect();
})();
