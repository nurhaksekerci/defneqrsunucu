'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = () => {
      if (authService.isAuthenticated()) {
        router.replace('/admin');
      } else {
        router.replace('/auth/login');
      }
      setChecking(false);
    };
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return null;
}
