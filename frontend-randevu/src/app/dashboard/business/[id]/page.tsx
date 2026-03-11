'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  staff: { id: string; fullName: string }[];
  services: { id: string; name: string; duration: number; price: number }[];
}

export default function BusinessDetailPage() {
  const params = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusiness();
  }, [params.id]);

  const loadBusiness = async () => {
    try {
      const res = await api.get(`/businesses/${params.id}`);
      if (res.data.success) setBusiness(res.data.data);
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">İşletme bulunamadı</p>
        <Link href="/dashboard" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
          ← İşletmelere dön
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        İşletmelere dön
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{business.name}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">👥</span>
            Personel ({business.staff.length})
          </h2>
          {business.staff.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz personel eklenmemiş</p>
          ) : (
            <ul className="space-y-2">
              {business.staff.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-gray-700">
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                  {s.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">✂️</span>
            Hizmetler ({business.services.length})
          </h2>
          {business.services.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz hizmet eklenmemiş</p>
          ) : (
            <ul className="space-y-2">
              {business.services.map((s) => (
                <li key={s.id} className="flex justify-between items-center text-gray-700 py-2 border-b border-gray-100 last:border-0">
                  <span>{s.name}</span>
                  <span className="text-sm text-gray-600">
                    {s.duration} dk · ₺{Number(s.price).toLocaleString('tr-TR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Personel ve hizmet yönetimi yakında eklenecek.
      </p>
    </div>
  );
}
