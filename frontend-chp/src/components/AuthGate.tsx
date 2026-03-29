'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/AuthProvider';
import { getToken } from '@/lib/token';

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!getToken()) router.replace('/login');
  }, [ready, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center font-sans text-chp-red">
        Yükleniyor…
      </div>
    );
  }

  if (!getToken()) return null;

  return <>{children}</>;
}
