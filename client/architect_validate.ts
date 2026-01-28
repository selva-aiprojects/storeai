import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

async function validateArchitecturalIntegrity() {
    console.log('🛡️ STARTING ARCHITECTURAL INTEGRITY VALIDATION...');

    const adminEmail = 'admin@storeai.com';
    const adminPassword = 'AdminPassword123!';

    try {
        // 1. Authenticate Admin
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: adminEmail, password: adminPassword });
        const token = loginRes.data.token;
        const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

        console.log('\n[1] BATCH INTEGRITY VERIFICATION');
        const batchRes = await api.get(`${API_URL}/reports/batch-integrity`);
        const risks = batchRes.data;
        console.log(`✅ Found ${risks.length} batch risks.`);

        const expired = risks.find((r: any) => r.risk_status === 'EXPIRED');
        const warning = risks.find((r: any) => r.risk_status === 'RISK (30D)');

        if (expired) console.log(`   - PASS: Expired batch detected (${expired.batchNumber})`);
        else console.warn('   - FAIL: No expired batch detected.');

        if (warning) console.log(`   - PASS: Warning batch detected (${warning.batchNumber})`);
        else console.warn('   - FAIL: No warning batch detected.');

        console.log('\n[2] RBAC SECURITY VERIFICATION');
        const rolesToTest = [
            { email: 'procure@storeai.com', pass: 'DemoPassword123!', restricted: ['/sales', '/hr/employees'] },
            { email: 'sales@storeai.com', pass: 'DemoPassword123!', restricted: ['/orders', '/hr/employees'] },
            { email: 'hr@storeai.com', pass: 'DemoPassword123!', restricted: ['/sales', '/orders'] }
        ];

        for (const role of rolesToTest) {
            console.log(`\nTesting Role: ${role.email}`);
            const rLogin = await axios.post(`${API_URL}/auth/login`, { email: role.email, password: role.pass });
            const rToken = rLogin.data.token;
            const rApi = axios.create({ headers: { Authorization: `Bearer ${rToken}` } });

            for (const path of role.restricted) {
                try {
                    await rApi.get(`${API_URL}${path}`);
                    console.error(`   - FAIL: ${role.email} accessed restricted path ${path}`);
                } catch (e: any) {
                    if (e.response?.status === 403) {
                        console.log(`   - PASS: ${role.email} blocked from ${path} (403 Forbidden)`);
                    } else {
                        console.warn(`   - WARN: ${role.email} check for ${path} returned status ${e.response?.status}`);
                    }
                }
            }
        }

        console.log('\n[3] SALES FLOW & BATCH ADVISORY VERIFICATION');
        // Check if a sale can be created with the new amountPaid field
        const product = await api.get(`${API_URL}/products`);
        const testProd = product.data.find((p: any) => p.sku === 'MED-EXP-001');

        if (testProd) {
            try {
                const saleRes = await api.post(`${API_URL}/sales`, {
                    items: [{ productId: testProd.id, quantity: 1, unitPrice: testProd.price }],
                    paymentMethod: 'CASH',
                    amountPaid: testProd.price
                });
                console.log(`✅ PASS: Sale created successfully with amountPaid. Invoice: ${saleRes.data.invoiceNo}`);
            } catch (e: any) {
                console.error(`❌ FAIL: Sale creation failed:`, e.response?.data || e.message);
            }
        }

        console.log('\n-----------------------------------------');
        console.log('🏁 ARCHITECTURAL SIGN-OFF: COMPLETED');

    } catch (e: any) {
        console.error('❌ VALIDATION ABORTED:', e.message);
    }
}

validateArchitecturalIntegrity();
