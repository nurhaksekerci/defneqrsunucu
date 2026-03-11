'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AppointmentLike {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string | null;
  seriesId?: string | null;
  staff: { id: string; fullName: string };
  service: { id: string; name: string; duration: number; price: number };
  customer: { id: string; fullName: string; phone: string };
}

interface StaffLike {
  id: string;
  fullName: string;
}

interface ServiceLike {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface AppointmentDetailModalProps {
  appointment: AppointmentLike;
  staff: StaffLike[];
  services: ServiceLike[];
  businessId: string;
  statusLabels: Record<string, string>;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onComplete: (appointment: AppointmentLike) => void;
  getTimeString: (dateStr: string) => string;
}

function toLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalTimeString(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AppointmentDetailModal({
  appointment,
  staff,
  services,
  businessId,
  statusLabels,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
  getTimeString,
}: AppointmentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    staffId: '',
    serviceId: '',
    date: '',
    time: '',
    notes: '',
    status: '',
  });
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const start = new Date(appointment.startAt);
    setEditForm({
      staffId: appointment.staff.id,
      serviceId: appointment.service.id,
      date: toLocalDateString(start),
      time: toLocalTimeString(start),
      notes: appointment.notes || '',
      status: appointment.status,
    });
  }, [appointment]);

  useEffect(() => {
    if (!isEditing || !editForm.staffId || !editForm.serviceId || !editForm.date) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    api
      .get(`/businesses/${businessId}/slots`, {
        params: {
          staffId: editForm.staffId,
          serviceId: editForm.serviceId,
          date: editForm.date,
          excludeAppointmentId: appointment.id,
        },
      })
      .then((res) => setAvailableSlots(res.data.data || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [isEditing, editForm.staffId, editForm.serviceId, editForm.date, businessId, appointment.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.staffId || !editForm.serviceId || !editForm.date || !editForm.time) {
      alert('Personel, hizmet, tarih ve saat zorunludur.');
      return;
    }
    setIsSaving(true);
    try {
      const startAt = new Date(`${editForm.date}T${editForm.time}:00`);
      await api.put(`/businesses/${businessId}/appointments/${appointment.id}`, {
        staffId: editForm.staffId,
        serviceId: editForm.serviceId,
        startAt: startAt.toISOString(),
        notes: editForm.notes || undefined,
        status: editForm.status,
      });
      onUpdate();
      setIsEditing(false);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Randevu güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;
    onDelete(appointment.id);
    onClose();
  };

  const handleComplete = () => {
    onComplete(appointment);
    onClose();
  };

  const startDate = new Date(appointment.startAt);
  const endDate = new Date(appointment.endAt);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Randevu Detayı</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
                  <select
                    value={editForm.staffId}
                    onChange={(e) => setEditForm({ ...editForm, staffId: e.target.value, time: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet *</label>
                  <select
                    value={editForm.serviceId}
                    onChange={(e) => setEditForm({ ...editForm, serviceId: e.target.value, time: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.duration} dk)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value, time: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                  {loadingSlots ? (
                    <div className="py-2 text-sm text-gray-500">Müsait saatler yükleniyor...</div>
                  ) : availableSlots.length === 0 ? (
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, time: slot.start })}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            editForm.time === slot.start
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-primary-50'
                          }`}
                        >
                          {slot.start}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" isLoading={isSaving}>
                    Kaydet
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Müşteri:</span>
                    <p className="font-medium text-gray-900">{appointment.customer.fullName}</p>
                    <p className="text-gray-600">{appointment.customer.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Hizmet:</span>
                    <p className="font-medium text-gray-900">{appointment.service.name}</p>
                    <p className="text-gray-600">{appointment.service.duration} dk · {appointment.service.price} ₺</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Personel:</span>
                    <p className="font-medium text-gray-900">{appointment.staff.fullName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tarih & Saat:</span>
                    <p className="font-medium text-gray-900">
                      {startDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-gray-600">
                      {getTimeString(appointment.startAt)} - {getTimeString(appointment.endAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Durum:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {statusLabels[appointment.status] || appointment.status}
                    </span>
                  </div>
                  {appointment.notes && (
                    <div>
                      <span className="text-gray-500">Not:</span>
                      <p className="text-gray-700 mt-0.5">{appointment.notes}</p>
                    </div>
                  )}
                  {appointment.seriesId && (
                    <p className="text-violet-600 text-xs">🔄 Tekrarlayan randevu</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                    Düzenle
                  </Button>
                  {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                    <Button size="sm" onClick={handleComplete}>
                      Tamamla
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDelete}>
                    Sil
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onClose}>
                    Kapat
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
