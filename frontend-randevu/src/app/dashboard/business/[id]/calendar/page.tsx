'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/appointments/${appointmentId}`);
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

      {calendarView === 'week' ? (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="min-w-[900px]">
            {/* Google Takvim tarzı: üstte günler, solda saatler */}
            <div className="flex border-b border-gray-200">
              <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/80" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`flex-1 min-w-0 p-2 text-center border-r border-gray-200 last:border-r-0 ${
                    day.getTime() === today.getTime() ? 'bg-primary-50' : 'bg-gray-50/80'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                  <div className={`text-lg font-semibold ${day.getTime() === today.getTime() ? 'text-primary-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">{day.toLocaleDateString('tr-TR', { month: 'short' })}</div>
                </div>
              ))}
            </div>
            <div className="flex" style={{ height: 17 * 48 }}>
              <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50/50">
                {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                  <div key={h} className="h-12 border-b border-gray-100 text-right pr-2 text-xs text-gray-500 leading-[48px]">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              {weekDays.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day).sort(
                    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
                  );
                  const ROW_HEIGHT = 48;
                  const START_HOUR = 6;
                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex-1 min-w-0 relative border-r border-gray-200 last:border-r-0 ${
                        day.getTime() === today.getTime() ? 'bg-primary-50/20' : 'bg-white'
                      }`}
                    >
                      {/* Saat çizgileri */}
                      {Array.from({ length: 17 }, (_, i) => (
                        <div key={i} className="absolute left-0 right-0 border-b border-gray-100" style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }} />
                      ))}
                      {/* Boş hücrelere tıklama - randevu ekle */}
                      {Array.from({ length: 17 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openAddModal(day)}
                          disabled={!canAddAppointment}
                          className="absolute left-0 right-0 opacity-0 hover:opacity-100 hover:bg-primary-50/50 transition-opacity disabled:pointer-events-none"
                          style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
                        />
                      ))}
                      {/* Randevu blokları */}
                      {dayAppointments.map((a, idx) => {
                        const start = new Date(a.startAt);
                        const end = new Date(a.endAt);
                        const startMinutes = start.getHours() * 60 + start.getMinutes();
                        const endMinutes = end.getHours() * 60 + end.getMinutes();
                        const top = Math.max(0, (startMinutes - START_HOUR * 60) / 60) * ROW_HEIGHT;
                        const durationMinutes = endMinutes - startMinutes;
                        const height = Math.max(24, (durationMinutes / 60) * ROW_HEIGHT);
                        const staffIdx = staff.findIndex((s) => s.id === a.staff.id);
                        return (
                          <div
                            key={a.id}
                            className={`absolute left-1 right-1 rounded overflow-hidden shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${STAFF_COLORS[(staffIdx >= 0 ? staffIdx : idx) % STAFF_COLORS.length]}`}
                            style={{ top: top + 2, height: height - 4, minHeight: 20 }}
                            title={`${a.customer.fullName} - ${a.service.name} ${getTimeString(a.startAt)}`}
                          >
                            <div className="p-1.5 h-full overflow-hidden text-xs">
                              <div className="font-semibold truncate">{a.customer.fullName}</div>
                              <div className="truncate opacity-90">{a.service.name}</div>
                              <div className="opacity-80">{getTimeString(a.startAt)}</div>
                              <div className="flex gap-1 mt-0.5 flex-wrap items-center">
                                <span className={`px-1 rounded text-[9px] ${a.status === 'COMPLETED' ? 'bg-green-200' : a.status === 'CANCELLED' ? 'bg-red-200' : 'bg-amber-200'}`}>
                                  {STATUS_LABELS[a.status] || a.status}
                                </span>
                                {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleCompleteClick(a); }} className="text-[9px] font-medium hover:underline">
                                    Tamamla
                                  </button>
                                )}
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(a.id); }} className="text-[9px] text-red-600 hover:underline ml-auto">
                                  Sil
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : calendarView === 'staff' ? (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-40 min-w-[160px] px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Personel
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className={`px-3 py-3 text-center min-w-[140px] ${
                        day.getTime() === today.getTime() ? 'bg-primary-50 text-primary-800' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>
                      <div className="text-xs font-normal opacity-80">{day.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Henüz personel yok. <Link href={`/dashboard/business/${businessId}`} className="text-primary-600 hover:underline">Personel ekleyin</Link>
                    </td>
                  </tr>
                ) : (
                  staff.map((s, idx) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 sticky left-0 bg-white border-r border-gray-200 z-10">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color || ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'][idx % 6] }}
                          />
                          <span className="font-medium text-gray-900">{s.fullName}</span>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dayAppointments = getAppointmentsForStaffAndDay(s.id, day);
                        return (
                          <td
                            key={day.toISOString()}
                            className={`align-top p-2 min-h-[120px] ${
                              day.getTime() === today.getTime() ? 'bg-primary-50/20' : 'bg-white'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => openAddModal(day, s.id)}
                              disabled={!canAddAppointment}
                              className="w-full py-1.5 mb-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-dashed border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            >
                              + Ekle
                            </button>
                            <div className="space-y-1.5">
                              {dayAppointments.map((a) => (
                                <div
                                  key={a.id}
                                  className={`p-2 rounded-lg text-xs border shadow-sm ${STAFF_COLORS[idx % STAFF_COLORS.length]}`}
                                >
                                  <div className="font-semibold truncate">{a.customer.fullName}</div>
                                  <div className="text-[10px] opacity-90 truncate">{a.service.name}</div>
                                  <div className="text-[10px] mt-0.5">{getTimeString(a.startAt)}</div>
                                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                                    <span className={`px-1 rounded text-[9px] ${a.status === 'COMPLETED' ? 'bg-green-200' : a.status === 'CANCELLED' ? 'bg-red-200' : 'bg-amber-200'}`}>
                                      {STATUS_LABELS[a.status] || a.status}
                                    </span>
                                    {(a as { seriesId?: string }).seriesId && (
                                      <span className="text-[9px]" title="Tekrarlayan">🔄</span>
                                    )}
                                    {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                                      <button type="button" onClick={() => handleCompleteClick(a)} className="text-[9px] font-medium hover:underline">
                                        Tamamla
                                      </button>
                                    )}
                                    <button type="button" onClick={() => handleDeleteAppointment(a.id)} className="text-[9px] text-red-600 hover:underline ml-auto">
                                      Sil
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[700px] gap-2">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`rounded-lg border-2 p-3 min-h-[200px] ${
                  day.getTime() === today.getTime() ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="text-center font-semibold text-gray-900 mb-2">
                  {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </div>
                <div className="text-center text-sm text-gray-600 mb-3">
                  {day.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal(day)}
                  disabled={!canAddAppointment}
                  className="w-full py-2 mb-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-dashed border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  + Randevu
                </button>
                <div className="space-y-2">
                  {getAppointmentsForDay(day).map((a) => (
                    <div
                      key={a.id}
                      className="p-2 rounded text-xs bg-white border border-gray-200 shadow-sm"
                    >
                      <div className="font-medium text-gray-900 truncate">{a.customer.fullName}</div>
                      <div className="text-gray-600 truncate">{a.service.name}</div>
                      <div className="text-gray-500">
                        {getTimeString(a.startAt)} - {a.staff.fullName}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap items-center">
                        <span className={`px-1 rounded text-[10px] ${a.status === 'COMPLETED' ? 'bg-green-100' : a.status === 'CANCELLED' ? 'bg-red-100' : 'bg-amber-100'}`}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                        {(a as { seriesId?: string }).seriesId && (
                          <span className="text-[10px] text-violet-600" title="Tekrarlayan randevu">🔄</span>
                        )}
                        {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteClick(a)}
                            className="text-[10px] text-green-600 hover:text-green-700"
                          >
                            Tamamla
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAppointment(a.id)}
                          className="text-red-600 hover:text-red-700 ml-auto"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
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
