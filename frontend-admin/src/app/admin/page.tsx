'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface AdminStats {
  restaurants: { total: number; active: number; premium: number; free: number };
  users: { total: number; active: number; passive: number; admin: number };
  global: { categories: number; products: number; activeProducts: number; productsWithoutImage: number };
}

function StatCard({
  title,
  value,
  subtext,
  color = 'text-gray-900',
}: {
  title: string;
  value: number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.data);
      } catch (err) {
        setError('İstatistikler yüklenemedi.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Veri yüklenemedi.'}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Sistem geneli istatistikler</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Toplam Restoranlar" value={stats.restaurants.total} />
        <StatCard title="Aktif Restoranlar" value={stats.restaurants.active} color="text-green-600" />
        <StatCard title="Premium Restoranlar" value={stats.restaurants.premium} color="text-primary-600" />
        <StatCard title="Ücretsiz Restoranlar" value={stats.restaurants.free} color="text-gray-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Toplam Kullanıcılar" value={stats.users.total} />
        <StatCard title="Aktif Kullanıcılar" value={stats.users.active} subtext="Restoranı olan" color="text-green-600" />
        <StatCard title="Pasif Kullanıcılar" value={stats.users.passive} subtext="Restoranı olmayan" color="text-amber-600" />
        <StatCard title="Admin Kullanıcılar" value={stats.users.admin} subtext="Admin + Staff" color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Global Kategoriler" value={stats.global.categories} />
        <StatCard title="Global Ürünler" value={stats.global.products} color="text-purple-600" />
        <StatCard title="Global Aktif Ürünler" value={stats.global.activeProducts} color="text-green-600" />
        <StatCard title="Fotoğrafsız Ürünler" value={stats.global.productsWithoutImage} color="text-amber-600" />
      </div>
    </div>
  );
}
