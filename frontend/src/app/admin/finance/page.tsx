'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface PromoUsage {
  promoCode: { code: string; type: string; discountValue: number };
  discountAmount: number;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  amount: number;
  paymentDate: string | null;
  customRestaurantCount: number | null;
  createdAt: string;
  plan: { id: string; name: string; type: string; price: number };
  user: { id: string; fullName: string; email: string };
  promoCodeUsages?: PromoUsage[];
  isUpgraded?: boolean;
}

interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  activeSubscriptions: number;
  todaySubscriptions: number;
  monthSubscriptions: number;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  EXPIRED: 'Süresi Dolmuş',
  CANCELLED: 'İptal'
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
};

export default function AdminFinancePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [page, filters]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/subscriptions/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setIsLoadingList(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      if (filters.status) params.set('status', filters.status);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await api.get(`/subscriptions/all?${params}`);
      setSubscriptions(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const applyFilters = () => {
    setPage(1);
    loadSubscriptions();
  };

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '' });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">💰 Finans</h1>
        <p className="text-gray-600 mt-2">Abonelik gelirleri ve finansal özet</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-500">Toplam Gelir</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {isLoading ? '...' : stats ? formatCurrency(stats.totalRevenue) : '0 ₺'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-500">Bugünkü Gelir</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {isLoading ? '...' : stats ? formatCurrency(stats.todayRevenue) : '0 ₺'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-500">Bu Ay Gelir</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {isLoading ? '...' : stats ? formatCurrency(stats.monthRevenue) : '0 ₺'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-500">Aktif Abonelik</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {isLoading ? '...' : stats?.activeSubscriptions ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-500">Bugün Yeni</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {isLoading ? '...' : stats?.todaySubscriptions ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="py-3">
              <p className="text-sm text-gray-500">Bu Ay Yeni</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {isLoading ? '...' : stats?.monthSubscriptions ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Abonelik Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Durum</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              >
                <option value="">Tümü</option>
                <option value="ACTIVE">Aktif</option>
                <option value="EXPIRED">Süresi Dolmuş</option>
                <option value="CANCELLED">İptal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Başlangıç</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bitiş</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-40"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={applyFilters}>
                Filtrele
              </Button>
              <Button size="sm" variant="secondary" onClick={clearFilters}>
                Temizle
              </Button>
            </div>
          </div>

          {isLoadingList ? (
            <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Filtre kriterlerine uygun abonelik bulunamadı
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tutar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Promosyon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Başlangıç
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Bitiş
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{sub.user.fullName}</p>
                            <p className="text-xs text-gray-500">{sub.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {sub.plan.name}
                          </span>
                          {sub.customRestaurantCount && sub.customRestaurantCount > 1 && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({sub.customRestaurantCount} işletme)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatCurrency(sub.amount)}
                        </td>
                        <td className="px-6 py-4">
                          {sub.promoCodeUsages && sub.promoCodeUsages.length > 0 ? (
                            <div className="space-y-1">
                              {sub.promoCodeUsages.map((u, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <code className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                                    {u.promoCode.code}
                                  </code>
                                  <span className="text-xs text-gray-500">
                                    ({u.promoCode.type === 'PERCENTAGE'
                                      ? `%${u.promoCode.discountValue}`
                                      : u.promoCode.type === 'FIXED'
                                      ? `-${formatCurrency(u.discountAmount)}`
                                      : `${u.promoCode.discountValue} gün`})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(sub.startDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(sub.endDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sub.isUpgraded
                                ? 'bg-blue-100 text-blue-800'
                                : STATUS_COLORS[sub.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sub.isUpgraded ? 'Yükseltme' : STATUS_LABELS[sub.status] || sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Önceki
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
