const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const cashAccount = await prisma.chartOfAccounts.findFirst({ where: { tenantId: tenant.id, accountType: 'CASH' } });
  console.log('Cash account', cashAccount ? { id: cashAccount.id, code: cashAccount.code } : null);
  const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id, accountId: cashAccount.id }, orderBy: { createdAt: 'asc' } });
  entries.forEach(e => console.log(e.id, e.referenceType, e.referenceId, e.debitAmount, e.creditAmount, e.description));
  const totals = entries.reduce((acc, e) => ({ debit: acc.debit + e.debitAmount, credit: acc.credit + e.creditAmount }), { debit: 0, credit: 0 });
  console.log('cash totals', totals);
  await prisma.$disconnect();
})();
