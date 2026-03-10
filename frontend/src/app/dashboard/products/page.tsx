'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('categoryId');

  useEffect(() => {
    const url = categoryId
      ? `/dashboard/menu?tab=products&categoryId=${categoryId}`
      : '/dashboard/menu?tab=products';
    router.replace(url);
  }, [router, categoryId]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
