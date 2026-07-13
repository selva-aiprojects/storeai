const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const rows = await prisma.ledgerEntry.findMany({
    where: { description: { contains: 'Payment received for' } },
    orderBy: { createdAt: 'asc' },
    take: 20
  });
  const accounts = await prisma.chartOfAccounts.findMany({ where: { tenantId: rows.length > 0 ? rows[0].tenantId : undefined } });
  const acct = Object.fromEntries(accounts.map(a => [a.id, a]));
  rows.forEach(r => {
    const a = acct[r.accountId];
    console.log(r.id, r.referenceType, r.referenceId, a ? a.code : '?', a ? a.accountType : '?', r.debitAmount, r.creditAmount, r.description);
  });
  const tot = rows.reduce((acc, r) => ({ debit: acc.debit + r.debitAmount, credit: acc.credit + r.creditAmount }), { debit: 0, credit: 0 });
  console.log('totals', tot);
  await prisma.$disconnect();
})();
