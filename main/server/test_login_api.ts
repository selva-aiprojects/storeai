
import axios from 'axios';

async function testLogin() {
    const email = 'admin@storeai.com';
    const password = 'Password@123'; // Default password for seeding usually
    const url = 'http://localhost:5000/api/v1/auth/login';

    console.log(`Testing login for ${email} at ${url}...`);

    try {
        const resp = await axios.post(url, { email, password });
        console.log("LOGIN SUCCESS:");
        console.log("Status:", resp.status);
        console.log("Data:", JSON.stringify(resp.data, null, 2));
    } catch (e: any) {
        console.log("LOGIN FAILED:");
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.log("Error:", e.message);
        }
    }
}

testLogin().catch(console.error);
