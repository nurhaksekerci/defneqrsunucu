import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.defneqr.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Project': 'defnerandevu', // Backend project context
  },
});

// Request interceptor - Token ekleme
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

// Response interceptor - 401'de login'e yönlendir, 403 PROJECT_MISMATCH'de logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === 'undefined') return Promise.reject(error);

    // Yanlış projede oturum: DefneQr hesabı randevu.defneqr.com'da veya tersi
    if (error.response?.status === 403 && error.response?.data?.code === 'PROJECT_MISMATCH') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const isAuthRoute = window.location.pathname.startsWith('/auth');
      if (!isAuthRoute && !error.config?.url?.includes('/auth/')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
