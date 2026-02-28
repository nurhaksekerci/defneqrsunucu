'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  googleId?: string;
  role: 'ADMIN' | 'STAFF' | 'RESTAURANT_OWNER' | 'CASHIER' | 'WAITER' | 'BARISTA' | 'COOK';
  createdAt: string;
  subscriptions?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    plan: {
      id: string;
      name: string;
      type: string;
      maxRestaurants: number;
      maxCategories: number;
      maxProducts: number;
    };
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Backend'de users endpoint'i yoksa boş array döndür
      const response = await api.get('/users').catch(() => ({ data: { data: [] } }));
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.message || 'Rol güncellenemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Kullanıcı silinemedi. Lütfen tekrar deneyin.');
    }
  };

  const getRoleName = (role: User['role']) => {
    const roleNames = {
      ADMIN: 'Admin',
      STAFF: 'Staff',
      RESTAURANT_OWNER: 'Restoran Sahibi',
      CASHIER: 'Kasiyer',
      WAITER: 'Garson',
      BARISTA: 'Barista',
      COOK: 'Aşçı'
    };
    return roleNames[role];
  };

  const getRoleBadgeColor = (role: User['role']) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800',
      STAFF: 'bg-purple-100 text-purple-800',
      RESTAURANT_OWNER: 'bg-blue-100 text-blue-800',
      CASHIER: 'bg-green-100 text-green-800',
      WAITER: 'bg-yellow-100 text-yellow-800',
      BARISTA: 'bg-pink-100 text-pink-800',
      COOK: 'bg-orange-100 text-orange-800'
    };
    return colors[role];
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanıcı Yönetimi</h1>
        <p className="text-gray-600">Sistemdeki tüm kullanıcıları görüntüleyin</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
          />
        </div>
        <div className="w-64">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            <option value="all">Tüm Roller</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="RESTAURANT_OWNER">Restoran Sahibi</option>
            <option value="CASHIER">Kasiyer</option>
            <option value="WAITER">Garson</option>
            <option value="BARISTA">Barista</option>
            <option value="COOK">Aşçı</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ad Soyad</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Abonelik</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Başlangıç Tarihi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Kayıt Tarihi</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const activeSubscription = user.subscriptions?.[0];
                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-600">{user.username || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          <div className="flex items-center gap-2">
                            {user.email}
                            {user.googleId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title="Google ile kayıt oldu">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  />
                                </svg>
                                Google
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-900 hover:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer min-w-[140px]"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="STAFF">Staff</option>
                            <option value="RESTAURANT_OWNER">Restoran Sahibi</option>
                            <option value="CASHIER">Kasiyer</option>
                            <option value="WAITER">Garson</option>
                            <option value="BARISTA">Barista</option>
                            <option value="COOK">Aşçı</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          {activeSubscription ? (
                            <div>
                              <div className="font-medium text-gray-900">{activeSubscription.plan.name}</div>
                              <div className="text-xs text-gray-500">
                                {activeSubscription.plan.maxRestaurants} işletme • {activeSubscription.plan.maxCategories} kategori • {activeSubscription.plan.maxProducts} ürün
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Abonelik yok</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {activeSubscription ? (
                            new Date(activeSubscription.startDate).toLocaleDateString('tr-TR')
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Uyarı:</strong> Kullanıcı silme işlemi geri alınamaz. Lütfen dikkatli olun.
        </p>
      </div>
    </div>
  );
}
