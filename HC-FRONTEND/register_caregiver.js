const axios = require('axios');

async function createCaregiver() {
    try {
        console.log('Attempting to register caregiver@hc.com...');
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            email: 'caregiver@hc.com',
            password: 'caregiver123',
            role: 'caregiver'
        });
        console.log('\n✅ Caregiver created successfully!');
        console.log('Email:', res.data.email);
        console.log('Role:', res.data.role);
    } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message === 'User already exists') {
            console.log('\nℹ️ Caregiver account already exists in the database.');
        } else {
            console.error('\n❌ Error creating caregiver:', err.response?.data || err.message);
            console.log('\nMake sure the backend is running at http://localhost:5000');
        }
    }
}

createCaregiver();
