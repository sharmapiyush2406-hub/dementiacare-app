import axios from 'axios';

// Create an Axios instance with a base URL
// You can set VITE_API_URL in your .env file, or it defaults to localhost:5000
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Added /api as it is common, but plan said /auth/login so checking if base should be just host or host/api. Usually it's host/api. Plan said "Send POST to /auth/login". So base URL should probably be root or /api. Let's assume /api for now based on common patterns, or just http://localhost:5000 if the route is /auth/login relative to root. 
    // Wait, the user said "Send a POST request to '/auth/login'". 
    // If the backend is "http://localhost:5000", then "http://localhost:5000/auth/login" is valid if base is http://localhost:5000.
    // Let's stick to the plan: `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'` and in Login.jsx call `/auth/login`.
    // Wait, if I use `http://localhost:5000` as base, and call `/auth/login`, it becomes `http://localhost:5000/auth/login`. 
    // However, often backends are at `/api/auth/login`. 
    // I will use `http://localhost:5000` as safe default for base.
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
