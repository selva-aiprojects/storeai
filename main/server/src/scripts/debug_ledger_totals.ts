import prisma from '../lib/prisma';

async function main() {
  const tenantId = '97860ccc-c271-4b2e-b9d7-d68399815574';
  const accounts = await prisma.chartOfAccounts.findMany({
    where: { tenantId },
    include: { ledgerEntries: true },
    orderBy: { code: 'asc' }
  });

  let totalDr = 0;
  let totalCr = 0;

  for (const acc of accounts) {
    const debit = acc.ledgerEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const credit = acc.ledgerEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    if (debit !== 0 || credit !== 0) {
      console.log(`${acc.code} ${acc.name} ${acc.accountGroup} ${acc.accountType} Dr:${debit.toFixed(2)} Cr:${credit.toFixed(2)} Bal:${(debit - credit).toFixed(2)}`);
    }
    totalDr += debit;
    totalCr += credit;
  }

  console.log('TOTAL Dr', totalDr.toFixed(2), 'TOTAL Cr', totalCr.toFixed(2), 'DIFF', (totalDr - totalCr).toFixed(2));
  await prisma.$disconnect();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
