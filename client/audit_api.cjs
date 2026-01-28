
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
const LOGIN_DATA = {
    email: 'admin@storeai.com',
    password: 'AdminPassword123!'
};

async function validate() {
    try {
        console.log('--- LOGIN VALIDATION ---');
        const loginRes = await axios.post(`${API_URL}/auth/login`, LOGIN_DATA);
        const token = loginRes.data.token;
        console.log('Token obtained:', token.substring(0, 10) + '...');

        const headers = { Authorization: `Bearer ${token}` };

        console.log('\n--- DASHBOARD STATS ---');
        const statsRes = await axios.get(`${API_URL}/dashboard/stats`, { headers });
        console.log('Stats:', statsRes.data);

        console.log('\n--- PRODUCT BATCH DATA ---');
        const productsRes = await axios.get(`${API_URL}/products`, { headers });
        const products = productsRes.data;
        if (products.length > 0) {
            console.log('Example Product:', products[0].name);
            console.log('Batch count for first product:', products[0].batches?.length || 0);
        }

        console.log('\n--- HR DATA ---');
        const employeesRes = await axios.get(`${API_URL}/hr/employees`, { headers });
        console.log('Employee count:', employeesRes.data.length);

        console.log('\n--- VALIDATION COMPLETE ---');
    } catch (e) {
        console.error('Validation failed:', e.response?.data || e.message);
    }
}

validate();
