'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const toLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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

interface Staff {
  id: string;
  fullName: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
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

  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [showAddReceivableModal, setShowAddReceivableModal] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    staffId: '',
    serviceId: '',
    date: toLocalDateString(new Date()),
    time: '',
    notes: '',
  });
  const [receivableForm, setReceivableForm] = useState({
    totalAmount: '',
    dueDate: '',
    description: '',
  });

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

  useEffect(() => {
    if (showAddAppointmentModal) {
      api.get(`/businesses/${businessId}/staff`).then((r) => setStaff(r.data.data || []));
      api.get(`/businesses/${businessId}/services`).then((r) => setServices(r.data.data || []));
    }
  }, [showAddAppointmentModal, businessId]);

  useEffect(() => {
    if (!appointmentForm.staffId || !appointmentForm.serviceId || !appointmentForm.date || !showAddAppointmentModal) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    api
      .get(`/businesses/${businessId}/slots`, {
        params: {
          staffId: appointmentForm.staffId,
          serviceId: appointmentForm.serviceId,
          date: appointmentForm.date,
        },
      })
      .then((r) => setAvailableSlots(r.data.data || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [appointmentForm.staffId, appointmentForm.serviceId, appointmentForm.date, showAddAppointmentModal, businessId]);

  const openAddAppointmentModal = () => {
    setAppointmentForm({
      staffId: '',
      serviceId: '',
      date: toLocalDateString(new Date()),
      time: '',
      notes: '',
    });
    setShowAddAppointmentModal(true);
  };

  const openAddReceivableModal = () => {
    setReceivableForm({ totalAmount: '', dueDate: '', description: '' });
    setShowAddReceivableModal(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.staffId || !appointmentForm.serviceId || !appointmentForm.date || !appointmentForm.time) {
      alert('Personel, hizmet, tarih ve müsait bir saat seçin.');
      return;
    }
    setIsSaving(true);
    try {
      const startAt = new Date(`${appointmentForm.date}T${appointmentForm.time}:00`);
      await api.post(`/businesses/${businessId}/appointments`, {
        staffId: appointmentForm.staffId,
        serviceId: appointmentForm.serviceId,
        customerId,
        startAt: startAt.toISOString(),
        notes: appointmentForm.notes || undefined,
      });
      setShowAddAppointmentModal(false);
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Randevu oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(receivableForm.totalAmount);
    if (!amt || amt <= 0) {
      alert('Geçerli tutar girin.');
      return;
    }
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/receivables`, {
        customerId,
        totalAmount: amt,
        dueDate: receivableForm.dueDate || undefined,
        description: receivableForm.description || undefined,
      });
      setShowAddReceivableModal(false);
      loadAll();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Borç eklenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

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
          <Button size="sm" onClick={openAddAppointmentModal}>+ Randevu Ekle</Button>
          <Button variant="secondary" size="sm" onClick={openAddReceivableModal}>+ Borç Ekle</Button>
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
              <Button
                size="sm"
                onClick={() => {
                  const first = receivables.find((r) => r.remainingAmount > 0);
                  if (first) setPaymentModal({ receivableId: first.id, remaining: first.remainingAmount });
                }}
              >
                Ödeme Al
              </Button>
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
            <button type="button" onClick={openAddAppointmentModal} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Yeni randevu
            </button>
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
                  <li key={r.id} className="py-3 border-b border-gray-100 last:border-0">
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
                    {r.payments && r.payments.length > 0 && (
                      <div className="mt-2 ml-0 pl-3 border-l-2 border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1">Ödeme geçmişi</p>
                        <ul className="space-y-1">
                          {r.payments.map((p) => (
                            <li key={p.id} className="text-xs text-gray-600 flex justify-between">
                              <span>{new Date(p.paidAt).toLocaleDateString('tr-TR')} {new Date(p.paidAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-green-600 font-medium">+₺{Number(p.amount).toLocaleString('tr-TR')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={openAddReceivableModal} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Yeni borç ekle
            </button>
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

      {showAddAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddAppointmentModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Randevu — {customer.fullName}</h2>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
                    <select
                      value={appointmentForm.staffId}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, staffId: e.target.value, time: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Seçin</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet *</label>
                    <select
                      value={appointmentForm.serviceId}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, serviceId: e.target.value, time: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Seçin</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.duration} dk)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                    <input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value, time: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                    {appointmentForm.staffId && appointmentForm.serviceId && appointmentForm.date ? (
                      loadingSlots ? (
                        <div className="py-4 text-center text-sm text-gray-500">Müsait saatler yükleniyor...</div>
                      ) : availableSlots.length === 0 ? (
                        <div className="py-4 px-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                          Bu tarihte müsait saat yok.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => setAppointmentForm((prev) => ({ ...prev, time: slot.start }))}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                appointmentForm.time === slot.start
                                  ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                                  : 'bg-gray-100 text-gray-800 hover:bg-primary-50 border border-transparent'
                              }`}
                            >
                              {slot.start}
                            </button>
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="text-sm text-gray-500 py-2">Önce personel, hizmet ve tarih seçin.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                    <textarea
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" isLoading={isSaving} disabled={!appointmentForm.time || loadingSlots}>
                      Randevu Oluştur
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowAddAppointmentModal(false)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showAddReceivableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddReceivableModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Yeni Borç — {customer.fullName}</h2>
                <form onSubmit={handleAddReceivable} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={receivableForm.totalAmount}
                      onChange={(e) => setReceivableForm({ ...receivableForm, totalAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vade Tarihi</label>
                    <input
                      type="date"
                      value={receivableForm.dueDate}
                      onChange={(e) => setReceivableForm({ ...receivableForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={receivableForm.description}
                      onChange={(e) => setReceivableForm({ ...receivableForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" isLoading={isSaving} disabled={!receivableForm.totalAmount || parseFloat(receivableForm.totalAmount) <= 0}>
                      Borç Ekle
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setShowAddReceivableModal(false)}>
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
