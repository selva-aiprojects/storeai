const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id }, include: { account: true } });
  const byGroup = {};
  entries.forEach(e => {
    const group = e.account.accountGroup;
    const type = e.account.accountType;
    const key = `${group}|${type}`;
    if (!byGroup[key]) byGroup[key] = { debit: 0, credit: 0, group, type }; 
    byGroup[key].debit += e.debitAmount;
    byGroup[key].credit += e.creditAmount;
  });
  console.log(JSON.stringify(Object.values(byGroup).map(v=>({group:v.group,type:v.type,debit:v.debit,credit:v.credit,diff:(v.debit-v.credit).toFixed(2)})), null, 2));
  await prisma.$disconnect();
})();
