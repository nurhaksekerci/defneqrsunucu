'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Staff {
  id: string;
  fullName: string;
  specialty?: string | null;
  color?: string | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  logo?: string | null;
  staff: Staff[];
  services: Service[];
}

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    serviceId: '',
    staffId: '',
    date: '',
    time: '09:00',
    fullName: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/businesses/slug/${slug}`);
        if (res.data.success) setBusiness(res.data.data);
        else setError('İşletme bulunamadı');
      } catch {
        setError('İşletme bulunamadı');
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId || !form.staffId || !form.date || !form.time || !form.fullName.trim() || !form.phone.trim()) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setSubmitting(true);
    try {
      const startAt = new Date(`${form.date}T${form.time}:00`);
      await api.post(`/businesses/slug/${slug}/book`, {
        staffId: form.staffId,
        serviceId: form.serviceId,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        startAt: startAt.toISOString(),
        notes: form.notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Randevunuz Alındı!</h1>
          <p className="text-gray-600 mb-6">
            {business.name} ile randevunuz başarıyla oluşturuldu. Randevu hatırlatması için size kısa süre içinde bilgi verilecektir.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (business.staff.length === 0 || business.services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{business.name}</h1>
          <p className="text-gray-600">Bu işletme şu anda online randevu almıyor.</p>
          <Link href="/" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            {business.description && (
              <p className="text-gray-600 text-sm mt-1">{business.description}</p>
            )}
            {business.address && (
              <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                <span>📍</span> {business.address}
              </p>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="text-primary-600 text-sm mt-1 block">
                📞 {business.phone}
              </a>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet *</label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seçin</option>
                {business.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.duration} dk · ₺{Number(s.price).toLocaleString('tr-TR')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
              <select
                value={form.staffId}
                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seçin</option>
                {business.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                    {s.specialty ? ` (${s.specialty})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
                <input
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Adınız"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="05XX XXX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ornek@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Varsa eklemek istediğiniz not..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {submitting ? 'Randevu oluşturuluyor...' : 'Randevu Oluştur'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            DefneRandevu
          </Link>{' '}
          ile güvenli randevu
        </p>
      </div>
    </div>
  );
}
