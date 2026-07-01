import axios from 'axios';

// Backend Base URL (Production + Local support)
// VITE_API_URL must be the server ROOT (no /api suffix), e.g. http://localhost:5000
// For Vercel production: set VITE_API_URL=https://dementia-backend-tkpy.onrender.com in Vercel dashboard
const RAW_URL =
    import.meta.env.VITE_API_URL ||
    'https://dementia-backend-tkpy.onrender.com';

// Strip any accidental trailing /api or / so the baseURL is always exactly <root>/api
const BASE_URL = RAW_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

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