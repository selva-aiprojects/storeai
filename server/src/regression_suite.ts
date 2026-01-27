/**
 * STORE AI - REGRESSION TEST SUITE
 * 
 * This suite executes a complete End-to-End (E2E) verification of the platform's core business logic.
 * It simulates a real administrative workload to ensure integrity across all modules.
 * 
 * Modules Covered:
 * 1. Authentication (Multi-Tenant Login)
 * 2. Governance API (Tenant Directory & MRR)
 * 3. Inventory Management (Product Creation)
 * 4. Partner Management (Suppliers)
 * 5. CRM & Sales (Customers & Sales Transactions)
 * 6. HR & Payroll (Employee Onboarding)
 * 7. Procurement (Purchase Order Generation)
 * 
 * Usage: npx ts-node src/regression_suite.ts
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/v1';
const TIMESTAMP = Date.now();

// Configuration
const CONFIG = {
    adminEmail: 'admin@storeai.com',
    adminPassword: 'AdminPassword123!',
    tenantSlug: 'storeai',
    headers: {} as any
};

// Utilities
const logStep = (step: string) => process.stdout.write(`🔹 [${step}] `);
const logSuccess = (msg: string = 'OK') => console.log(`✅ ${msg}`);
const logFail = (msg: string) => console.log(`❌ FAILED: ${msg}`);

async function runRegressionSuite() {
    console.log(`\n🚀 STARTING REGRESSION SUITE [ID: ${TIMESTAMP}]\n`);
    console.log(`Target: ${API_BASE}`);
    console.log('---------------------------------------------------\n');

    try {
        // --- TEST CASE 1: AUTHENTICATION ---
        logStep('AUTH: Validating Admin Credentials');
        const loginResp = await axios.post(`${API_BASE}/auth/login`, {
            email: CONFIG.adminEmail,
            password: CONFIG.adminPassword,
            tenantSlug: CONFIG.tenantSlug
        });

        if (!loginResp.data.token) throw new Error('No token received');
        CONFIG.headers = { Authorization: `Bearer ${loginResp.data.token}` };
        logSuccess();

        // --- TEST CASE 2: GOVERNANCE ---
        logStep('ADMIN: Checking Tenant Directory');
        const tenantsResp = await axios.get(`${API_BASE}/tenants/all`, { headers: CONFIG.headers });
        if (!Array.isArray(tenantsResp.data)) throw new Error('Invalid directory format');
        logSuccess(`${tenantsResp.data.length} Tenants Active`);

        // --- TEST CASE 3: METADATA & DEPENDENCIES ---
        logStep('SYSTEM: Verifying Metadata (Cats/Depts)');
        const [catsResp, deptsResp] = await Promise.all([
            axios.get(`${API_BASE}/categories`, { headers: CONFIG.headers }),
            axios.get(`${API_BASE}/hr/departments`, { headers: CONFIG.headers })
        ]);

        const categoryId = catsResp.data[0]?.id;
        const departmentId = deptsResp.data[0]?.id;

        if (!categoryId || !departmentId) throw new Error('Missing seed data');
        logSuccess();

        // --- TEST CASE 4: INVENTORY ---
        logStep('INVENTORY: Create Product Logic');
        const productData = {
            sku: `REG-SKU-${TIMESTAMP}`,
            name: `Regression Probe ${TIMESTAMP}`,
            price: 1500,
            costPrice: 900,
            stockQuantity: 100,
            categoryId,
            unit: 'PCS'
        };
        const productResp = await axios.post(`${API_BASE}/products`, productData, { headers: CONFIG.headers });
        const productId = productResp.data.id;
        logSuccess(`Product Created (${productId})`);

        // --- TEST CASE 5: PARTNERS ---
        logStep('PARTNERS: Supplier Onboarding');
        const supplierResp = await axios.post(`${API_BASE}/suppliers`, {
            name: `RegSupplier-${TIMESTAMP}`,
            email: `reg-sup-${TIMESTAMP}@test.com`
        }, { headers: CONFIG.headers });
        const supplierId = supplierResp.data.id;
        logSuccess(`Supplier Created (${supplierId})`);

        // --- TEST CASE 6: CRM ---
        logStep('CRM: Customer Acquisition');
        const customerResp = await axios.post(`${API_BASE}/customers`, {
            name: `RegClient-${TIMESTAMP}`,
            email: `reg-client-${TIMESTAMP}@test.com`
        }, { headers: CONFIG.headers });
        const customerId = customerResp.data.id;
        logSuccess(`Customer Created (${customerId})`);

        // --- TEST CASE 7: HUMAN RESOURCES ---
        logStep('HR: Employee Hiring Protocol');
        const employeeResp = await axios.post(`${API_BASE}/hr/employees`, {
            employeeId: `REG-EMP-${TIMESTAMP}`,
            firstName: 'Regression',
            lastName: 'Bot',
            designation: 'Test Runner',
            salary: 50000,
            departmentId,
            joiningDate: new Date().toISOString()
        }, { headers: CONFIG.headers });
        logSuccess(`Employee Created (${employeeResp.data.id})`);

        // --- TEST CASE 8: SALES TRANSACTION ---
        logStep('SALES: Processing Order');
        const saleResp = await axios.post(`${API_BASE}/sales`, {
            customerId: customerId,
            items: [{ productId: productId, quantity: 2, unitPrice: 1500 }]
        }, { headers: CONFIG.headers });
        logSuccess(`Sale # ${saleResp.data.invoiceNo}`);

        // --- TEST CASE 9: PROCUREMENT ---
        logStep('PROCUREMENT: Raising Purchase Order');
        const orderResp = await axios.post(`${API_BASE}/orders`, {
            supplierId: supplierId,
            items: [{ productId: productId, quantity: 50, unitPrice: 900 }]
        }, { headers: CONFIG.headers });
        logSuccess(`PO # ${orderResp.data.orderNumber}`);

        console.log('\n---------------------------------------------------');
        console.log('✨ REGRESSION RESULT: PASSED');
        console.log('   All modules function within expected parameters.');
        console.log('---------------------------------------------------\n');
        process.exit(0);

    } catch (error: any) {
        console.log('\n');
        logFail(error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data).substring(0, 200));
        }
        process.exit(1);
    }
}

runRegressionSuite();
