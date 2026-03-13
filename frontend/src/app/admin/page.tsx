'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

interface DashboardStats {
  restaurants: { total: number; active: number; premium: number; free: number };
  users: { total: number; active: number; passive: number; admin: number };
  global: { categories: number; products: number; activeProducts: number; productsWithoutImage: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    restaurants: { total: 0, active: 0, premium: 0, free: 0 },
    users: { total: 0, active: 0, passive: 0, admin: 0 },
    global: { categories: 0, products: 0, activeProducts: 0, productsWithoutImage: 0 }
  });
  const [recentRestaurants, setRecentRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadDashboardData();
    // Not: /health/detailed monolit backend ile kaldırıldı, mikroservislerde yok
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      const data = response.data.data;
      setRecentRestaurants(data.recentRestaurants || []);
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Sistem geneli istatistikler ve yönetim</p>
      </div>

      {/* 1. Satır: Restoranlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Restoranlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.restaurants.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Aktif Restoranlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.restaurants.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Premium Restoranlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary-600">{stats.restaurants.premium}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Ücretsiz Restoranlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-600">{stats.restaurants.free}</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Satır: Kullanıcılar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Aktif Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.users.active}</p>
            <p className="text-sm text-gray-500 mt-1">Restoranı olan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Pasif Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.users.passive}</p>
            <p className="text-sm text-gray-500 mt-1">Restoranı olmayan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Admin Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.users.admin}</p>
            <p className="text-sm text-gray-500 mt-1">Admin + Staff</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Satır: Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Global Kategoriler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.global.categories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Global Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{stats.global.products}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Global Aktif Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.global.activeProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Global Fotoğrafsız Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.global.productsWithoutImage}</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Son Eklenen Restoranlar</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRestaurants.length === 0 ? (
              <p className="text-gray-500 py-4">Henüz restoran eklenmemiş</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentRestaurants.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <p className="text-sm text-gray-500">{r.owner?.fullName} • /{r.slug}</p>
                    </div>
                    <a
                      href={`/${r.slug}/menu`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Görüntüle
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a href="/admin/restaurants" className="block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
              Tüm restoranlar →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sistem Aktivitesi</CardTitle>
              <a href="/admin/activity" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Tümünü gör
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-gray-500 py-4">Henüz aktivite yok</p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {activities.map((a, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="text-lg shrink-0">{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{a.label}</p>
                      {a.sublabel && (
                        <p className="text-gray-500 text-xs truncate">{a.sublabel}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(a.date).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/categories"
                className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition text-center"
              >
                <div className="text-2xl mb-2">📁</div>
                <p className="font-medium text-gray-900">Global Kategoriler</p>
                <p className="text-sm text-gray-600">Yönet</p>
              </a>
              <a
                href="/admin/products"
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
              >
                <div className="text-2xl mb-2">🍽️</div>
                <p className="font-medium text-gray-900">Global Ürünler</p>
                <p className="text-sm text-gray-600">Yönet</p>
              </a>
              <a
                href="/admin/restaurants"
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
              >
                <div className="text-2xl mb-2">🏪</div>
                <p className="font-medium text-gray-900">Restoranlar</p>
                <p className="text-sm text-gray-600">Listele</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
