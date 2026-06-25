import axios from 'axios';

// Backend Base URL (Production + Local support)
const BASE_URL =
    import.meta.env.VITE_API_URL ||
    'https://dementia-backend-tkpy.onrender.com';

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach JWT token automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;