const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id } });
  const special = entries.filter(e => Math.abs(e.debitAmount - 1350) < 0.001 || Math.abs(e.creditAmount - 1350) < 0.001);
  console.log('special', special.length);
  special.forEach(e => console.log(e.id, e.accountId, e.debitAmount, e.creditAmount, e.referenceType, e.description));
  const group = {};
  entries.forEach(e => {
    const key = `${e.debitAmount}-${e.creditAmount}`;
    group[key] = (group[key] || 0) + 1;
  });
  console.log('group counts', JSON.stringify(group, null, 2).slice(0,1000));
  await prisma.$disconnect();
})();
