'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
  NO_SHOW: 'Gelmedi',
  POSTPONED: 'Ertelendi',
};

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  staff: { fullName: string };
  service: { name: string; duration: number; price: number };
}

interface Receivable {
  id: string;
  totalAmount: string;
  dueDate?: string | null;
  description?: string | null;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  payments: { id: string; amount: string; paidAt: string }[];
}

interface Package {
  id: string;
  totalSessions: number;
  remainingSessions: number;
  expiresAt?: string | null;
  service: { name: string };
}

interface FinanceEntry {
  id: string;
  type: string;
  amount: string;
  date: string;
  category: string;
  description?: string | null;
}

interface CustomerDetail {
  customer: { id: string; fullName: string; phone: string; email?: string | null };
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  receivables: Receivable[];
  totalDebt: number;
  packages: Package[];
  financeEntries: FinanceEntry[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const businessId = params.id as string;
  const customerId = params.customerId as string;
  const [businessName, setBusinessName] = useState('');
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{ receivableId: string; remaining: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadAll = async () => {
    try {
      const [bizRes, detailRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/customers/${customerId}/detail`),
      ]);
      if (bizRes.data.success) setBusinessName(bizRes.data.data.name);
      if (detailRes.data.success) setData(detailRes.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [businessId, customerId]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    const amt = parseFloat(paymentAmount);
    if (amt > paymentModal.remaining) {
      alert('Ödeme tutarı kalan borçtan fazla olamaz.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/receivables/${paymentModal.receivableId}/payments`, {
        amount: amt,
      });
      setPaymentModal(null);
      setPaymentAmount('');
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ödeme alınamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTimeString = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const getDateString = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">Müşteri bulunamadı</p>
        <Link href={`/dashboard/business/${businessId}/customers`} className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
          ← Müşterilere dön
        </Link>
      </div>
    );
  }

  const { customer, upcomingAppointments, pastAppointments, receivables, totalDebt, packages, financeEntries } = data;

  return (
    <div className="py-6">
      <Link
        href={`/dashboard/business/${businessId}/customers`}
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Müşteri sorgulamasına dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.fullName}</h1>
          <p className="text-gray-600">{customer.phone}</p>
          {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/business/${businessId}/calendar?addCustomerId=${customer.id}`}>
            <Button size="sm">+ Randevu Ekle</Button>
          </Link>
          <Link href={`/dashboard/business/${businessId}/finance`}>
            <Button variant="secondary" size="sm">Borç/Alacak</Button>
          </Link>
        </div>
      </div>

      {totalDebt > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Toplam Borç Bakiyesi</p>
                <p className="text-2xl font-bold text-amber-900">₺{totalDebt.toLocaleString('tr-TR')}</p>
              </div>
              <Link href={`/dashboard/business/${businessId}/finance`}>
                <Button size="sm">Ödeme Al</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gelecek Randevular ({upcomingAppointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Yaklaşan randevu yok.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingAppointments.map((a) => (
                  <li key={a.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{a.service.name}</p>
                      <p className="text-sm text-gray-600">
                        {getDateString(a.startAt)} · {getTimeString(a.startAt)}
                      </p>
                      <p className="text-xs text-gray-500">{a.staff.fullName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'COMPLETED' ? 'bg-green-100' : a.status === 'CANCELLED' ? 'bg-red-100' : 'bg-amber-100'}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/dashboard/business/${businessId}/calendar?addCustomerId=${customer.id}`} className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Yeni randevu
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geçmiş Randevular</CardTitle>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Geçmiş randevu yok.</p>
            ) : (
              <ul className="space-y-3 max-h-64 overflow-y-auto">
                {pastAppointments.map((a) => (
                  <li key={a.id} className="py-2 border-b border-gray-100 last:border-0">
                    <p className="font-medium text-gray-900">{a.service.name}</p>
                    <p className="text-sm text-gray-600">
                      {getDateString(a.startAt)} · {getTimeString(a.startAt)} · {a.staff.fullName}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded ${a.status === 'COMPLETED' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Borç/Alacaklar</CardTitle>
          </CardHeader>
          <CardContent>
            {receivables.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Kayıtlı borç/alacak yok.</p>
            ) : (
              <ul className="space-y-3">
                {receivables.map((r) => (
                  <li key={r.id} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">₺{Number(r.totalAmount).toLocaleString('tr-TR')}</p>
                        <p className="text-xs text-gray-500">
                          Ödenen: ₺{r.paidAmount.toLocaleString('tr-TR')} · Kalan: ₺{r.remainingAmount.toLocaleString('tr-TR')}
                        </p>
                        {r.dueDate && (
                          <p className="text-xs text-gray-500">Vade: {new Date(r.dueDate).toLocaleDateString('tr-TR')}</p>
                        )}
                      </div>
                      {r.remainingAmount > 0 && (
                        <Button size="sm" onClick={() => setPaymentModal({ receivableId: r.id, remaining: r.remainingAmount })}>
                          Ödeme Al
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/dashboard/business/${businessId}/finance`} className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Yeni borç ekle
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktif Paketler</CardTitle>
          </CardHeader>
          <CardContent>
            {packages.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Aktif paket yok.</p>
            ) : (
              <ul className="space-y-3">
                {packages.map((p) => (
                  <li key={p.id} className="py-2 border-b border-gray-100 last:border-0">
                    <p className="font-medium text-gray-900">{p.service.name}</p>
                    <p className="text-sm text-gray-600">
                      {p.remainingSessions}/{p.totalSessions} seans kalan
                    </p>
                    {p.expiresAt && (
                      <p className="text-xs text-gray-500">Bitiş: {new Date(p.expiresAt).toLocaleDateString('tr-TR')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {financeEntries.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Geçmiş Ödemeler (Randevu Gelirleri)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {financeEntries.map((e) => (
                <li key={e.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="font-medium">{e.category}</span>
                    {e.description && <span className="text-gray-500 ml-2">— {e.description}</span>}
                  </div>
                  <span className={e.type === 'INCOME' ? 'text-green-600 font-medium' : 'text-red-600'}>
                    {e.type === 'INCOME' ? '+' : '-'}₺{Number(e.amount).toLocaleString('tr-TR')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPaymentModal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ödeme Al</h2>
                <p className="text-sm text-gray-600 mb-2">Kalan borç: ₺{paymentModal.remaining.toLocaleString('tr-TR')}</p>
                <form onSubmit={handleAddPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={paymentModal.remaining}
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={isSaving} disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}>
                      Ödeme Al
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setPaymentModal(null)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
