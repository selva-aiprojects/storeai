
import axios from 'axios';

async function verifyFinance() {
    const baseURL = 'http://localhost:5000/api/v1';

    console.log('\n📊 Verifying Finance Data for STOREAI CORPORATE HUB...\n');

    try {
        // 1. Login
        const loginResp = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@storeai.com',
            password: 'AdminPassword123!',
            tenantSlug: 'storeai'
        });

        const token = loginResp.data.token;
        const tenantId = loginResp.data.user.activeTenant.id;

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Get Balance Sheet
        console.log('--- BALANCE SHEET ---');
        const bsResp = await axios.get(`${baseURL}/finance/balance-sheet`, config);
        const bs = bsResp.data;

        console.log(`ASSETS:`);
        console.log(`  Cash/Bank:      $${bs.assets.cash.toLocaleString()}`);
        console.log(`  Inventory:      $${bs.assets.inventory.toLocaleString()}`);
        console.log(`  Receivables:    $${bs.assets.receivables.toLocaleString()}`);
        console.log(`  BS Total Assets: $${bs.assets.total.toLocaleString()}`);

        console.log(`LIABILITIES:`);
        console.log(`  Payables (AP):  $${bs.liabilities.payables.toLocaleString()}`);
        console.log(`  BS Total Liab:  $${bs.liabilities.total.toLocaleString()}`);

        console.log(`EQUITY:`);
        console.log(`  Capital:        $${bs.equity.capital.toLocaleString()}`);
        console.log(`  Retained Earn:  $${bs.equity.retainedEarnings.toLocaleString()}`);
        console.log(`  BS Total Equity: $${bs.equity.total.toLocaleString()}`);

        const liabilityEquity = bs.liabilities.total + bs.equity.total;
        console.log(`\nCheck: Assets ($${bs.assets.total}) == Liab+Equity ($${liabilityEquity}) ? ${Math.abs(bs.assets.total - liabilityEquity) < 1 ? '✅ YES' : '❌ NO'}`);


        // 3. Get Profit & Loss
        console.log('\n--- PROFIT & LOSS ---');
        const plResp = await axios.get(`${baseURL}/finance/pl`, config);
        const pl = plResp.data;

        console.log(`Total Income:   $${pl.totalIncome.toLocaleString()}`);
        console.log(`Total Expenses: $${pl.totalExpenses.toLocaleString()}`);
        console.log(`COGS:           $${pl.cogs?.toLocaleString() || 0}`);
        console.log(`Net Profit:     $${pl.netProfit.toLocaleString()}`);

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

verifyFinance();
