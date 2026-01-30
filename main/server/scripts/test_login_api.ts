import axios from 'axios';

async function testLogin() {
    const baseURL = 'http://localhost:5000/api/v1';

    console.log('\n🧪 Testing Login API...\n');

    // Test 1: Login without tenant slug (should auto-select first tenant)
    try {
        console.log('Test 1: Login WITHOUT tenant slug');
        const response = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@storeai.com',
            password: 'AdminPassword123!'
        });

        console.log('✅ Login successful!');
        console.log(`   User: ${response.data.user.firstName} ${response.data.user.lastName}`);
        console.log(`   Active Tenant: ${response.data.user.activeTenant.name} (${response.data.user.activeTenant.slug})`);
        console.log(`   Role: ${response.data.user.role}`);
        console.log(`   Available Tenants: ${response.data.availableTenants?.length || 0}`);
    } catch (error: any) {
        console.error('❌ Login failed:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(`   Message: ${error.message}`);
            console.error(`   Code: ${error.code}`);
        }
    }

    // Test 2: Login with specific tenant slug
    try {
        console.log('\n\nTest 2: Login WITH tenant slug "storeai"');
        const response = await axios.post(`${baseURL}/auth/login`, {
            email: 'admin@storeai.com',
            password: 'AdminPassword123!',
            tenantSlug: 'storeai'
        });

        console.log('✅ Login successful!');
        console.log(`   Active Tenant: ${response.data.user.activeTenant.name}`);
    } catch (error: any) {
        console.error('❌ Login failed:');
        console.error(`   Error: ${error.response?.data?.error || error.message}`);
    }
}

testLogin();
