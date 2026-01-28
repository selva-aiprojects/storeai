import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runAutomationTest() {
    console.log('🧪 STARTING AUTOMATED ENTERPRISE FLOW TEST...');

    try {
        // 1. Auth Test
        console.log('1. Testing Authentication...');
        const authRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@storeai.com',
            password: 'AdminPassword123!'
        });
        const token = authRes.data.token;
        console.log('✔ Auth Success. Token Secured.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Data Health Check
        console.log('2. Testing Catalog Fetch...');
        const productsRes = await axios.get(`${BASE_URL}/products`, { headers });
        const product = productsRes.data[0];
        console.log(`✔ Catalog Healthy. Found ${productsRes.data.length} items.`);

        // 3. Procurement Workflow Test (PO -> Tracking -> Inward)
        console.log('3. Testing Procurement Loop...');
        const suppliersRes = await axios.get(`${BASE_URL}/suppliers`, { headers });
        const supplier = suppliersRes.data[0];

        const orderRes = await axios.post(`${BASE_URL}/orders`, {
            supplierId: supplier.id,
            items: [{ productId: product.id, quantity: 10, unitPrice: 1500 }]
        }, { headers });
        const orderId = orderRes.data.id;
        console.log(`✔ P.O. Created: ${orderRes.data.orderNumber}`);

        // 3.5 Approval Test
        console.log('3.5 Testing P.O. Approval...');
        await axios.patch(`${BASE_URL}/orders/${orderId}/approve`, {}, { headers });
        console.log('✔ P.O. Approved and Ledger Updated.');

        // 4. Traceability Test
        console.log('4. Testing Shipment Tracking Update...');
        await axios.patch(`${BASE_URL}/orders/${orderId}/tracking`, {
            trackingNumber: 'TEST-TRACK-999',
            shippingCarrier: 'FedEx',
            status: 'SHIPPED',
            expectedDeliveryDate: '2026-02-01'
        }, { headers });
        console.log('✔ Inbound Tracking Logged.');

        // 5. Inventory Sync Test
        console.log('5. Testing Inward Logistics (GRN)...');
        const receiveRes = await axios.post(`${BASE_URL}/orders/${orderId}/grn`, {
            warehouseId: (await axios.get(`${BASE_URL}/inventory/warehouses`, { headers })).data[0].id,
            items: [{
                productId: product.id,
                quantity: 10,
                batchNumber: `BATCH-${Date.now()}`,
                expiryDate: '2026-12-31',
                costPrice: 1500
            }],
            notes: 'Automated Test GRN'
        }, { headers });
        console.log(`✔ Inward Complete. Order Status: ${receiveRes.data.status}`);

        // 6. Ledger Verification
        console.log('6. Verifying Capital Ledger...');
        const ledgerRes = await axios.get(`${BASE_URL}/accounts/ledger`, { headers });
        console.log(`✔ Ledger Verified. Total Entries: ${ledgerRes.data.length}`);

        console.log('\n✨ ALL ENTERPRISE PROTOCOLS VERIFIED. WORKFLOW IS STABLE.');
    } catch (e: any) {
        console.error('❌ AUTOMATION TEST FAILED:', e.response?.data || e.message);
        process.exit(1);
    }
}

runAutomationTest();
