'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CustomerPackage {
  id: string;
  totalSessions: number;
  remainingSessions: number;
  purchasedAt: string;
  expiresAt?: string | null;
  notes?: string | null;
  customer: { id: string; fullName: string; phone: string };
  service: { id: string; name: string };
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
}

export default function PackagesPage() {
  const params = useParams();
  const businessId = params.id as string;
  const [businessName, setBusinessName] = useState('');
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [expiring, setExpiring] = useState<CustomerPackage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active'>('active');
  const [form, setForm] = useState({
    customerId: '',
    serviceId: '',
    totalSessions: '10',
    expiresAt: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, [businessId, filter]);

  const loadAll = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter === 'active') params.active = 'true';
      const [bizRes, pkgRes, expRes, custRes, svcRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/packages`, { params }),
        api.get(`/businesses/${businessId}/packages/expiring`, { params: { days: 7 } }),
        api.get(`/businesses/${businessId}/customers`),
        api.get(`/businesses/${businessId}/services`),
      ]);
      if (bizRes.data.success) setBusinessName(bizRes.data.data.name);
      setPackages(pkgRes.data.data || []);
      setExpiring(expRes.data.data || []);
      setCustomers(custRes.data.data || []);
      setServices(svcRes.data.data || []);
    } catch {
      setPackages([]);
      setExpiring([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessions = parseInt(form.totalSessions, 10);
    if (!form.customerId || !form.serviceId || !sessions || sessions < 1) return;
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/packages`, {
        customerId: form.customerId,
        serviceId: form.serviceId,
        totalSessions: sessions,
        expiresAt: form.expiresAt || undefined,
        notes: form.notes || undefined,
      });
      setForm({ customerId: '', serviceId: '', totalSessions: '10', expiresAt: '', notes: '' });
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Paket eklenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/packages/${id}`);
      loadAll();
    } catch {
      alert('Silinemedi');
    }
  };

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('tr-TR') : '—';

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paket Takip Sistemi</h1>

      {expiring.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-amber-800">⚠️ Yaklaşan Bitiş ({expiring.length} paket)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiring.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                  <span className="font-medium">{p.customer.fullName}</span>
                  <span className="text-sm text-gray-600">{p.service.name}</span>
                  <span className="text-sm">
                    {p.remainingSessions}/{p.totalSessions} seans · Bitiş: {formatDate(p.expiresAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Yeni Paket Ekle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-4">
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="">Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet</label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="">Seçin</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Input
              type="number"
              min={1}
              label="Seans Sayısı"
              value={form.totalSessions}
              onChange={(e) => setForm({ ...form, totalSessions: e.target.value })}
              className="w-24"
            />
            <Input
              type="date"
              label="Bitiş Tarihi (opsiyonel)"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-40"
            />
            <Input
              placeholder="Not (opsiyonel)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="flex-1 min-w-[120px]"
            />
            <div className="flex items-end">
              <Button type="submit" size="sm" isLoading={isSaving} disabled={!form.customerId || !form.serviceId}>
                Ekle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Paketler</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded text-sm font-medium ${filter === 'active' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm font-medium ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Tümü
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <p className="text-gray-500 py-4">Henüz paket yok.</p>
          ) : (
            <div className="space-y-3">
              {packages.map((p) => {
                const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
                const isLow = p.remainingSessions <= 2;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-lg border ${isExpired ? 'border-red-200 bg-red-50/30' : isLow ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{p.customer.fullName}</p>
                        <p className="text-sm text-gray-600">{p.service.name}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${p.remainingSessions === 0 ? 'text-gray-400' : 'text-primary-600'}`}>
                          {p.remainingSessions} / {p.totalSessions} seans
                        </p>
                        {p.expiresAt && (
                          <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                            Bitiş: {formatDate(p.expiresAt)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Sil
                      </button>
                    </div>
                    {p.notes && <p className="text-sm text-gray-500 mt-2">{p.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
