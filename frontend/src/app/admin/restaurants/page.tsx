'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  owner: {
    fullName: string;
    email: string;
  };
  createdAt: string;
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants');
      setRestaurants(response.data.data || []);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
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

      <div className="mb-6">
        <input
          type="text"
          placeholder="Restoran veya sahip ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
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
                    <th className="text-left py-3 px-4 font-medium text-gray-700">İletişim</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Oluşturulma</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">İşlemler</th>
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
                      <td className="py-3 px-4 text-sm">
                        {restaurant.address && <p>{restaurant.address}</p>}
                        {restaurant.phone && <p>{restaurant.phone}</p>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(restaurant.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
