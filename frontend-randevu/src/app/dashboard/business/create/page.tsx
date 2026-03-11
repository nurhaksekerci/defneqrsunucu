'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

export default function CreateBusinessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'İşletme adı zorunludur';
    }
    if (formData.phone && !/^[0-9\s\(\)\-\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçersiz telefon formatı';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const res = await api.post('/businesses', {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      });
      if (res.data.success && res.data.data?.id) {
        router.push(`/dashboard/business/${res.data.data.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string }; status?: number } };
      const message = res?.response?.data?.message;
      if (res?.response?.status === 400 && message?.includes('yalnızca bir işletme')) {
        router.push('/dashboard');
        return;
      }
      alert(message || 'İşletme oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni İşletme Oluştur</h1>
        <p className="text-gray-600">İşletmenizin bilgilerini girin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İşletme Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="İşletme Adı *"
                type="text"
                placeholder="Örn: Kuaförüm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea
                placeholder="İşletmeniz hakkında kısa bir açıklama..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                rows={3}
              />
            </div>

            <div>
              <Input
                label="Adres"
                type="text"
                placeholder="İşletme adresi..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Telefon"
                type="tel"
                placeholder="0555 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving}>
                İşletme Oluştur
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard')}
              >
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
