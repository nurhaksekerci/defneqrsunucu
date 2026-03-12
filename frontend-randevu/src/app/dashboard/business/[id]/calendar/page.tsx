'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { WeekCalendarView } from './WeekCalendarView';
import { StaffCalendarView } from './StaffCalendarView';
import { AppointmentDetailModal } from './AppointmentDetailModal';

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string | null;
  seriesId?: string | null;
  recurrenceType?: string | null;
  staff: { id: string; fullName: string; color?: string | null };
  service: { id: string; name: string; duration: number; price: number };
  customer: { id: string; fullName: string; phone: string };
}

interface Staff {
  id: string;
  fullName: string;
  color?: string | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
  NO_SHOW: 'Gelmedi',
  POSTPONED: 'Ertelendi',
};

type CalendarView = 'week' | 'day' | 'staff';

const STAFF_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-violet-100 border-violet-300 text-violet-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
];

export default function CalendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const businessId = params.id as string;
  const [businessName, setBusinessName] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    staffId: '',
    serviceId: '',
    customerId: '',
    date: '',
    time: '',
    notes: '',
    recurrenceType: '' as '' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    recurrenceEndDate: '',
  });
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [completeModal, setCompleteModal] = useState<{ appointment: Appointment; packages: { id: string; remainingSessions: number; totalSessions: number; service: { name: string } }[] } | null>(null);
  const [detailModal, setDetailModal] = useState<Appointment | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loadData = async () => {
    try {
      const [bizRes, appRes, staffRes, svcRes, custRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/appointments`, {
          params: {
            start: startOfWeek(currentDate).toISOString(),
            end: endOfWeek(currentDate).toISOString(),
          },
        }),
        api.get(`/businesses/${businessId}/staff`),
        api.get(`/businesses/${businessId}/services`),
        api.get(`/businesses/${businessId}/customers`),
      ]);
      if (bizRes.data.success) setBusinessName(bizRes.data.data.name);
      setAppointments(appRes.data.data || []);
      setStaff(staffRes.data.data || []);
      setServices(svcRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch {
      setAppointments([]);
      setStaff([]);
      setServices([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId, currentDate]);

  const addCustomerId = searchParams.get('addCustomerId');
  const [hasOpenedFromUrl, setHasOpenedFromUrl] = useState(false);
  useEffect(() => {
    if (addCustomerId && customers.length > 0 && !hasOpenedFromUrl) {
      const exists = customers.some((c) => c.id === addCustomerId);
      if (exists) {
        setNewAppointment((prev) => ({ ...prev, customerId: addCustomerId }));
        setShowAddModal(true);
        setHasOpenedFromUrl(true);
      }
    }
  }, [addCustomerId, customers, hasOpenedFromUrl]);

  // Personel, hizmet ve tarih seçildiğinde müsait saatleri yükle
  useEffect(() => {
    if (!newAppointment.staffId || !newAppointment.serviceId || !newAppointment.date || !showAddModal) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    api
      .get(`/businesses/${businessId}/slots`, {
        params: {
          staffId: newAppointment.staffId,
          serviceId: newAppointment.serviceId,
          date: newAppointment.date,
        },
      })
      .then((res) => setAvailableSlots(res.data.data || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [newAppointment.staffId, newAppointment.serviceId, newAppointment.date, showAddModal, businessId]);

  const startOfWeek = (d: Date) => {
    const res = new Date(d);
    const day = res.getDay();
    res.setDate(res.getDate() - (day === 0 ? 6 : day - 1));
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const endOfWeek = (d: Date) => {
    const res = startOfWeek(d);
    res.setDate(res.getDate() + 6);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek(currentDate));
    d.setDate(d.getDate() + i);
    return d;
  });

  const getAppointmentsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return appointments.filter((a) => {
      const start = new Date(a.startAt);
      return start >= dayStart && start <= dayEnd;
    });
  };

  const getAppointmentsForStaffAndDay = (staffId: string, date: Date) => {
    return getAppointmentsForDay(date).filter((a) => a.staff.id === staffId);
  };

  const getTimeString = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppointment.staffId || !newAppointment.serviceId || !newAppointment.customerId || !newAppointment.date || !newAppointment.time) {
      alert('Personel, hizmet, müşteri, tarih ve müsait bir saat seçin.');
      return;
    }
    setIsSaving(true);
    try {
      const startAt = new Date(`${newAppointment.date}T${newAppointment.time}:00`);
      await api.post(`/businesses/${businessId}/appointments`, {
        staffId: newAppointment.staffId,
        serviceId: newAppointment.serviceId,
        customerId: newAppointment.customerId,
        startAt: startAt.toISOString(),
        notes: newAppointment.notes || undefined,
        recurrenceType: newAppointment.recurrenceType || undefined,
        recurrenceEndDate: newAppointment.recurrenceEndDate || undefined,
      });
      setShowAddModal(false);
      setNewAppointment({ staffId: '', serviceId: '', customerId: '', date: '', time: '', notes: '', recurrenceType: '', recurrenceEndDate: '' });
      loadData();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Randevu oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!newCustomer.fullName.trim() || !newCustomer.phone.trim()) {
      alert('Ad soyad ve telefon zorunludur.');
      return;
    }
    setIsAddingCustomer(true);
    try {
      const res = await api.post(`/businesses/${businessId}/customers`, newCustomer);
      const added = res.data.data;
      setCustomers((prev) => [...prev, added]);
      setNewAppointment((prev) => ({ ...prev, customerId: added.id }));
      setNewCustomer({ fullName: '', phone: '', email: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Müşteri eklenemedi.');
    } finally {
      setIsAddingCustomer(false);
    }
  };

  const toLocalDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const openAddModal = (prefillDate?: Date, prefillStaffId?: string) => {
    const d = prefillDate || new Date();
    const endDate = new Date(d);
    endDate.setMonth(endDate.getMonth() + 3);
    setNewAppointment((prev) => ({
      ...prev,
      date: toLocalDateString(d),
      time: '',
      staffId: prefillStaffId || prev.staffId,
      recurrenceType: '',
      recurrenceEndDate: toLocalDateString(endDate),
    }));
    setShowAddModal(true);
  };

  const handleCompleteClick = async (appointment: Appointment) => {
    try {
      const res = await api.get(`/businesses/${businessId}/packages/for-customer`, {
        params: { customerId: appointment.customer.id, serviceId: appointment.service.id },
      });
      const pkgs = res?.data?.data || [];
      if (pkgs.length > 0) {
        setCompleteModal({ appointment, packages: pkgs });
        return;
      }
    } catch {
      // ignore
    }
    handleUpdateStatus(appointment.id, 'COMPLETED');
  };

  const handleUpdateStatus = async (appointmentId: string, status: string, usePackageId?: string) => {
    try {
      await api.put(`/businesses/${businessId}/appointments/${appointmentId}`, {
        status,
        ...(usePackageId && { usePackageId }),
      });
      setCompleteModal(null);
      loadData();
    } catch {
      alert('Durum güncellenemedi.');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await api.delete(`/businesses/${businessId}/appointments/${appointmentId}`);
      setDetailModal(null);
      loadData();
    } catch {
      alert('Randevu silinemedi.');
    }
  };


  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canAddAppointment = staff.length > 0 && services.length > 0;

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Takvim</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'week' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Haftalık
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('staff')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'staff' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👤 Personel Takvimi
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'day' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Günlük
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrevWeek}>
              ← Önceki
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
              {weekDays[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <Button variant="secondary" size="sm" onClick={handleNextWeek}>
              Sonraki →
            </Button>
            <Button size="sm" onClick={() => openAddModal()}>
              + Randevu Ekle
            </Button>
          </div>
        </div>
      </div>

      {!canAddAppointment && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          Randevu ekleyebilmek için önce <Link href={`/dashboard/business/${businessId}`} className="font-medium underline hover:no-underline">personel ve hizmet</Link> eklemeniz gerekiyor.
        </div>
      )}

      {calendarView === 'week' && (
        <WeekCalendarView
          weekDays={weekDays}
          today={today}
          appointments={appointments}
          staff={staff}
          canAddAppointment={canAddAppointment}
          onAddClick={openAddModal}
          onAppointmentClick={(a) => setDetailModal(a)}
          getAppointmentsForDay={getAppointmentsForDay}
          getTimeString={getTimeString}
          statusLabels={STATUS_LABELS}
          staffColors={STAFF_COLORS}
        />
      )}
      {calendarView === 'staff' && (
        staff.length === 0 ? (
          <div className="py-12 text-center text-gray-500 rounded-xl border border-gray-200 bg-gray-50">
            Henüz personel yok. <Link href={`/dashboard/business/${businessId}`} className="text-primary-600 hover:underline">Personel ekleyin</Link>
          </div>
        ) : (
          <StaffCalendarView
            weekDays={weekDays}
            today={today}
            staff={staff}
            canAddAppointment={canAddAppointment}
            onAddClick={openAddModal}
            onAppointmentClick={(a) => setDetailModal(a)}
            getAppointmentsForStaffAndDay={getAppointmentsForStaffAndDay}
            getTimeString={getTimeString}
            statusLabels={STATUS_LABELS}
            staffColors={STAFF_COLORS}
          />
        )
      )}
      {calendarView === 'day' && (
        <WeekCalendarView
          weekDays={weekDays}
          today={today}
          appointments={appointments}
          staff={staff}
          canAddAppointment={canAddAppointment}
          onAddClick={openAddModal}
          onAppointmentClick={(a) => setDetailModal(a)}
          getAppointmentsForDay={getAppointmentsForDay}
          getTimeString={getTimeString}
          statusLabels={STATUS_LABELS}
          staffColors={STAFF_COLORS}
        />
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Randevu</h2>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
                  <select
                    value={newAppointment.staffId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, staffId: e.target.value, time: '' })}
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
                    value={newAppointment.serviceId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value, time: '' })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                  <div className="flex gap-2">
                    <select
                      value={newAppointment.customerId}
                      onChange={(e) => setNewAppointment({ ...newAppointment, customerId: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">
                        {customers.length === 0 ? 'Önce aşağıdan müşteri ekleyin' : 'Seçin'}
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs text-gray-600 mb-2">Yeni müşteri ekle (otomatik seçilir):</p>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        placeholder="Ad Soyad"
                        value={newCustomer.fullName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                        className="flex-1 min-w-[100px]"
                      />
                      <Input
                        placeholder="Telefon"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        className="w-28"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        isLoading={isAddingCustomer}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateCustomer(e as unknown as React.FormEvent);
                        }}
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value, time: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                  {newAppointment.staffId && newAppointment.serviceId && newAppointment.date ? (
                    <>
                      {loadingSlots ? (
                        <div className="py-4 text-center text-sm text-gray-500">Müsait saatler yükleniyor...</div>
                      ) : availableSlots.length === 0 ? (
                        <div className="py-4 px-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                          Bu tarihte müsait saat yok. Personel kapalı veya tüm slotlar dolu.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => setNewAppointment((prev) => ({ ...prev, time: slot.start }))}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                newAppointment.time === slot.start
                                  ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                                  : 'bg-gray-100 text-gray-800 hover:bg-primary-50 hover:border-primary-200 border border-transparent'
                              }`}
                            >
                              {slot.start}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">Önce personel, hizmet ve tarih seçin.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
                <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">🔄 Tekrar Eden Randevu</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tekrar sıklığı</label>
                      <select
                        value={newAppointment.recurrenceType}
                        onChange={(e) => setNewAppointment({ ...newAppointment, recurrenceType: e.target.value as '' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Tekrarlama</option>
                        <option value="WEEKLY">Haftalık</option>
                        <option value="BIWEEKLY">İki haftada bir</option>
                        <option value="MONTHLY">Aylık</option>
                      </select>
                    </div>
                    {newAppointment.recurrenceType && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tekrar bitiş tarihi</label>
                        <input
                          type="date"
                          value={newAppointment.recurrenceEndDate}
                          min={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, recurrenceEndDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={!newAppointment.time || loadingSlots}
                  >
                    Randevu Oluştur
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {detailModal && (
        <AppointmentDetailModal
          appointment={detailModal}
          staff={staff}
          services={services}
          businessId={businessId}
          statusLabels={STATUS_LABELS}
          onClose={() => setDetailModal(null)}
          onUpdate={loadData}
          onDelete={handleDeleteAppointment}
          onComplete={(a) => {
            setDetailModal(null);
            handleCompleteClick(a);
          }}
          getTimeString={getTimeString}
        />
      )}

      {completeModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setCompleteModal(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Randevuyu Tamamla</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {completeModal.appointment.customer.fullName} — {completeModal.appointment.service.name}
                </p>
                <p className="text-sm font-medium text-gray-700 mb-2">Paket kullan?</p>
                <div className="space-y-2 mb-4">
                  {completeModal.packages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleUpdateStatus(completeModal.appointment.id, 'COMPLETED', p.id)}
                      className="w-full py-2 px-3 text-left rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 text-primary-800 font-medium"
                    >
                      {p.service.name} — {p.remainingSessions}/{p.totalSessions} seans kalan
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(completeModal.appointment.id, 'COMPLETED')}
                    className="w-full py-2 px-3 text-left rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                  >
                    Paket kullanma (nakit/ödeme)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCompleteModal(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  İptal
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
