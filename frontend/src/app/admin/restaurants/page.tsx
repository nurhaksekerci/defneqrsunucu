'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  subscription?: {
    id: string;
    startDate: string;
    endDate: string;
    plan: { name: string; type: string };
  } | null;
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [extendModal, setExtendModal] = useState<{ open: boolean; restaurantId?: string }>({ open: false });
  const [extendDays, setExtendDays] = useState('30');
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    loadRestaurants();
    authService.getCurrentUser().then((u) => setIsAdmin(u.role === 'ADMIN')).catch(() => setIsAdmin(false));
  }, []);

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants?limit=100');
      setRestaurants(response.data.data || []);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtend = async () => {
    const days = parseInt(extendDays, 10);
    if (!days || days < 1 || days > 365) {
      alert('1-365 arası gün girin');
      return;
    }
    try {
      setIsExtending(true);
      await api.post('/subscriptions/extend', {
        days,
        ...(extendModal.restaurantId && { restaurantId: extendModal.restaurantId })
      });
      setExtendModal({ open: false });
      setExtendDays('30');
      loadRestaurants();
      alert('Süre başarıyla eklendi');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Süre eklenemedi');
    } finally {
      setIsExtending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu restoranı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/restaurants/${id}`);
      loadRestaurants();
    } catch (error) {
      console.error('Failed to delete restaurant:', error);
      alert('Restoran silinemedi. Lütfen tekrar deneyin.');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.owner.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restoran Yönetimi</h1>
        <p className="text-gray-600">Sistemdeki tüm restoranları görüntüleyin</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Restoran veya sahip ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        {isAdmin && (
          <Button
            onClick={() => setExtendModal({ open: true })}
            variant="secondary"
          >
            Tüm restoranlara süre ekle
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restoranlar ({filteredRestaurants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Restoran bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Restoran</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Sahip</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Başlangıç</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bitiş</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">İletişim</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Oluşturulma</th>
                    {isAdmin && (
                      <th className="text-right py-3 px-4 font-medium text-gray-700">İşlemler</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{restaurant.name}</p>
                          {restaurant.description && (
                            <p className="text-sm text-gray-600">{restaurant.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">/{restaurant.slug}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{restaurant.owner.fullName}</p>
                          <p className="text-sm text-gray-600">{restaurant.owner.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {restaurant.subscription ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {restaurant.subscription.plan.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {restaurant.subscription ? formatDate(restaurant.subscription.startDate) : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {restaurant.subscription ? formatDate(restaurant.subscription.endDate) : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {restaurant.address && <p>{restaurant.address}</p>}
                        {restaurant.phone && <p>{restaurant.phone}</p>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(restaurant.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button
                              onClick={() => {
                                setExtendModal({ open: true, restaurantId: restaurant.id });
                                setExtendDays('30');
                              }}
                              className="px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium"
                            >
                              Süre ekle
                            </button>
                            <button
                              onClick={() => window.open(`/${restaurant.slug}/menu`, '_blank')}
                              className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              Görüntüle
                            </button>
                            <button
                              onClick={() => handleDelete(restaurant.id)}
                              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Modal
          isOpen={extendModal.open}
          onClose={() => setExtendModal({ open: false })}
          title={extendModal.restaurantId ? 'Bu restorana süre ekle' : 'Tüm restoranlara süre ekle'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eklenecek gün sayısı</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">1-365 arası gün girin</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleExtend} disabled={isExtending}>
                {isExtending ? 'İşleniyor...' : 'Ekle'}
              </Button>
              <Button variant="secondary" onClick={() => setExtendModal({ open: false })}>
                İptal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
