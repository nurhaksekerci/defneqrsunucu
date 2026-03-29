'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getToken } from '@/lib/token';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(getToken() ? '/feed' : '/login');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center font-sans text-neutral-500">
      Yönlendiriliyor…
    </div>
  );
}
