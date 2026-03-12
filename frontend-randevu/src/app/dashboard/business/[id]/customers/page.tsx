'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
}

export default function CustomersPage() {
  const params = useParams();
  const businessId = params.id as string;
  const [businessName, setBusinessName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBusiness = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}`);
      if (res.data.success) setBusinessName(res.data.data.name);
    } catch {
      setBusinessName('');
    }
  };

  const triggerSearch = () => {
    setSearchQuery((prev) => prev);
  };

  useEffect(() => {
    loadBusiness();
  }, [businessId]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/businesses/${businessId}/customers`, {
          params: { q: searchQuery || undefined },
        });
        setCustomers(res.data.data || []);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [businessId, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="py-6">
      <Link
        href={`/dashboard/business/${businessId}`}
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {businessName || 'İşletme'} detayına dön
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Müşteri Sorgulama</h1>
        <Link href={`/dashboard/business/${businessId}/calendar`}>
          <Button size="sm">+ Randevu Ekle</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad veya Telefon</label>
              <Input
                placeholder="Örn: Ahmet Yılmaz veya 0532..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" variant="secondary" disabled={loading}>
                {loading ? 'Aranıyor...' : 'Ara'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSearchQuery('')}
              >
                Temizle
              </Button>
            </div>
          </form>
          <p className="text-sm text-gray-500 mt-2">
            Ad soyad veya telefon numarası ile müşteri arayabilirsiniz. Randevu ekleme, ödeme alma gibi işlemler için müşteri seçin.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sonuçlar {customers.length > 0 && `(${customers.length})`}
            </h2>
            {customers.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                {searchQuery.trim() ? (
                  <>"{searchQuery}" ile eşleşen müşteri bulunamadı.</>
                ) : (
                  <>Müşteri listesini görmek için arama yapın veya tüm müşterileri listelemek için boş bırakıp Ara'ya tıklayın.</>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/dashboard/business/${businessId}/customers/${c.id}`}
                    className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{c.fullName}</p>
                      <p className="text-sm text-gray-600">{c.phone}</p>
                      {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                    </div>
                    <span className="text-primary-600 text-sm font-medium">Detay →</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
