import api from './api';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  avatar?: string | null;
  role: 'ADMIN' | 'STAFF' | 'RESTAURANT_OWNER' | 'CASHIER' | 'WAITER' | 'BARISTA' | 'COOK';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data.accessToken) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        localStorage.setItem('token', response.data.data.accessToken);
      }
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) await api.post('/auth/logout', { refreshToken });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
