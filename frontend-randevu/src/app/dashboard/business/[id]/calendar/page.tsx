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
  staff: { id: string; fullName: string; color?: string | null };
  service: { id: string; name: string; duration: number; price: number };
  customer: { id: string; fullName: string; phone: string };
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
    time: '09:00',
    notes: '',
  });
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);

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
      alert('Personel, hizmet, müşteri, tarih ve saat zorunludur.');
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
      });
      setShowAddModal(false);
      setNewAppointment({ staffId: '', serviceId: '', customerId: '', date: '', time: '09:00', notes: '' });
      loadData();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Randevu oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.fullName.trim() || !newCustomer.phone.trim()) {
      alert('Ad soyad ve telefon zorunludur.');
      return;
    }
    try {
      const res = await api.post(`/businesses/${businessId}/customers`, newCustomer);
      setCustomers((prev) => [...prev, res.data.data]);
      setNewCustomer({ fullName: '', phone: '', email: '' });
    } catch {
      alert('Müşteri eklenemedi.');
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
          <Button size="sm" onClick={() => {
            setShowAddModal(true);
            const today = new Date();
            setNewAppointment((prev) => ({ ...prev, date: today.toISOString().slice(0, 10) }));
          }}>
            + Randevu Ekle
          </Button>
        </div>
      </div>

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
                    <div className="flex gap-1 mt-1">
                      <span className={`px-1 rounded text-[10px] ${a.status === 'COMPLETED' ? 'bg-green-100' : a.status === 'CANCELLED' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Randevu</h2>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personel</label>
                  <select
                    value={newAppointment.staffId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, staffId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet</label>
                  <select
                    value={newAppointment.serviceId}
                    onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value })}
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
                      <option value="">Seçin</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Yeni müşteri ekle:</p>
                    <form onSubmit={handleCreateCustomer} className="flex flex-wrap gap-2">
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
                      <Button type="submit" size="sm" variant="secondary">
                        Ekle
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
                    <input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
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
                <div className="flex gap-2 pt-4">
                  <Button type="submit" isLoading={isSaving}>
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
      )}
    </div>
  );
}
