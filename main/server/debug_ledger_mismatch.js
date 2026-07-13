const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) { console.error('No tenant'); process.exit(1); }
  const totals = await prisma.ledgerEntry.groupBy({
    by: ['referenceType', 'accountId'],
    _sum: { debitAmount: true, creditAmount: true },
    where: { tenantId: tenant.id }
  });
  const accounts = await prisma.chartOfAccounts.findMany({ where: { tenantId: tenant.id } });
  const acct = Object.fromEntries(accounts.map(a => [a.id, a]));
  const agg = {};
  totals.forEach(row => {
    const a = acct[row.accountId];
    const key = `${row.referenceType} | ${a ? a.code : row.accountId} | ${a ? a.accountType : ''}`;
    agg[key] = { debit: row._sum.debitAmount, credit: row._sum.creditAmount };
  });
  console.log('--- Reference x Account Totals ---');
  Object.entries(agg).sort().forEach(([k,v]) => {
    if (v.debit !== v.credit) console.log(k, 'Dr', v.debit.toFixed(2), 'Cr', v.credit.toFixed(2));
  });
  console.log('--- Account Totals ---');
  const accTotals = await prisma.ledgerEntry.groupBy({ by:['accountId'], _sum:{debitAmount:true, creditAmount:true}, where:{ tenantId: tenant.id } });
  accTotals.sort((a,b)=> (acct[a.accountId]?.code||'').localeCompare(acct[b.accountId]?.code||''));
  accTotals.forEach(row=>{
    const a=acct[row.accountId];
    const diff = (row._sum.debitAmount - row._sum.creditAmount);
    if(Math.abs(diff) > 0.01) console.log(a?.code || row.accountId, a?.name || '', a?.accountType || '', a?.accountGroup || '', 'Dr', row._sum.debitAmount.toFixed(2), 'Cr', row._sum.creditAmount.toFixed(2), 'Diff', diff.toFixed(2));
  });
  const total = await prisma.ledgerEntry.aggregate({ _sum:{debitAmount:true, creditAmount:true}, where:{tenantId:tenant.id} });
  console.log('TOTAL', total._sum.debitAmount.toFixed(2), total._sum.creditAmount.toFixed(2), 'DIFF', (total._sum.debitAmount - total._sum.creditAmount).toFixed(2));
  await prisma.$disconnect();
})();
