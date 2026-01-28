import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
    ],
});

async function profile() {
    console.log('\n🔍 ARCHITECTURAL PROFILING: PROCUREMENT & SYSTEM MODULES\n');

    // @ts-ignore
    prisma.$on('query', (e: any) => {
        if (e.duration > 100) {
            console.log(`⚠️ SLOW QUERY detected: ${e.query}`);
            console.log(`⏱️ Duration: ${e.duration}ms`);
        }
    });

    const tenant = await prisma.tenant.findUnique({ where: { slug: 'storeai' } });
    if (!tenant) return;

    // 1. Profile PROCUREMENT: getOrders simulation
    console.log('--- Profiling PROCUREMENT: getOrders ---');
    const startProc = performance.now();
    const orders = await prisma.order.findMany({
        where: { tenantId: tenant.id },
        include: {
            supplier: true,
            items: { include: { product: true } },
            goodsReceipts: { include: { items: true } }
        }
    });
    const endProc = performance.now();
    console.log(`Total DB Execution + Hydration: ${(endProc - startProc).toFixed(2)}ms`);
    console.log(`Result Set Size: ${orders.length} orders`);
    if (orders.length > 0) {
        const payloadSize = JSON.stringify(orders).length;
        console.log(`Payload Serialization Size: ${(payloadSize / 1024).toFixed(2)} KB`);
    }

    // 2. Profile SYSTEM: getAllTenants simulation
    console.log('\n--- Profiling SYSTEM: getAllTenants ---');
    const startSys = performance.now();
    const tenants = await prisma.tenant.findMany({
        include: {
            plan: true,
            _count: { select: { users: true } }
        }
    });
    const endSys = performance.now();
    console.log(`Total DB Execution + Hydration: ${(endSys - startSys).toFixed(2)}ms`);
    console.log(`Result Set Size: ${tenants.length} tenants`);

    await prisma.$disconnect();
}

profile().catch(console.error);
