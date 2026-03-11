'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
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

  if (loading) return <div className="py-8 text-center">Yükleniyor...</div>;
  if (!business) return <div className="py-8 text-center text-red-600">İşletme bulunamadı</div>;

  return (
    <div className="py-6">
      <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">
        ← İşletmelere dön
      </Link>
      <h1 className="text-2xl font-bold mb-6">{business.name}</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Personel ({business.staff.length})</h2>
          {business.staff.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz personel eklenmemiş</p>
          ) : (
            <ul className="space-y-1">
              {business.staff.map((s) => (
                <li key={s.id}>{s.fullName}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Hizmetler ({business.services.length})</h2>
          {business.services.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz hizmet eklenmemiş</p>
          ) : (
            <ul className="space-y-1">
              {business.services.map((s) => (
                <li key={s.id}>
                  {s.name} — {s.duration} dk, {s.price} ₺
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Personel ve hizmet yönetimi yakında eklenecek.
      </p>
    </div>
  );
}
