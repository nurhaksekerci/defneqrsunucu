'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';

// Admin menu items
const adminMenuItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Planlar', href: '/admin/plans', icon: '💎' },
  { name: 'Promosyon Kodları', href: '/admin/promo-codes', icon: '🎟️' },
  { name: 'Affiliate Partnerlar', href: '/admin/affiliates', icon: '🤝' },
  { name: 'Affiliate Ayarları', href: '/admin/affiliate-settings', icon: '⚙️' },
  { name: 'Restoranlar', href: '/admin/restaurants', icon: '🏪' },
  { name: 'Kullanıcılar', href: '/admin/users', icon: '👥' },
  { name: 'Global Kategoriler', href: '/admin/categories', icon: '📁' },
  { name: 'Global Ürünler', href: '/admin/products', icon: '🍽️' },
  { name: 'Sistem Ayarları', href: '/admin/settings', icon: '⚙️' },
];

// Restaurant owner menu items
const ownerMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Restoranlarım', href: '/dashboard/restaurants', icon: '🏪' },
  { name: 'Menü Yönetimi', href: '/dashboard/menu', icon: '📋' },
  { name: 'Kategoriler', href: '/dashboard/categories', icon: '📁' },
  { name: 'Ürünler', href: '/dashboard/products', icon: '🍽️' },
  { name: 'Menü Özelleştirme', href: '/dashboard/menu-settings', icon: '🎨' },
  { name: 'Raporlar', href: '/dashboard/reports', icon: '📈' },
  { name: 'Plan & Abonelik', href: '/dashboard/subscription', icon: '💎' },
  { name: 'Affiliate', href: '/dashboard/affiliate', icon: '🤝' },
  { name: 'Şifre Değiştir', href: '/dashboard/change-password', icon: '🔐' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }

        const user = await authService.getCurrentUser();
        
        // Sadece restoran sahipleri ve adminler erişebilir
        if (user.role !== 'RESTAURANT_OWNER' && user.role !== 'ADMIN' && user.role !== 'STAFF') {
          router.push('/');
          return;
        }

        setUserRole(user.role);
        setIsLoading(false);
      } catch (error) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);
  
  // Role'e göre menü seçimi
  const menuItems = (userRole === 'ADMIN' || userRole === 'STAFF') ? adminMenuItems : ownerMenuItems;

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
      <div className="flex flex-1 overflow-hidden relative">
        {/* Hamburger Menu Button (Mobile Only) */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 transition-all"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Sidebar 
          menuItems={menuItems} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
