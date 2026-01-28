import axios from 'axios';
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:5000/api/v1';

async function benchmark() {
    console.log('\n⏱️  STARTING MULTI-MODULE LATENCY BENCHMARK (Performance Architect)\n');

    // 1. Auth & Token Procurement
    const startAuth = performance.now();
    const authRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@storeai.com',
        password: 'AdminPassword123!'
    });
    const authLatency = performance.now() - startAuth;
    const token = authRes.data.token;

    const client = axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` }
    });

    const modules = [
        { name: 'SYSTEM: Tenant Directory', endpoint: '/tenants/all' },
        { name: 'INVENTORY: Product Catalog', endpoint: '/products' },
        { name: 'INVENTORY: Summary Report', endpoint: '/inventory/summary' },
        { name: 'PROCUREMENT: Order List', endpoint: '/orders' },
        { name: 'HR: Employee Roster', endpoint: '/hr/employees' },
        { name: 'HR: Payroll History', endpoint: '/hr/payroll' },
        { name: 'FINANCE: Tax Summary', endpoint: '/accounts/tax-summary' },
        { name: 'CRM: Customer Base', endpoint: '/customers' },
        { name: 'ADMIN: User Catalog', endpoint: '/users' }
    ];

    console.log(`| ${'Module'.padEnd(25)} | ${'Latency (ms)'.padEnd(12)} | ${'Status'.padEnd(8)} |`);
    console.log(`|${'-'.repeat(27)}|${'-'.repeat(14)}|${'-'.repeat(10)}|`);
    console.log(`| ${'AUTH: Authorization'.padEnd(25)} | ${authLatency.toFixed(2).padEnd(12)} | ✅ OK     |`);

    for (const mod of modules) {
        try {
            const start = performance.now();
            await client.get(mod.endpoint);
            const latency = performance.now() - start;

            let status = '✅ GREEN';
            if (latency > 200) status = '⚠️ AMBER';
            if (latency > 500) status = '🚨 RED';

            console.log(`| ${mod.name.padEnd(25)} | ${latency.toFixed(2).padEnd(12)} | ${status.padEnd(8)} |`);
        } catch (e: any) {
            console.log(`| ${mod.name.padEnd(25)} | ${'FAILED'.padEnd(12)} | ❌ ERROR  |`);
        }
    }

    console.log('\n🏁 BENCHMARK COMPLETE\n');
}

benchmark().catch(console.error);
