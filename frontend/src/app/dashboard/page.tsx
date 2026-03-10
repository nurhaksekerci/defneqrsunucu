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

interface Plan {
  id: string;
  name: string;
  type: string;
  price?: number;
  maxRestaurants: number;
  maxCategories: number;
  maxProducts: number;
}

interface SubscriptionData {
  hasSubscription?: boolean;
  plan?: Plan;
  usage?: { restaurants: number; categories: number; products: number };
  limits?: { restaurants: number; categories: number; products: number };
  subscription?: { daysRemaining: number };
}

const quickActions = [
  { href: '/dashboard/restaurants', icon: '🏪', label: 'Restoranlarım', desc: 'İşletmelerinizi yönetin', color: 'from-amber-500 to-orange-500' },
  { href: '/dashboard/menu', icon: '📋', label: 'Menü Yönetimi', desc: 'Kategori, ürün ve menü düzenleme', color: 'from-emerald-500 to-teal-500' },
  { href: '/dashboard/menu-settings', icon: '🎨', label: 'Menü Özelleştirme', desc: 'Renk ve görünüm', color: 'from-violet-500 to-purple-500' },
  { href: '/dashboard/reports', icon: '📊', label: 'QR İstatistikleri', desc: 'Menü tarama verileri', color: 'from-blue-500 to-indigo-500' },
  { href: '/dashboard/support', icon: '🎫', label: 'Destek', desc: 'Yardım alın', color: 'from-slate-500 to-gray-600' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string } | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    loadUser();
    loadRestaurants();
    loadSubscription();
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data.data || []);
    } catch {
      setPlans([]);
    }
  };

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

  const copyMenuUrl = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(getMenuUrl(slug));
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  const getUsagePercent = (used: number, limit: number) => Math.min(100, Math.round((used / limit) * 100));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
        </div>
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 mb-6">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hoş Geldiniz!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Dijital menünüzü oluşturmak için ilk restoranınızı ekleyin. QR menünüz 5 dakikada hazır.
          </p>
          <Button
            onClick={() => router.push('/dashboard/restaurant/create')}
            size="lg"
            className="shadow-lg shadow-primary-200/50 hover:shadow-xl hover:shadow-primary-300/50 transition-shadow"
          >
            + Restoran Oluştur
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative">
          <p className="text-primary-100 text-sm font-medium mb-1">{getGreeting()}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {user?.fullName?.split(' ')[0] || 'Kullanıcı'}
          </h1>
          <p className="text-primary-100 mt-2 text-sm sm:text-base">
            Dijital menünüzü buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex flex-col items-center p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white text-xl shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <span className="relative font-semibold text-gray-900 text-sm text-center leading-tight">
                {action.label}
              </span>
              <span className="relative text-xs text-gray-500 mt-1 text-center hidden sm:block">
                {action.desc}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* İşletme Kartı */}
        <div className="lg:col-span-1">
          <Card className="h-full border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">İşletme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {restaurants.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Restoran Seçin</label>
                  <select
                    value={selectedRestaurant?.id || ''}
                    onChange={(e) => {
                      const r = restaurants.find((x) => x.id === e.target.value);
                      setSelectedRestaurant(r || null);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedRestaurant && (
                <>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    {selectedRestaurant.logo ? (
                      <img
                        src={getImageUrl(selectedRestaurant.logo)!}
                        alt={selectedRestaurant.name}
                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-2xl shadow-inner">
                        🏪
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{selectedRestaurant.name}</p>
                      <p className="text-xs text-gray-500 font-mono">/{selectedRestaurant.slug}</p>
                    </div>
                  </div>

                  {(selectedRestaurant.address || selectedRestaurant.phone) && (
                    <div className="space-y-2">
                      {selectedRestaurant.address && (
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 shrink-0">📍</span>
                          <span className="break-words">{selectedRestaurant.address}</span>
                        </p>
                      )}
                      {selectedRestaurant.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400">📞</span>
                          <a href={`tel:${selectedRestaurant.phone}`} className="text-primary-600 hover:text-primary-700 hover:underline">
                            {selectedRestaurant.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">QR Menü Linki</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={getMenuUrl(selectedRestaurant.slug)}
                          className="flex-1 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 truncate"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => copyMenuUrl(selectedRestaurant.slug)}
                          className="shrink-0"
                        >
                          {copiedUrl ? '✓ Kopyalandı' : 'Kopyala'}
                        </Button>
                      </div>
                    </div>
                    <Link href={`/${selectedRestaurant.slug}/menu`} target="_blank" className="block">
                      <Button variant="secondary" size="sm" className="w-full">
                        Menüyü Görüntüle →
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon: Defne Qr + Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Defne Qr Bilgi Kartı */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-gray-50 to-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  D
                </div>
                <div>
                  <CardTitle className="text-base mb-0">Defne Qr</CardTitle>
                  <p className="text-xs text-gray-500">QR Menü & Dijital Menü Sistemi</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                İşletmenizi dijitalleştirin. Menünüz 5 dakikada hazır, müşterileriniz QR kod ile anında erişsin.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:destek@defneqr.com"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  <span>✉️</span> destek@defneqr.com
                </a>
                <a
                  href="https://defneqr.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  defneqr.com
                </a>
              </div>
            </div>
          </Card>

          {/* Plan & Abonelik */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Plan & Abonelik</CardTitle>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">
                  {subscription?.plan?.name || 'Yükleniyor...'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {subscription?.usage && subscription?.limits && (
                <div className="space-y-4">
                  {[
                    { key: 'restaurants', label: 'İşletme', used: subscription.usage.restaurants, limit: subscription.limits.restaurants },
                    { key: 'categories', label: 'Kategori', used: subscription.usage.categories, limit: subscription.limits.categories },
                    { key: 'products', label: 'Ürün', used: subscription.usage.products, limit: subscription.limits.products },
                  ].map(({ key, label, used, limit }) => {
                    const percent = getUsagePercent(used, limit);
                    const isNearLimit = percent >= 80;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-600">{label}</span>
                          <span className={`font-medium ${isNearLimit ? 'text-amber-600' : 'text-gray-900'}`}>
                            {used} / {limit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isNearLimit ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {subscription?.subscription?.daysRemaining !== undefined && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Abonelik süresi</p>
                    <p className="text-xs text-gray-500">{subscription.subscription.daysRemaining} gün kaldı</p>
                  </div>
                </div>
              )}
              {subscription?.plan?.type === 'FREE' && plans.find((p) => p.type === 'PREMIUM') && (
                <Link href={`/subscription/checkout?planId=${plans.find((p) => p.type === 'PREMIUM')!.id}`}>
                  <Button size="sm" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
                    Premium&apos;a Yükselt
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
