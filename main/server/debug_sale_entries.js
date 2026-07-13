const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const rows = await prisma.ledgerEntry.findMany({
    where: { tenantId: tenant.id, referenceType: 'SALE' },
    orderBy: { createdAt: 'asc' }
  });
  const accounts = await prisma.chartOfAccounts.findMany({ where: { tenantId: tenant.id } });
  const acct = Object.fromEntries(accounts.map(a => [a.id, a]));
  rows.forEach(e => console.log(e.id, acct[e.accountId] ? acct[e.accountId].code : '?', acct[e.accountId] ? acct[e.accountId].accountType : '?', acct[e.accountId] ? acct[e.accountId].accountGroup : '?', 'Dr', e.debitAmount, 'Cr', e.creditAmount, 'desc', e.description));
  const tot = rows.reduce((acc, e) => ({ debit: acc.debit + e.debitAmount, credit: acc.credit + e.creditAmount }), { debit: 0, credit: 0 });
  console.log('SALE totals', tot);
  await prisma.$disconnect();
})();
