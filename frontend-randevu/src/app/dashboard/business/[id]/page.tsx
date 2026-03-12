'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Staff {
  id: string;
  fullName: string;
  phone?: string | null;
  specialty?: string | null;
  color?: string | null;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string | null;
}

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  staff: Staff[];
  services: Service[];
  _count?: { customers?: number };
}

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = params.id as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const [staffForm, setStaffForm] = useState({ fullName: '', phone: '', specialty: '' });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  const [serviceForm, setServiceForm] = useState({ name: '', duration: 30, price: 0 });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, [businessId]);

  const loadBusiness = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}`);
      if (res.data.success) setBusiness(res.data.data);
    } catch {
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.fullName.trim()) return;
    setIsSavingStaff(true);
    try {
      await api.post(`/businesses/${businessId}/staff`, staffForm);
      setStaffForm({ fullName: '', phone: '', specialty: '' });
      loadBusiness();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Personel eklenemedi.');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleEditStaff = (s: Staff) => {
    setEditingStaffId(s.id);
    setStaffForm({ fullName: s.fullName, phone: s.phone || '', specialty: s.specialty || '' });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffId || !staffForm.fullName.trim()) return;
    setIsSavingStaff(true);
    try {
      await api.put(`/businesses/${businessId}/staff/${editingStaffId}`, staffForm);
      setEditingStaffId(null);
      setStaffForm({ fullName: '', phone: '', specialty: '' });
      loadBusiness();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Personel güncellenemedi.');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/staff/${staffId}`);
      if (editingStaffId === staffId) setEditingStaffId(null);
      loadBusiness();
    } catch {
      alert('Personel silinemedi.');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;
    setIsSavingService(true);
    try {
      await api.post(`/businesses/${businessId}/services`, serviceForm);
      setServiceForm({ name: '', duration: 30, price: 0 });
      loadBusiness();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Hizmet eklenemedi.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleEditService = (s: Service) => {
    setEditingServiceId(s.id);
    setServiceForm({ name: s.name, duration: s.duration, price: Number(s.price) });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId || !serviceForm.name.trim()) return;
    setIsSavingService(true);
    try {
      await api.put(`/businesses/${businessId}/services/${editingServiceId}`, serviceForm);
      setEditingServiceId(null);
      setServiceForm({ name: '', duration: 30, price: 0 });
      loadBusiness();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Hizmet güncellenemedi.');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Bu hizmeti silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/services/${serviceId}`);
      if (editingServiceId === serviceId) setEditingServiceId(null);
      loadBusiness();
    } catch {
      alert('Hizmet silinemedi.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">İşletme bulunamadı</p>
        <Link href="/dashboard" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
          ← İşletmelere dön
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        İşletmelere dön
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        <div className="flex gap-2">
          <a
            href={`/b/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            🔗 Online Randevu Linki
          </a>
          <Link href={`/dashboard/business/${businessId}/calendar`}>
            <Button variant="secondary" size="sm">
              📅 Takvim
            </Button>
          </Link>
          <Link href={`/dashboard/business/${businessId}/stats`}>
            <Button variant="secondary" size="sm">
              📈 İstatistik
            </Button>
          </Link>
          <Link href={`/dashboard/business/${businessId}/finance`}>
            <Button variant="secondary" size="sm">
              💰 Gelir/Gider
            </Button>
          </Link>
          <Link href={`/dashboard/business/${businessId}/packages`}>
            <Button variant="secondary" size="sm">
              📦 Paketler
            </Button>
          </Link>
          <Link href={`/dashboard/business/${businessId}/products`}>
            <Button variant="secondary" size="sm">
              🛒 Ürünler
            </Button>
          </Link>
          <Link href={`/dashboard/business/${businessId}/customers`}>
            <Button variant="secondary" size="sm">
              👥 Müşteriler
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Personel ({business.staff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={editingStaffId ? handleUpdateStaff : handleAddStaff} className="flex flex-wrap gap-2">
              <Input
                placeholder="Ad Soyad"
                value={staffForm.fullName}
                onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                className="flex-1 min-w-[120px]"
              />
              <Input
                placeholder="Telefon"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-32"
              />
              <Input
                placeholder="Uzmanlık"
                value={staffForm.specialty}
                onChange={(e) => setStaffForm({ ...staffForm, specialty: e.target.value })}
                className="w-28"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={isSavingStaff} disabled={!staffForm.fullName.trim()}>
                  {editingStaffId ? 'Güncelle' : 'Ekle'}
                </Button>
                {editingStaffId && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingStaffId(null); setStaffForm({ fullName: '', phone: '', specialty: '' }); }}>
                    İptal
                  </Button>
                )}
              </div>
            </form>
            {business.staff.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Henüz personel eklenmemiş. Yukarıdan ekleyin.</p>
            ) : (
              <ul className="space-y-2">
                {business.staff.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="font-medium text-gray-900">{s.fullName}</span>
                      {s.specialty && <span className="text-sm text-gray-500 ml-2">({s.specialty})</span>}
                      {s.phone && <span className="block text-xs text-gray-500">{s.phone}</span>}
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleEditStaff(s)} className="text-sm text-primary-600 hover:text-primary-700">Düzenle</button>
                      <button type="button" onClick={() => handleDeleteStaff(s.id)} className="text-sm text-red-600 hover:text-red-700">Sil</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">✂️</span>
              Hizmetler ({business.services.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={editingServiceId ? handleUpdateService : handleAddService} className="flex flex-wrap gap-2">
              <Input
                placeholder="Hizmet adı"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="flex-1 min-w-[120px]"
              />
              <input
                type="number"
                placeholder="Dk"
                min={1}
                value={serviceForm.duration || ''}
                onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value, 10) || 30 })}
                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="₺"
                min={0}
                step={0.01}
                value={serviceForm.price || ''}
                onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" isLoading={isSavingService} disabled={!serviceForm.name.trim()}>
                  {editingServiceId ? 'Güncelle' : 'Ekle'}
                </Button>
                {editingServiceId && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingServiceId(null); setServiceForm({ name: '', duration: 30, price: 0 }); }}>
                    İptal
                  </Button>
                )}
              </div>
            </form>
            {business.services.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Henüz hizmet eklenmemiş. Yukarıdan ekleyin.</p>
            ) : (
              <ul className="space-y-2">
                {business.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-900">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {s.duration} dk · ₺{Number(s.price).toLocaleString('tr-TR')}
                      </span>
                      <button type="button" onClick={() => handleEditService(s)} className="text-sm text-primary-600 hover:text-primary-700">Düzenle</button>
                      <button type="button" onClick={() => handleDeleteService(s.id)} className="text-sm text-red-600 hover:text-red-700">Sil</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            Randevu Hatırlatıcı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            Müşterilerinize randevu öncesi otomatik SMS ve e-posta hatırlatması gönderilir:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>24 saat önce</li>
            <li>1 saat önce</li>
          </ul>
          {business.address && (
            <p className="text-sm text-gray-500 mt-2">
              Konum bilginiz (adres + harita linki) hatırlatma mesajlarına dahil edilir.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
