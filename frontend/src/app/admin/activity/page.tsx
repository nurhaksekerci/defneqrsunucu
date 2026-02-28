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
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem Aktivitesi</h1>
        <p className="text-gray-600">Tüm sistem aktiviteleri</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktivite Akışı</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">Henüz aktivite yok</p>
          ) : (
            <ul className="space-y-4">
              {activities.map((a, i) => (
                <li key={i} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-2xl shrink-0">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{a.label}</p>
                    {a.sublabel && (
                      <p className="text-gray-500 text-sm mt-0.5">{a.sublabel}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(a.date).toLocaleString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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
