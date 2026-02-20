import axios from 'axios';
import { useAuthStore } from '~/store/authStore';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9080', // APISIX Gateway
    headers: {
        'Content-Type': 'application/json',
    },
});

// Inject JWT token and org context into every request
api.interceptors.request.use((config) => {
    const { token, orgId } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (orgId) {
        config.headers['X-Organization-Id'] = orgId;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Auto-clear token on 401
        if (error.response?.status === 401) {
            useAuthStore.getState().clearToken();
        }
        return Promise.reject(error);
    }
);
