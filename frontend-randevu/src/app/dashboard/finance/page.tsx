'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function FinanceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const go = async () => {
      try {
        const res = await api.get('/businesses/my');
        const list = res?.data?.data || [];
        if (list.length > 0) {
          router.replace(`/dashboard/business/${list[0].id}/finance`);
          return;
        }
      } catch {
        // ignore
      }
      router.replace('/dashboard');
    };
    go();
  }, [router]);

  return (
    <div className="py-20 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" />
      <p className="text-gray-500">Yönlendiriliyor...</p>
      <Link href="/dashboard" className="mt-4 text-primary-600 hover:text-primary-700 font-medium">
        Dashboard&apos;a git
      </Link>
    </div>
  );
}
