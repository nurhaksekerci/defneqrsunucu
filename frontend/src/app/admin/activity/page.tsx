'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

interface Activity {
  type: string;
  icon: string;
  label: string;
  sublabel?: string;
  date: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  device?: string | null;
}

const CATEGORIES = [
  { value: '', label: 'Tümü', icon: '📋' },
  { value: 'restaurant', label: 'Restoranlar', icon: '🏪' },
  { value: 'user', label: 'Kullanıcılar', icon: '👤' },
  { value: 'subscription', label: 'Abonelikler', icon: '💎' },
  { value: 'ticket', label: 'Destek Talepleri', icon: '🎫' },
  { value: 'scan', label: 'QR Taramalar', icon: '📱' },
  { value: 'referral', label: 'Referanslar', icon: '🔗' }
];

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const response = await api.get('/admin/dashboard?activityLimit=50');
      setActivities(response.data.data?.activities || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = filter
    ? activities.filter((a) => a.type === filter)
    : activities;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem Aktivitesi</h1>
        <p className="text-gray-600">Tüm sistem aktiviteleri</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Aktivite Akışı</CardTitle>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filter === cat.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">
              {filter ? 'Bu kategoride aktivite bulunamadı' : 'Henüz aktivite yok'}
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredActivities.map((a, i) => (
                <li key={i} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-2xl shrink-0">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{a.label}</p>
                    {a.sublabel && (
                      <p className="text-gray-500 text-sm mt-0.5">{a.sublabel}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span title="Saat">
                        🕐 {new Date(a.date).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                      {a.ipAddress && (
                        <span title="IP Adresi">🌐 {a.ipAddress}</span>
                      )}
                      {a.device && (
                        <span title="Cihaz / Tarayıcı">📱 {a.device}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
