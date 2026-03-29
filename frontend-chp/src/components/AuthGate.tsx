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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-chp-red"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-600">Oturum doğrulanıyor…</p>
      </div>
    );
  }

  if (!getToken()) return null;

  return <>{children}</>;
}
