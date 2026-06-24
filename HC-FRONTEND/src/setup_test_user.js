import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: 'admin'
};

const setup = async () => {
    console.log(`Attempting to register user: ${testUser.email}`);
    try {
        await axios.post(`${API_URL}/register`, testUser);
        console.log('User registered successfully!');
        console.log('You can now login with:');
        console.log(`Email: ${testUser.email}`);
        console.log(`Password: ${testUser.password}`);
    } catch (error) {
        if (error.response) {
            console.log('Registration failed:', error.response.data.message);
            if (error.response.data.message === 'User already exists') {
                console.log('User already exists in the database.');
                console.log('Please try logging in with the existing password, or use a new email.');
            }
        } else {
            console.log('Error connecting to backend:', error.message);
        }
    }
};

setup();
