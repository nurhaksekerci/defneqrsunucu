'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  createdAt: string;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [maxRestaurants, setMaxRestaurants] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadRestaurants();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/subscriptions/my');
      const data = response.data.data;
      setMaxRestaurants(data?.limits?.restaurants ?? data?.plan?.maxRestaurants ?? 1);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setMaxRestaurants(1);
    }
  };

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/my');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const canAddMoreRestaurants = restaurants.length < maxRestaurants;

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restoranlarım</h1>
          <p className="text-gray-600">
            Restoranlarınızı görüntüleyin ve yönetin 
            <span className="text-sm ml-2">
              ({restaurants.length}/{maxRestaurants} restoran)
            </span>
          </p>
        </div>
        {canAddMoreRestaurants && (
          <Button onClick={() => router.push('/dashboard/restaurant/create')}>
            + Yeni Restoran Ekle
          </Button>
        )}
      </div>

      {!canAddMoreRestaurants && restaurants.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Plan limitinize ulaştınız ({maxRestaurants} restoran). 
            Daha fazla restoran eklemek için planınızı yükseltin.
          </p>
        </div>
      )}

      {restaurants.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Henüz restoran eklememişsiniz
              </h2>
              <p className="text-gray-600 mb-6">
                İlk restoranınızı oluşturarak başlayın
              </p>
              {canAddMoreRestaurants && (
                <Button onClick={() => router.push('/dashboard/restaurant/create')}>
                  Restoran Oluştur
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader>
                <CardTitle>{restaurant.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {restaurant.description && (
                    <p className="text-sm text-gray-600">{restaurant.description}</p>
                  )}
                  {restaurant.address && (
                    <p className="text-sm text-gray-500">📍 {restaurant.address}</p>
                  )}
                  {restaurant.phone && (
                    <p className="text-sm text-gray-500">📞 {restaurant.phone}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Slug: {restaurant.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(`/${restaurant.slug}/menu`, '_blank')}
                  >
                    Menüyü Gör
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/restaurant/${restaurant.id}/edit`)}
                  >
                    Düzenle
                  </Button>
                  <button
                    onClick={() => handleDelete(restaurant.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Sil
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
