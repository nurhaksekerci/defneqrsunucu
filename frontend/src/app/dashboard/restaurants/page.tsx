'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageHelper';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  logo?: string;
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
    if (!confirm('Bu restoranı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-14 h-14 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
        <p className="text-sm text-gray-500">Restoranlar yükleniyor...</p>
      </div>
    );
  }

  const canAddMoreRestaurants = restaurants.length < maxRestaurants;
  const usagePercent = maxRestaurants > 0 ? Math.min(100, (restaurants.length / maxRestaurants) * 100) : 0;
  const isNearLimit = usagePercent >= 80;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Restoranlarım</h1>
          <p className="text-gray-600 mt-1">
            İşletmelerinizi görüntüleyin ve yönetin
          </p>
        </div>
        {canAddMoreRestaurants && (
          <Button
            onClick={() => router.push('/dashboard/restaurant/create')}
            className="shadow-md hover:shadow-lg transition-shadow shrink-0"
          >
            + Yeni Restoran Ekle
          </Button>
        )}
      </div>

      {/* Usage indicator */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Plan Kullanımı</span>
          <span className={`text-sm font-semibold ${isNearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
            {restaurants.length} / {maxRestaurants} restoran
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isNearLimit ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'
            }`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {!canAddMoreRestaurants && restaurants.length > 0 && (
          <p className="text-xs text-amber-700 mt-2">
            Plan limitinize ulaştınız. Daha fazla restoran için planınızı yükseltin.
          </p>
        )}
      </div>

      {/* Content */}
      {restaurants.length === 0 ? (
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 mb-6">
              <span className="text-4xl">🏪</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Henüz restoran eklenmemiş
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              İlk restoranınızı oluşturarak QR menünüzü yayına alın. 5 dakikada hazır!
            </p>
            {canAddMoreRestaurants && (
              <Button
                onClick={() => router.push('/dashboard/restaurant/create')}
                size="lg"
                className="shadow-lg shadow-primary-200/50 hover:shadow-xl transition-shadow"
              >
                + Restoran Oluştur
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Card
              key={restaurant.id}
              className="group border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Card header with logo */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    {restaurant.logo ? (
                      <img
                        src={getImageUrl(restaurant.logo)!}
                        alt={restaurant.name}
                        className="w-16 h-16 rounded-xl object-cover ring-2 ring-white shadow-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-2xl flex-shrink-0">
                        🏪
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-0 truncate">{restaurant.name}</CardTitle>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">/{restaurant.slug}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col pt-0">
                  <div className="space-y-2 mb-4 flex-1">
                    {restaurant.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{restaurant.description}</p>
                    )}
                    {restaurant.address && (
                      <p className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-400 shrink-0">📍</span>
                        <span className="line-clamp-2">{restaurant.address}</span>
                      </p>
                    )}
                    {restaurant.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-gray-400">📞</span>
                        <a href={`tel:${restaurant.phone}`} className="hover:text-primary-600 transition-colors">
                          {restaurant.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <Link
                      href={`/${restaurant.slug}/menu`}
                      target="_blank"
                      className="block"
                    >
                      <Button size="sm" className="w-full group-hover:bg-primary-700 transition-colors">
                        Menüyü Görüntüle →
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/restaurant/${restaurant.id}/edit`)}
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-1"
                        onClick={() => handleDelete(restaurant.id)}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
