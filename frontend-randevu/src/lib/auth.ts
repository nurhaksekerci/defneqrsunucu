import api from './api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string | null;
}

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('token', response.data.data.accessToken);
    }
    return response.data;
  },

  async register(data: { email: string; password: string; fullName: string }) {
    const response = await api.post('/auth/register', data);
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('token', response.data.data.accessToken);
    }
    return response.data;
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
    }
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(localStorage.getItem('accessToken') || localStorage.getItem('token'));
  },
};
