import api from './api';

export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role: 'ADMIN' | 'STAFF' | 'RESTAURANT_OWNER' | 'CASHIER' | 'WAITER' | 'BARISTA' | 'COOK';
  restaurants?: {
    id: string;
    name: string;
    slug: string;
  }[];
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
  // Kayıt ol
  async register(data: {
    email: string;
    username?: string;
    password: string;
    fullName: string;
  }): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      
      // Backward compatibility
      localStorage.setItem('token', response.data.data.accessToken);
    }
    return response.data;
  },

  // Giriş yap
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      
      // Backward compatibility
      localStorage.setItem('token', response.data.data.accessToken);
    }
    return response.data;
  },

  // Çıkış yap
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token'); // Backward compatibility
    }
  },

  // Tüm cihazlardan çıkış yap
  async logoutAll(): Promise<void> {
    try {
      await api.post('/auth/logout-all');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
    }
  },

  // Refresh token ile yeni access token al
  async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return null;
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      if (response.data.success && response.data.data.accessToken) {
        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('token', newAccessToken); // Backward compatibility
        return newAccessToken;
      }
      return null;
    } catch (error) {
      // Refresh token invalid/expired - logout
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      return null;
    }
  },

  // Mevcut kullanıcı
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  // Aktif oturumları al
  async getActiveSessions(): Promise<any[]> {
    const response = await api.get('/auth/sessions');
    return response.data.data;
  },

  // Token kontrolü
  getToken(): string | null {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  // Kullanıcı giriş yapmış mı?
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
