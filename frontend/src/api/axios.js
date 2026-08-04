import axios from 'axios';

/**
 * Pre-configured Axios instance for the Smart Queue System API.
 * - baseURL is set to '/api' (proxied to backend in dev via Vite)
 * - Request interceptor attaches JWT from localStorage
 * - Response interceptor handles 401 (expired/invalid token)
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT ───────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sq-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored auth data
      localStorage.removeItem('sq-token');
      localStorage.removeItem('sq-user');

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
