const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const groups = await prisma.ledgerEntry.groupBy({
    by: ['referenceType'],
    _sum: { debitAmount: true, creditAmount: true },
    where: { tenantId: tenant.id }
  });
  console.log('groups', JSON.stringify(groups, null, 2));
  await prisma.$disconnect();
})();
