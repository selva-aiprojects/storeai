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
    adminPassword: 'Admin@123',
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
            sku: `QNT-PXL-${TIMESTAMP}`,
            name: `Quantum Pixel Pro - Alpha Build ${TIMESTAMP}`,
            price: 1800,
            costPrice: 1100,
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
            name: `Global Infrastructure Partners ${TIMESTAMP}`,
            email: `procure-tier1-${TIMESTAMP}@gip-logistics.com`
        }, { headers: CONFIG.headers });
        const supplierId = supplierResp.data.id;
        logSuccess(`Supplier Created (${supplierId})`);

        // --- TEST CASE 6: CRM ---
        logStep('CRM: Customer Acquisition');
        const customerResp = await axios.post(`${API_BASE}/customers`, {
            name: `Enterprise Solution Corp ${TIMESTAMP}`,
            email: `accounts@esc-${TIMESTAMP}.com`
        }, { headers: CONFIG.headers });
        const customerId = customerResp.data.id;
        logSuccess(`Customer Created (${customerId})`);

        // --- TEST CASE 7: HR / STAFFING ---
        logStep('HR: Employee Hiring Protocol');
        const employeeResp = await axios.post(`${API_BASE}/hr/employees`, {
            employeeId: `EMP-QNT-${TIMESTAMP}`,
            firstName: 'Jonathan',
            lastName: 'Ops-Manager',
            email: `j.ops-${TIMESTAMP}@storeai-corp.com`,
            designation: 'Senior Operations Lead',
            salary: 12000,
            departmentId,
            joiningDate: new Date().toISOString()
        }, { headers: CONFIG.headers });
        const employeeId = employeeResp.data.id;
        logSuccess(`Employee Created (${employeeId})`);

        logStep('HR: Attendance Marking');
        await axios.post(`${API_BASE}/hr/attendance`, {
            employeeId: employeeId,
            status: 'PRESENT'
        }, { headers: CONFIG.headers });
        logSuccess('Attendance Logged');

        logStep('HR: Payroll Generation (OT + Incentive)');
        const payrollResp = await axios.post(`${API_BASE}/hr/payroll`, {
            employeeId: employeeId,
            amount: 10000, // Monthly Executive Base
            month: 'Fiscal Q1 - Operations',
            status: 'PAID',
            monthlySales: 50000, // Strategic Sales Target
            overtimeHours: 20
        }, { headers: CONFIG.headers });

        const payout = payrollResp.data.totalPayout;
        const expectedIncentive = 50000 * 0.10; // 10% on Strategic Target
        if (payout <= 10000) throw new Error('Payroll did not include performance incentives');
        logSuccess(`Payroll Generated: $${payout.toFixed(2)} (lnc: $${expectedIncentive})`);

        // --- TEST CASE 8: SALES & STOCK DEDUCTION ---
        logStep('SALES: Transaction & Stock Update');
        // Check initial stock
        const initialProd = await axios.get(`${API_BASE}/products`, { headers: CONFIG.headers });
        const startQty = initialProd.data.find((p: any) => p.id === productId)?.stockQuantity;

        const saleResp = await axios.post(`${API_BASE}/sales`, {
            customerId: customerId,
            items: [{ productId: productId, quantity: 2, unitPrice: 1800 }]
        }, { headers: CONFIG.headers });

        // Check final stock
        const finalProd = await axios.get(`${API_BASE}/products`, { headers: CONFIG.headers });
        const endQty = finalProd.data.find((p: any) => p.id === productId)?.stockQuantity;

        if (startQty - endQty !== 2) throw new Error('Stock not deducted correctly');
        logSuccess(`Sale Verified (Stock: ${startQty} -> ${endQty})`);

        // --- TEST CASE 9: PROCUREMENT ---
        logStep('PROCUREMENT: Raising Purchase Order');
        const orderResp = await axios.post(`${API_BASE}/orders`, {
            supplierId: supplierId,
            items: [{ productId: productId, quantity: 50, unitPrice: 900 }]
        }, { headers: CONFIG.headers });
        // PO must be APPROVED to trigger GST Input Ledger
        logStep('PROCUREMENT: Approving PO for GST');
        await axios.patch(`${API_BASE}/orders/${orderResp.data.id}/approve`, {}, { headers: CONFIG.headers });
        logSuccess('PO Approved');

        // --- TEST CASE 10: REPORTS ---
        logStep('REPORTS: Inventory Summary');
        const stockRep = await axios.get(`${API_BASE}/inventory/summary`, { headers: CONFIG.headers });
        if (!Array.isArray(stockRep.data)) throw new Error('Invalid Stock Report');
        logSuccess(`Stock Report Generated (${stockRep.data.length} records)`);

        // --- TEST CASE 11: TAXATION ---
        logStep('FINANCE: GST Liability Check');
        const taxSummary = await axios.get(`${API_BASE}/accounts/tax-summary`, { headers: CONFIG.headers });
        const { gstOutput, gstInput, netPayable } = taxSummary.data;

        if (gstOutput <= 0) throw new Error('No GST Output recorded from Sales');
        if (gstInput <= 0) throw new Error('No GST Input Credit from PO');

        logSuccess(`Tax Report: Output $${gstOutput.toFixed(2)} | Input $${gstInput.toFixed(2)} | Net $${netPayable.toFixed(2)}`);

        console.log('\n---------------------------------------------------');
        console.log('✨ REGRESSION RESULT: PASSED');
        console.log('   All 11 Verification Modules Successful.');
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
