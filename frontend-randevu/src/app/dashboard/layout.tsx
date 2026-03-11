'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { authService } from '@/lib/auth';

const baseMenuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'İşletmelerim', href: '/dashboard', icon: '🏪' },
  { name: 'İşletme Oluştur', href: '/dashboard/business/create', icon: '➕' },
  { name: 'Destek', href: '/dashboard/support', icon: '🎫' },
];
const menuItemsWithoutCreate = baseMenuItems.filter((item) => item.href !== '/dashboard/business/create');

const adminMenuExtra = [
  { name: 'Destek Talepleri (Admin)', href: '/admin/tickets', icon: '🎫' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(baseMenuItems);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/auth/login');
          return;
        }
        const user = await authService.getCurrentUser();
        if (user.role !== 'BUSINESS_OWNER' && user.role !== 'APPOINTMENT_STAFF' && user.role !== 'ADMIN' && user.role !== 'STAFF') {
          router.push('/');
          return;
        }
        const api = (await import('@/lib/api')).default;
        const res = await api.get('/businesses/my').catch(() => ({ data: { data: [] } }));
        const businesses = res?.data?.data || [];
        const hasBusiness = businesses.length >= 1;
        let items = hasBusiness ? menuItemsWithoutCreate : baseMenuItems;
        if (user.role === 'ADMIN' || user.role === 'STAFF') items = [...items, ...adminMenuExtra];
        setMenuItems(items);
        setIsLoading(false);
      } catch {
        router.push('/auth/login');
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 p-4 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 transition-all"
          aria-label="Menüyü aç"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Sidebar menuItems={menuItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
