const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const rows = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id, referenceType: 'AR' } });
  console.log('AR rows', rows.length);
  rows.forEach(r => console.log(r.id, r.accountId, r.debitAmount, r.creditAmount, r.description));
  const totals = rows.reduce((acc, r) => ({ debit: acc.debit + r.debitAmount, credit: acc.credit + r.creditAmount }), { debit: 0, credit: 0 });
  console.log('totals', totals);
  await prisma.$disconnect();
})();
