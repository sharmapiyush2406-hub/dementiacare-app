const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Try to load env vars, default to localhost:5000 if not found
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@example.com'; // Adjust if you have a specific admin
const ADMIN_PASSWORD = 'password123'; // Adjust accordingly

async function diagnose() {
    console.log(`Diagnosing Backend at ${BASE_URL}...`);

    // 1. Check User Setup / Login as Admin
    // We need a token to hit /admin/routes
    let token;
    try {
        console.log('Attempting to login as admin...');
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'test@example.com', // Using the test user created in setup_test_user.js
            password: 'password123',
            role: 'admin'
        });
        token = loginRes.data.token;
        console.log('Login Successful! Token received.');
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('CRITICAL: Link Failure. Backend server is NOT running.');
            console.error('Please start the backend server: cd BACKEND && npm run dev');
            return;
        }
        console.error('Login Failed:', error.response?.data?.message || error.message);
        // Try creating the test user if login failed and it's not a connection issue?
        // skipping for now, assuming user or test user exists.
        return;
    }

    // 2. Test Admin Endpoints
    const api = axios.create({
        baseURL: `${BASE_URL}/api`,
        headers: { Authorization: `Bearer ${token}` }
    });

    try {
        console.log('Testing GET /admin/patients...');
        const pRes = await api.get('/admin/patients');
        console.log(`Success! Retrieved ${pRes.data.length} patients.`);
    } catch (error) {
        console.error('GET /admin/patients FAILED:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
    }

    try {
        console.log('Testing GET /admin/caregivers...');
        const cRes = await api.get('/admin/caregivers');
        console.log(`Success! Retrieved ${cRes.data.length} caregivers.`);
    } catch (error) {
        console.error('GET /admin/caregivers FAILED:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
    }
}

diagnose();
