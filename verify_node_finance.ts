import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';

async function verify() {
    console.log('🔍 Verifying Node Financial Endpoints...');

    try {
        // We need a token. I'll try to login with the admin user from .env
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@storeai.com',
            password: 'AdminPassword123!'
        });

        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        console.log('✅ Login Successful');

        // 1. Balance Sheet
        const bsRes = await axios.get(`${API_BASE}/finance/balance-sheet`, config);
        console.log('📊 Balance Sheet:', JSON.stringify(bsRes.data, null, 2));

        // 2. Ledger fallback check
        const ledgerRes = await axios.get(`${API_BASE}/accounts/ledger`, config);
        console.log(`📜 Ledger Entries Found: ${ledgerRes.data.length}`);
        if (ledgerRes.data.length > 0) {
            console.log('   Sample Entry:', ledgerRes.data[0].title);
        }

        console.log('✨ Verification Complete!');
    } catch (e: any) {
        console.error('❌ Verification Failed:', e.response?.data || e.message);
    }
}

verify();
