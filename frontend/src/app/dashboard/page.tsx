'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { authService } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageHelper';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://defneqr.com';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  logo?: string;
}

interface SubscriptionData {
  hasSubscription?: boolean;
  plan?: { name: string; type: string };
  subscription?: { daysRemaining: number };
}

const quickActions = [
  { href: '/dashboard/restaurants', icon: '🏪', label: 'Restoranlarım', desc: 'İşletmelerinizi yönetin' },
  { href: '/dashboard/menu', icon: '📋', label: 'Menü Yönetimi', desc: 'QR menünüzü düzenleyin' },
  { href: '/dashboard/categories', icon: '📁', label: 'Kategoriler', desc: 'Menü kategorileri' },
  { href: '/dashboard/products', icon: '🍽️', label: 'Ürünler', desc: 'Ürün ekle ve düzenle' },
  { href: '/dashboard/menu-settings', icon: '🎨', label: 'Menü Özelleştirme', desc: 'Renk ve görünüm' },
  { href: '/dashboard/reports', icon: '📊', label: 'QR Tarama İstatistikleri', desc: 'Menü tarama verileri' },
  { href: '/dashboard/subscription', icon: '💎', label: 'Plan & Abonelik', desc: 'Planınızı yönetin' },
  { href: '/dashboard/support', icon: '🎫', label: 'Destek', desc: 'Yardım alın' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadRestaurants();
    loadSubscription();
  }, []);

  const loadUser = async () => {
    try {
      const u = await authService.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  const loadRestaurants = async () => {
    try {
      const res = await api.get('/restaurants/my');
      const list: Restaurant[] = res.data.data || [];
      setRestaurants(list);
      if (list.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(list[0]);
      }
    } catch {
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/my');
      setSubscription(res.data.data);
    } catch {
      setSubscription(null);
    }
  };

  const getMenuUrl = (slug: string) => `${siteUrl}/${slug}/menu`;
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hoş Geldiniz!</h1>
          <p className="text-gray-600 mb-8">
            Başlamak için ilk restoranınızı oluşturun. QR menünüz 5 dakikada hazır.
          </p>
          <Button onClick={() => router.push('/dashboard/restaurant/create')} size="lg">
            + Restoran Oluştur
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Kullanıcı'} 👋
        </h1>
        <p className="text-gray-600 mt-1">Dijital menünüzü buradan yönetebilirsiniz.</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center p-4 sm:p-5 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-200"
            >
              <span className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="font-medium text-gray-900 text-sm sm:text-base text-center">
                {action.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5 hidden sm:block">{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* İşletme Bilgileri */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">İşletme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {restaurants.length > 1 && (
                <select
                  value={selectedRestaurant?.id || ''}
                  onChange={(e) => {
                    const r = restaurants.find((x) => x.id === e.target.value);
                    setSelectedRestaurant(r || null);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}

              {selectedRestaurant && (
                <>
                  <div className="flex items-center gap-3">
                    {selectedRestaurant.logo ? (
                      <img
                        src={getImageUrl(selectedRestaurant.logo)!}
                        alt={selectedRestaurant.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary-100 flex items-center justify-center text-2xl">
                        🏪
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{selectedRestaurant.name}</p>
                      <p className="text-xs text-gray-500">/{selectedRestaurant.slug}</p>
                    </div>
                  </div>

                  {selectedRestaurant.address && (
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <span>📍</span>
                      <span>{selectedRestaurant.address}</span>
                    </p>
                  )}
                  {selectedRestaurant.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span>📞</span>
                      <a href={`tel:${selectedRestaurant.phone}`} className="hover:text-primary-600">
                        {selectedRestaurant.phone}
                      </a>
                    </p>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">QR Menü Linki</p>
                    <a
                      href={getMenuUrl(selectedRestaurant.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline break-all"
                    >
                      {getMenuUrl(selectedRestaurant.slug)}
                    </a>
                    <Link href={`/${selectedRestaurant.slug}/menu`} target="_blank" className="block mt-2">
                      <Button variant="secondary" size="sm" className="w-full">
                        Menüyü Aç
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Defne Qr Bilgisi */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100 h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>🔷</span> Defne Qr
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                QR Menü ve Dijital Menü Sistemi. İşletmenizi dijitalleştirin, 5 dakikada hazır.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href="mailto:destek@defneqr.com"
                  className="text-primary-600 hover:underline flex items-center gap-1"
                >
                  ✉️ destek@defneqr.com
                </a>
                <a
                  href="https://defneqr.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  defneqr.com
                </a>
              </div>
              {subscription?.hasSubscription && subscription?.subscription?.daysRemaining !== undefined && (
                <p className="text-xs text-gray-500 pt-2 border-t border-primary-100">
                  Abonelik: {subscription.subscription.daysRemaining} gün kaldı
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
