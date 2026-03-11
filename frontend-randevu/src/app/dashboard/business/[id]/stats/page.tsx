'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface StatsData {
  total: number;
  byStatus: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
  monthlyData: { month: string; label: string; total: number; completed: number; cancelled: number }[];
  byDayOfWeek: { day: string; count: number }[];
  byHour: { hour: string; count: number }[];
  byService: { name: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
  NO_SHOW: 'Gelmedi',
  POSTPONED: 'Ertelendi',
};

export default function StatsPage() {
  const params = useParams();
  const businessId = params.id as string;
  const [businessName, setBusinessName] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    loadData();
  }, [businessId, months]);

  const loadData = async () => {
    try {
      const [bizRes, statsRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/stats`, { params: { months } }),
      ]);
      if (bizRes.data.success) setBusinessName(bizRes.data.data.name);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-600 font-medium">İstatistikler yüklenemedi</p>
        <Link href={`/dashboard/business/${businessId}`} className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
          ← İşletmeye dön
        </Link>
      </div>
    );
  }

  const maxMonthly = Math.max(...stats.monthlyData.map((m) => m.total), 1);
  const maxDay = Math.max(...stats.byDayOfWeek.map((d) => d.count), 1);
  const maxHour = Math.max(...stats.byHour.map((h) => h.count), 1);

  return (
    <div className="py-6">
      <Link
        href={`/dashboard/business/${businessId}`}
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {businessName || 'İşletme'} detayına dön
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">İstatistik Paneli</h1>
        <select
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value, 10))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value={3}>Son 3 ay</option>
          <option value={6}>Son 6 ay</option>
          <option value={12}>Son 12 ay</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Toplam Randevu</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Bu Ay</p>
            <p className="text-3xl font-bold text-primary-600">{stats.thisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Geçen Ay</p>
            <p className="text-3xl font-bold text-gray-700">{stats.lastMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Büyüme</p>
            <p className={`text-3xl font-bold ${stats.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.growthPercent >= 0 ? '+' : ''}{stats.growthPercent}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Aylık Randevu Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthlyData.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-gray-600">{m.label}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-lg transition-all"
                      style={{ width: `${(m.total / maxMonthly) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-sm font-medium text-right">{m.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{STATUS_LABELS[status] || status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Yoğun Günler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byDayOfWeek.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-12 text-sm text-gray-600">{d.day}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded transition-all"
                      style={{ width: `${(d.count / maxDay) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yoğun Saatler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byHour.map((h) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="w-14 text-sm text-gray-600">{h.hour}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded transition-all"
                      style={{ width: `${(h.count / maxHour) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-right">{h.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.byService.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hizmet Bazlı Randevular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byService.map((s) => (
                <div key={s.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
