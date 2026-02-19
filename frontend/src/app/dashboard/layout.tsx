'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Restoranlarım', href: '/dashboard/restaurants', icon: '🏪' },
  { name: 'Menü Yönetimi', href: '/dashboard/menu', icon: '📋' },
  { name: 'Kategoriler', href: '/dashboard/categories', icon: '📁' },
  { name: 'Ürünler', href: '/dashboard/products', icon: '🍽️' },
  { name: 'Menü Özelleştirme', href: '/dashboard/menu-settings', icon: '🎨' },
  { name: 'Raporlar', href: '/dashboard/reports', icon: '📈' },
  { name: 'Şifre Değiştir', href: '/dashboard/change-password', icon: '🔐' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const user = await authService.getCurrentUser();
        
        // Sadece restoran sahipleri erişebilir
        if (user.role !== 'RESTAURANT_OWNER' && user.role !== 'ADMIN') {
          router.push('/');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar menuItems={menuItems} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
