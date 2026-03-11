'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const INCOME_CATEGORIES = ['Randevu', 'Ürün', 'Hizmet', 'Diğer'];
const EXPENSE_CATEGORIES = ['Kira', 'Maaş', 'Malzeme', 'Fatura', 'Diğer'];

interface FinanceEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  date: string;
  category: string;
  description?: string | null;
}

interface Receivable {
  id: string;
  totalAmount: string;
  dueDate?: string | null;
  description?: string | null;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  customer: { id: string; fullName: string; phone: string };
  payments: { id: string; amount: string; paidAt: string }[];
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  totalReceivable: number;
  totalPaidReceivable: number;
  totalOutstanding: number;
}

export default function FinancePage() {
  const params = useParams();
  const businessId = params.id as string;
  const [businessName, setBusinessName] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [customers, setCustomers] = useState<{ id: string; fullName: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'receivables'>('entries');
  const [filterType, setFilterType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');

  const now = new Date();
  const [dateRange, setDateRange] = useState({
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  });

  const [entryForm, setEntryForm] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Randevu',
    description: '',
  });

  const [receivableForm, setReceivableForm] = useState({
    customerId: '',
    totalAmount: '',
    dueDate: '',
    description: '',
  });

  const [paymentForm, setPaymentForm] = useState<{ receivableId: string; amount: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, [businessId, dateRange]);

  const loadAll = async () => {
    try {
      const [bizRes, sumRes, entRes, recRes, custRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/finance/summary`, { params: { start: dateRange.start, end: dateRange.end } }),
        api.get(`/businesses/${businessId}/finance`, { params: { start: dateRange.start, end: dateRange.end } }),
        api.get(`/businesses/${businessId}/receivables`),
        api.get(`/businesses/${businessId}/customers`),
      ]);
      if (bizRes.data.success) setBusinessName(bizRes.data.data.name);
      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (entRes.data.success) setEntries(entRes.data.data);
      if (recRes.data.success) setReceivables(recRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data || []);
    } catch {
      setSummary(null);
      setEntries([]);
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(entryForm.amount);
    if (!amt || amt <= 0) return;
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/finance`, {
        type: entryForm.type,
        amount: amt,
        date: entryForm.date,
        category: entryForm.category,
        description: entryForm.description || undefined,
      });
      setEntryForm({ ...entryForm, amount: '', description: '' });
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Kayıt eklenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/finance/${id}`);
      loadAll();
    } catch {
      alert('Silinemedi');
    }
  };

  const handleAddReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(receivableForm.totalAmount);
    if (!receivableForm.customerId || !amt || amt <= 0) return;
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/receivables`, {
        customerId: receivableForm.customerId,
        totalAmount: amt,
        dueDate: receivableForm.dueDate || undefined,
        description: receivableForm.description || undefined,
      });
      setReceivableForm({ customerId: '', totalAmount: '', dueDate: '', description: '' });
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Alacak eklenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return;
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/receivables/${paymentForm.receivableId}/payments`, {
        amount: parseFloat(paymentForm.amount),
      });
      setPaymentForm(null);
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ödeme eklenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReceivable = async (id: string) => {
    if (!confirm('Bu alacak kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/receivables/${id}`);
      loadAll();
    } catch {
      alert('Silinemedi');
    }
  };

  const formatMoney = (v: number | string) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(v));

  const filteredEntries = entries.filter((e) => filterType === 'all' || e.type === filterType);

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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gelir, Gider ve Alacak Takibi</h1>

      {/* Tarih aralığı */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Özet kartları */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-gray-500">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(summary.totalIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-gray-500">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-600">{formatMoney(summary.totalExpense)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-gray-500">Net</p>
              <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatMoney(summary.net)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-gray-500">Bekleyen Alacak</p>
              <p className="text-2xl font-bold text-amber-600">{formatMoney(summary.totalOutstanding)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'entries' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Gelir / Gider
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'receivables' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Alacaklar
        </button>
      </div>

      {activeTab === 'entries' && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Yeni Kayıt Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEntry} className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select
                    value={entryForm.type}
                    onChange={(e) =>
                      setEntryForm({
                        ...entryForm,
                        type: e.target.value as 'INCOME' | 'EXPENSE',
                        category: e.target.value === 'INCOME' ? 'Randevu' : 'Kira',
                      })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="INCOME">Gelir</option>
                    <option value="EXPENSE">Gider</option>
                  </select>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Tutar"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                  className="w-32"
                />
                <Input
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                  className="w-40"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={entryForm.category}
                    onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {(entryForm.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <Input
                  placeholder="Açıklama (opsiyonel)"
                  value={entryForm.description}
                  onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                  className="flex-1 min-w-[160px]"
                />
                <Button type="submit" size="sm" isLoading={isSaving} disabled={!entryForm.amount}>
                  Ekle
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kayıtlar</CardTitle>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'INCOME' | 'EXPENSE')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Tümü</option>
                <option value="INCOME">Gelir</option>
                <option value="EXPENSE">Gider</option>
              </select>
            </CardHeader>
            <CardContent>
              {filteredEntries.length === 0 ? (
                <p className="text-gray-500 py-4">Henüz kayıt yok.</p>
              ) : (
                <div className="space-y-2">
                  {filteredEntries.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <span className={`font-medium ${e.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {e.type === 'INCOME' ? '+' : '-'} {formatMoney(e.amount)}
                        </span>
                        <span className="text-gray-500 ml-2">{e.category}</span>
                        {e.description && <span className="text-gray-400 ml-2">— {e.description}</span>}
                        <span className="text-sm text-gray-400 ml-2">
                          {new Date(e.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'receivables' && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Yeni Alacak Ekle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddReceivable} className="flex flex-wrap gap-4">
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                  <select
                    value={receivableForm.customerId}
                    onChange={(e) => setReceivableForm({ ...receivableForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  >
                    <option value="">Seçin</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Tutar"
                  value={receivableForm.totalAmount}
                  onChange={(e) => setReceivableForm({ ...receivableForm, totalAmount: e.target.value })}
                  className="w-32"
                  required
                />
                <Input
                  type="date"
                  placeholder="Vade"
                  value={receivableForm.dueDate}
                  onChange={(e) => setReceivableForm({ ...receivableForm, dueDate: e.target.value })}
                  className="w-40"
                />
                <Input
                  placeholder="Açıklama (opsiyonel)"
                  value={receivableForm.description}
                  onChange={(e) => setReceivableForm({ ...receivableForm, description: e.target.value })}
                  className="flex-1 min-w-[160px]"
                />
                <Button type="submit" size="sm" isLoading={isSaving} disabled={!receivableForm.customerId || !receivableForm.totalAmount}>
                  Ekle
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alacak Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {receivables.length === 0 ? (
                <p className="text-gray-500 py-4">Henüz alacak kaydı yok.</p>
              ) : (
                <div className="space-y-4">
                  {receivables.map((r) => (
                    <div key={r.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{r.customer.fullName}</p>
                          <p className="text-sm text-gray-500">{r.customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-600">{formatMoney(r.remainingAmount)}</p>
                          <p className="text-sm text-gray-500">
                            Toplam: {formatMoney(r.totalAmount)} · Ödenen: {formatMoney(r.paidAmount)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {r.remainingAmount > 0 && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPaymentForm({ receivableId: r.id, amount: String(r.remainingAmount) })}
                            >
                              Tahsilat
                            </Button>
                          )}
                          <button
                            onClick={() => handleDeleteReceivable(r.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                      {r.description && <p className="text-sm text-gray-500 mt-2">{r.description}</p>}
                      {r.payments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Tahsilatlar:</p>
                          {r.payments.map((p) => (
                            <p key={p.id} className="text-sm text-gray-600">
                              {formatMoney(p.amount)} — {new Date(p.paidAt).toLocaleDateString('tr-TR')}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {paymentForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full">
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle>Tahsilat Ekle</CardTitle>
                  <button onClick={() => setPaymentForm(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      label="Tutar"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" isLoading={isSaving} disabled={!paymentForm.amount}>
                        Kaydet
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setPaymentForm(null)}>
                        İptal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
