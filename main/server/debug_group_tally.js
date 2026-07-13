const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: tenant.id }, include: { account: true } });
  const totals = entries.reduce((acc, e) => {
    acc.totalDebit += e.debitAmount;
    acc.totalCredit += e.creditAmount;
    const key = `${e.account.accountGroup}|${e.account.accountType}`;
    if (!acc.group[key]) acc.group[key] = { group: e.account.accountGroup, type: e.account.accountType, debit: 0, credit: 0 };
    acc.group[key].debit += e.debitAmount;
    acc.group[key].credit += e.creditAmount;
    return acc;
  }, { totalDebit: 0, totalCredit: 0, group: {} });
  console.log('TOTAL', acc.totalDebit, acc.totalCredit);
})();
