const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const entries = await prisma.ledgerEntry.findMany({
    where: { referenceType: 'SALE' },
    orderBy: { createdAt: 'asc' }
  });
  const accounts = await prisma.chartOfAccounts.findMany({ where: { tenantId: entries.length > 0 ? entries[0].tenantId : undefined } });
  const acct = Object.fromEntries(accounts.map(a => [a.id, a]));
  entries.forEach(e => {
    const a = acct[e.accountId];
    console.log('entry', e.id, e.referenceId, e.accountId, a ? a.code + ' ' + a.accountType + ' ' + a.accountGroup : '?', 'Dr', e.debitAmount, 'Cr', e.creditAmount, 'desc', e.description);
  });
  const tot = entries.reduce((acc, e) => ({ debit: acc.debit + e.debitAmount, credit: acc.credit + e.creditAmount }), { debit: 0, credit: 0 });
  console.log('totals', tot);
  await prisma.$disconnect();
})();
