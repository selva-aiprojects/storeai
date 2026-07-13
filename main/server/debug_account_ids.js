const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const ids = ['a75d22a8-a1d0-4d1d-8564-2992928a6f8b','be14e85b-c85e-4279-890e-3a3ef701f169','86d73962-a683-429c-ac29-ceaa0dd775cf','c8b55f46-df4f-4808-b558-c6f632316cbe','66fdf303-fc0f-4e59-b18c-58dfb9f7fd36','4248','5900','2124'];
  const accounts = await prisma.chartOfAccounts.findMany({ where: { id: { in: ids } } });
  console.log(accounts.map(a => ({ id:a.id, code:a.code, type:a.accountType, group:a.accountGroup, name:a.name })));
  await prisma.$disconnect();
})();
