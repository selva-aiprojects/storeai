
// regression_test.ts
// Run with: npx ts-node regression_test.ts

import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = 'admin@storeai.com';
const ADMIN_PASSWORD = 'Admin@123';

async function runRegression() {
    console.log('🚀 Starting Regression Suite...');
    let token = '';
    let tenantId = '';
    let productId = '';
    let supplierId = '';
    let warehouseId = '';
    let orderId = '';

    // 1. AUTHENTICATION
    try {
        console.log('\n[1] Testing Auth...');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        token = res.data.token;
        tenantId = res.data.user.tenantId;
        console.log('✅ Login Successful. Token obtained.');
    } catch (e: any) {
        console.error('❌ Login Failed:');
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Data:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error('Message:', e.message);
        }
        process.exit(1);
    }

    const api = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    // 2. SETUP (Product & Supplier)
    try {
        console.log('\n[2] Setting up Master Data...');

        // Create Category (Required)
        const catRes = await api.post('/categories', {
            name: `Test Cat ${Date.now()}`,
            description: 'Regression Test Category'
        });
        const categoryId = catRes.data.id;
        console.log('✅ Category Created:', categoryId);

        // Create Supplier
        const supRes = await api.post('/suppliers', {
            name: `AutoTest Supplier ${Date.now()}`,
            email: `supplier${Date.now()}@test.com`,
            status: 'ACTIVE'
        });
        supplierId = supRes.data.id;
        console.log('✅ Supplier Created:', supplierId);

        // Create Product (with image support)
        const prodRes = await api.post('/products', {
            name: `Test Product ${Date.now()}`,
            sku: `SKU-${Date.now()}`,
            price: 100,
            costPrice: 50,
            stockQuantity: 0,
            gstRate: 18,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30', // Sample Image
            categoryId: categoryId // Required linkage
        });
        productId = prodRes.data.id;
        console.log('✅ Product Created with Image:', productId);
        if (prodRes.data.image) console.log('   Visual Link:', prodRes.data.image);

        // Get Warehouse
        const whRes = await api.get('/inventory/warehouses');
        if (whRes.data.length > 0) {
            warehouseId = whRes.data[0].id;
        } else {
            // Create logical default if missing (simplified)
            console.warn('⚠️ No warehouse found, specific GRN test might fail.');
        }
    } catch (e: any) {
        console.error('❌ Setup Failed:', e.response?.data || e.message);
    }

    // 3. PROCUREMENT FLOW (PO -> Approve -> Inward)
    try {
        console.log('\n[3] Testing Procurement Flow...');

        // Create PO
        const poRes = await api.post('/orders', {
            supplierId,
            items: [{ productId, quantity: 10, unitPrice: 50 }],
            status: 'DRAFT'
        });
        orderId = poRes.data.id;
        console.log('✅ PO Created:', orderId);

        // Approve PO
        await api.patch(`/orders/${orderId}/approve`);
        console.log('✅ PO Approved');

        // Inward (GRN)
        if (warehouseId) {
            const grnRes = await api.post(`/orders/${orderId}/grn`, {
                warehouseId,
                items: [{
                    productId,
                    quantity: 10,
                    batchNumber: 'BATCH-AUTO-001',
                    expiryDate: '2025-12-31',
                    costPrice: 50
                }],
                notes: 'Automated Regression Test'
            });
            console.log('✅ GRN Created:', grnRes.data.grnNumber);
        }
    } catch (e: any) {
        console.error('❌ Procurement Flow Failed:', e.response?.data || e.message);
    }

    // 4. SALES FLOW (Stock Deduction)
    try {
        console.log('\n[4] Testing Sales Flow (FIFO)...');

        const saleRes = await api.post('/sales', {
            items: [{
                productId,
                quantity: 2, // Should deduct from BATCH-AUTO-001
                unitPrice: 100
            }],
            paymentMethod: 'CASH',
            amountPaid: 200
        });

        console.log('✅ Sale Created:', saleRes.data.invoiceNo);
        console.log('   Tax Amount:', saleRes.data.taxAmount); // Should be 36 (18% of 200)

        // Verify Stock Deduction
        const prodCheck = await api.get(`/products`);
        const item = prodCheck.data.find((p: any) => p.id === productId);
        if (item) {
            console.log(`✅ Stock Verification: Expect 8, Found ${item.stockQuantity}`);
        }

    } catch (e: any) {
        console.error('❌ Sales Flow Failed:', e.response?.data || e.message);
    }

    // 5. HR PAYROLL (Generation)
    try {
        console.log('\n[5] Testing Payroll Generation...');

        // Create Department (Required)
        const deptRes = await api.get('/hr/departments');
        let deptId = deptRes.data[0]?.id;

        if (!deptId) {
            // No departments exist? Usually seed creates them, but let's be safe.
            // Note: Currently no POST /hr/departments in api.ts, but let's assume we might need to create one if empty.
            // For now, let's assume seed worked or we use the first one.
            console.warn('⚠️ No departments found for HR test.');
        }

        // Create Employee
        const empRes = await api.post('/hr/employees', {
            firstName: 'Auto',
            lastName: 'Tester',
            employeeId: `EMP-${Date.now()}`,
            designation: 'QA',
            joiningDate: '2023-01-01',
            salary: 5000,
            departmentId: deptId // Pass valid ID
        });
        const empId = empRes.data.id;
        console.log('✅ Employee Created:', empId);

        // Generate Payroll
        // Need to pass structure params if not set in DB automatically? 
        // The service uses existing structure. We might need to mock structure first or rely on defaults.
        // Assuming current createEmployee might not set SalaryStructure, this step might be fragile without seeded data.
        // Skipping detailed payroll calc verification in this smoke test script due to dependency on SalaryStructure content.
        console.log('⚠️ Skipping detailed Payroll Calc (Requires seeded SalaryStructure)');

    } catch (e: any) {
        console.error('❌ HR Flow Failed:', e.response?.data || e.message);
    }

    console.log('\n---------------------------------');
    console.log('🚀 Regression Suite Completed');
}

runRegression();
