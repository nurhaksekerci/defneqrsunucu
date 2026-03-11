'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

interface Business {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  _count?: { staff: number; services: number; customers: number };
}

const quickActions = [
  { href: '/dashboard', icon: '🏪', label: 'İşletmelerim', desc: 'İşletmelerinizi yönetin', color: 'from-amber-500 to-orange-500' },
  { href: '/dashboard', icon: '👥', label: 'Personel', desc: 'Personel yönetimi', color: 'from-emerald-500 to-teal-500' },
  { href: '/dashboard', icon: '✂️', label: 'Hizmetler', desc: 'Hizmet tanımları', color: 'from-violet-500 to-purple-500' },
  { href: '/dashboard', icon: '📅', label: 'Takvim', desc: 'Randevu takvimi', color: 'from-blue-500 to-indigo-500' },
  { href: '/dashboard/support', icon: '🎫', label: 'Destek', desc: 'Yardım alın', color: 'from-slate-500 to-gray-600' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string } | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadBusinesses();
  }, []);

  const loadUser = async () => {
    try {
      const u = await authService.getCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  const loadBusinesses = async () => {
    try {
      const res = await api.get('/businesses/my');
      const list: Business[] = res.data.data || [];
      setBusinesses(list);
      if (list.length > 0 && !selectedBusiness) setSelectedBusiness(list[0]);
    } catch {
      setBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

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

  if (businesses.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 mb-6">
            <span className="text-4xl">📅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hoş Geldiniz!</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Randevu sisteminizi kullanmaya başlamak için ilk işletmenizi ekleyin.
          </p>
          <Button
            onClick={() => router.push('/dashboard/business/create')}
            size="lg"
            className="shadow-lg shadow-primary-200/50 hover:shadow-xl hover:shadow-primary-300/50 transition-shadow"
          >
            + İşletme Oluştur
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
            Randevu sisteminizi buradan yönetebilirsiniz.
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
              target={action.href.startsWith('http') ? '_blank' : undefined}
              rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
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
              {businesses.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">İşletme Seçin</label>
                  <select
                    value={selectedBusiness?.id || ''}
                    onChange={(e) => {
                      const b = businesses.find((x) => x.id === e.target.value);
                      setSelectedBusiness(b || null);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedBusiness && (
                <>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-2xl shadow-inner">
                      📅
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{selectedBusiness.name}</p>
                      <p className="text-xs text-gray-500 font-mono">/{selectedBusiness.slug}</p>
                    </div>
                  </div>

                  {(selectedBusiness.address || selectedBusiness.phone) && (
                    <div className="space-y-2">
                      {selectedBusiness.address && (
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400 shrink-0">📍</span>
                          <span className="break-words">{selectedBusiness.address}</span>
                        </p>
                      )}
                      {selectedBusiness.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400">📞</span>
                          <a href={`tel:${selectedBusiness.phone}`} className="text-primary-600 hover:text-primary-700 hover:underline">
                            {selectedBusiness.phone}
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span>{selectedBusiness._count?.staff ?? 0} personel</span>
                      <span>·</span>
                      <span>{selectedBusiness._count?.services ?? 0} hizmet</span>
                      <span>·</span>
                      <span>{selectedBusiness._count?.customers ?? 0} müşteri</span>
                    </div>
                    <Link href={`/dashboard/business/${selectedBusiness.id}`}>
                      <Button variant="secondary" size="sm" className="w-full">
                        İşletmeyi Görüntüle →
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-gray-50 to-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  D
                </div>
                <div>
                  <CardTitle className="text-base mb-0">DefneRandevu</CardTitle>
                  <p className="text-xs text-gray-500">Randevu Yönetim Sistemi</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Kuaför, berber, klinik ve daha fazlası için randevu yönetimi. Personel, hizmet ve takvim ile randevularınızı kolayca organize edin.
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

          {/* İşletme Listesi */}
          <Card className="border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">İşletmelerim</CardTitle>
                <div className="flex items-center gap-2">
                  <Link href="/dashboard/business/create">
                    <Button size="sm">+ Yeni</Button>
                  </Link>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">
                    {businesses.length} işletme
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {businesses.map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/business/${b.id}`}
                    className="block p-4 rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
                  >
                    <p className="font-semibold text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {b._count?.staff ?? 0} personel · {b._count?.services ?? 0} hizmet · {b._count?.customers ?? 0} müşteri
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
