const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) { console.error('No tenant'); process.exit(1); }
  console.log('Tenant', tenant.id, tenant.name);
  const ledger = await prisma.ledgerEntry.groupBy({
    by: ['referenceType', 'accountId'],
    _sum: { debitAmount: true, creditAmount: true },
    where: { tenantId: tenant.id }
  });
  const accounts = await prisma.chartOfAccounts.findMany({ where: { tenantId: tenant.id } });
  const acct = Object.fromEntries(accounts.map(a => [a.id, a]));
  ledger.forEach(row => {
    const account = acct[row.accountId];
    console.log('REF', row.referenceType, 'ACC', account ? account.code : row.accountId, account ? account.accountType : '?', account ? account.accountGroup : '?', 'Dr', row._sum.debitAmount.toFixed(2), 'Cr', row._sum.creditAmount.toFixed(2));
  });
  const totalsByAccount = await prisma.ledgerEntry.groupBy({
    by: ['accountId'],
    _sum: { debitAmount: true, creditAmount: true },
    where: { tenantId: tenant.id }
  });
  console.log('--- totals by account ---');
  totalsByAccount.forEach(row => {
    const account = acct[row.accountId];
    console.log(account ? account.code : row.accountId, account ? account.name : '', account ? account.accountType : '', account ? account.accountGroup : '', 'Dr', row._sum.debitAmount.toFixed(2), 'Cr', row._sum.creditAmount.toFixed(2));
  });
  const total = await prisma.ledgerEntry.aggregate({
    _sum: { debitAmount: true, creditAmount: true },
    where: { tenantId: tenant.id }
  });
  console.log('TOTAL', total._sum.debitAmount.toFixed(2), total._sum.creditAmount.toFixed(2));
  await prisma.$disconnect();
})();
