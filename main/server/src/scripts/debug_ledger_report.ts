import prisma from '../lib/prisma';

async function main() {
  const tenantId = '97860ccc-c271-4b2e-b9d7-d68399815574';

  const entries = await prisma.ledgerEntry.findMany({
    where: { tenantId },
    include: { account: true },
    orderBy: { createdAt: 'asc' }
  });

  const grouped = entries.reduce((acc: any, entry) => {
    const key = `${entry.referenceType || 'NONE'}|${entry.referenceId || 'NONE'}|${entry.account.accountType}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  for (const key of Object.keys(grouped)) {
    const group = grouped[key];
    const totalDr = group.reduce((sum: number, e: any) => sum + e.debitAmount, 0);
    const totalCr = group.reduce((sum: number, e: any) => sum + e.creditAmount, 0);
    if (Math.abs(totalDr - totalCr) > 0.01) {
      console.log('GROUP', key, 'Dr', totalDr.toFixed(2), 'Cr', totalCr.toFixed(2), 'Diff', (totalDr - totalCr).toFixed(2));
      for (const e of group) {
        console.log('   ', e.account.code, e.account.name, e.debitAmount.toFixed(2), e.creditAmount.toFixed(2), e.description);
      }
    }
  }

  const totalDr = entries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCr = entries.reduce((sum, e) => sum + e.creditAmount, 0);
  console.log('TOTAL Dr', totalDr.toFixed(2), 'TOTAL Cr', totalCr.toFixed(2), 'DIFF', (totalDr - totalCr).toFixed(2));

  await prisma.$disconnect();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});