'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="font-bold text-primary-600 text-lg hover:text-primary-700 transition">
              DefneRandevu
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === '/dashboard' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                İşletmeler
              </Link>
              <Link href="/" className="px-3 py-2 text-gray-600 hover:text-gray-900 text-sm">
                Ana Sayfa
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
              >
                Çıkış
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
