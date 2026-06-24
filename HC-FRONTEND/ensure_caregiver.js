const axios = require('axios');

async function ensureCaregiver() {
    try {
        console.log('--- Ensuring Caregiver Account ---');
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            email: 'caregiver@hc.com',
            password: 'caregiver123',
            role: 'caregiver'
        });
        console.log('✅ Success: Caregiver registered.');
    } catch (err) {
        if (err.response?.data?.message === 'User already exists') {
            console.log('ℹ️ Account already exists.');
        } else {
            console.error('❌ Error:', err.response?.data || err.message);
        }
    }
}

ensureCaregiver();
