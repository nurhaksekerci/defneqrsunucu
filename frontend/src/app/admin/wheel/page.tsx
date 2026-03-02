'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface WheelSegment {
  label: string;
  type: string;
  value: number | string;
  color: string;
}

interface WheelSettings {
  id: string;
  isEnabled: boolean;
  title: string;
  description: string | null;
  segments: WheelSegment[];
}

const SEGMENT_TYPES = [
  { value: 'subscription_days', label: 'Premium Gün' },
  { value: 'message', label: 'Mesaj' },
  { value: 'discount_percent', label: 'İndirim %' }
];

export default function AdminWheelPage() {
  const [settings, setSettings] = useState<WheelSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    isEnabled: true,
    title: 'Şansını Dene!',
    description: 'Günde 1 kez çevir, Premium deneme süresi kazan!',
    segments: [] as WheelSegment[]
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/wheel/settings');
      const data = res.data.data;
      setSettings(data);
      setFormData({
        isEnabled: data.isEnabled,
        title: data.title,
        description: data.description || '',
        segments: Array.isArray(data.segments) ? [...data.segments] : []
      });
    } catch (error) {
      console.error('Failed to load wheel settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/wheel/settings', {
        ...formData,
        description: formData.description || null
      });
      alert('Çark ayarları kaydedildi');
      loadSettings();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Kaydetme başarısız');
    } finally {
      setIsSaving(false);
    }
  };

  const addSegment = () => {
    setFormData((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        { label: 'Yeni', type: 'message', value: '', color: '#6366f1' }
      ]
    }));
  };

  const updateSegment = (index: number, field: keyof WheelSegment, value: string | number) => {
    setFormData((prev) => {
      const segs = [...prev.segments];
      segs[index] = { ...segs[index], [field]: value };
      return { ...prev, segments: segs };
    });
  };

  const removeSegment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Çark Oyunu Ayarları</h1>
        <p className="text-gray-600">Ücretsiz plan kullanıcıları için günde 1 kez çevrilebilen çark. Premium deneme süresi kazanma şansı.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Genel Ayarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.isEnabled}
                onChange={(e) => setFormData((p) => ({ ...p, isEnabled: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isEnabled">Çark oyunu aktif</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Günde 1 kez çevir..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Çark Dilimleri</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={addSegment}>
              + Dilim Ekle
            </Button>
          </CardHeader>
          <CardContent>
            {formData.segments.length === 0 ? (
              <p className="text-gray-500 py-4">Henüz dilim yok. Ekleyin.</p>
            ) : (
              <div className="space-y-4">
                {formData.segments.map((seg, i) => (
                  <div key={i} className="flex flex-wrap gap-3 items-center p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={seg.label}
                      onChange={(e) => updateSegment(i, 'label', e.target.value)}
                      placeholder="Etiket"
                      className="flex-1 min-w-[120px] rounded border px-2 py-1"
                    />
                    <select
                      value={seg.type}
                      onChange={(e) => updateSegment(i, 'type', e.target.value)}
                      className="rounded border px-2 py-1"
                    >
                      {SEGMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {(seg.type === 'subscription_days' || seg.type === 'discount_percent') && (
                      <input
                        type="number"
                        value={seg.value}
                        onChange={(e) => updateSegment(i, 'value', parseInt(e.target.value, 10) || 0)}
                        placeholder={seg.type === 'subscription_days' ? 'Gün' : '%'}
                        min={1}
                        max={seg.type === 'subscription_days' ? 30 : 100}
                        className="w-20 rounded border px-2 py-1"
                      />
                    )}
                    <input
                      type="color"
                      value={seg.color}
                      onChange={(e) => updateSegment(i, 'color', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeSegment(i)}
                      className="text-red-600"
                    >
                      Sil
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" isLoading={isSaving}>
          Kaydet
        </Button>
      </form>
    </div>
  );
}
