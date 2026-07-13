import prisma from '../lib/prisma';

async function main() {
  const groups = await prisma.chartOfAccounts.groupBy({
    by: ['accountGroup'],
    _count: {
      accountGroup: true
    }
  });

  console.log('Account group counts:');
  groups.forEach(g => console.log(`${g.accountGroup}: ${g._count.accountGroup}`));

  await prisma.$disconnect();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});