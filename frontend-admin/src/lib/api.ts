import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.defneqr.com';
const apiBase = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      if (originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${apiBase}/auth/refresh`, { refreshToken });
        if (response.data.success && response.data.data?.accessToken) {
          const newAccessToken = response.data.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        }
      } catch (refreshError: unknown) {
        const err = refreshError as { response?: { status?: number; data?: { code?: string; message?: string } } };
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        if (err?.response?.status === 503 && err?.response?.data?.code === 'MAINTENANCE_MODE') {
          const msg = encodeURIComponent(err?.response?.data?.message || 'Sistem bakımda. Lütfen biraz bekledikten sonra tekrar deneyin.');
          window.location.href = `/auth/login?error=maintenance&message=${msg}`;
        } else {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Bakım modu: oturum sonlandırıldı veya giriş engellendi
    if (error.response?.status === 503 && error.response?.data?.code === 'MAINTENANCE_MODE' && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      const msg = encodeURIComponent(error.response?.data?.message || 'Sistem bakımda. Lütfen biraz bekledikten sonra tekrar deneyin.');
      window.location.href = `/auth/login?error=maintenance&message=${msg}`;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
