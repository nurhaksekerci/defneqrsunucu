'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ticketService, CATEGORY_LABELS, PRIORITY_LABELS, type TicketCategory, type TicketPriority } from '@/lib/ticketService';
import api from '@/lib/api';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

export default function CreateTicketPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('GENERAL');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [restaurantId, setRestaurantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const res = await api.get('/restaurants/my');
      setRestaurants(res.data.data || []);
    } catch {
      setRestaurants([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subject.trim() || !description.trim()) {
      setError('Konu ve açıklama zorunludur.');
      return;
    }
    if (description.length < 10) {
      setError('Açıklama en az 10 karakter olmalıdır.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ticketService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        restaurantId: restaurantId || undefined,
      });
      router.push(`/dashboard/support/${res.data.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Talep oluşturulamadı.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Geri
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Destek Talebi</h1>
      <p className="text-gray-600 mb-8">Sorununuzu veya talebinizi detaylı şekilde açıklayın.</p>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Konu *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Örn: QR menü yüklenmiyor"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sorununuzu veya talebinizi detaylı açıklayın..."
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={5000}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/5000 karakter</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {restaurants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlgili Restoran (opsiyonel)</label>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Seçiniz</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                Talep Oluştur
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
