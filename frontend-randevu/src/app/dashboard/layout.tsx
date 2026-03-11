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
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="font-semibold text-indigo-600">
          DefneRandevu
        </Link>
        <nav className="flex gap-4">
          <Link href="/dashboard" className={pathname === '/dashboard' ? 'font-medium' : 'text-gray-600 hover:text-gray-900'}>
            İşletmeler
          </Link>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 text-sm">
            Çıkış
          </button>
        </nav>
      </header>
      <main className="p-4 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
