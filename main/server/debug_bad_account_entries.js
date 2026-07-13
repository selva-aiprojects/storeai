const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const chart = await prisma.chartOfAccounts.findMany({ select: { id: true } });
  const chartIds = new Set(chart.map(c => c.id));
  const bad = await prisma.ledgerEntry.findMany({ where: { accountId: { notIn: chart.map(c => c.id) } }, take: 50 });
  console.log('bad entries count', bad.length);
  bad.forEach(e => console.log(e.id, e.accountId, e.debitAmount, e.creditAmount, e.referenceType, e.description));
  await prisma.$disconnect();
})();
