'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

export default function CreateRestaurantPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    logo: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Otomatik slug oluştur
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value)
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir');
      return;
    }

    setIsUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('image', file);

      const response = await api.post('/upload/image', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, logo: response.data.data.url }));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Dosya yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Restoran adı zorunludur';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug zorunludur';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug sadece küçük harf, rakam ve tire içerebilir';
    }

    if (formData.phone && !/^[0-9\s\(\)\-\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçersiz telefon formatı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.post('/restaurants', {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        logo: formData.logo || undefined
      });

      if (response.data.success) {
        router.push('/dashboard/restaurants');
      }
    } catch (error: any) {
      console.error('Failed to create restaurant:', error);
      
      // Plan limiti hatası kontrolü (403)
      if (error.response?.status === 403) {
        const errorData = error.response?.data;
        const message = errorData?.message || 'Plan limitinize ulaştınız!';
        const limitInfo = errorData?.data;
        
        let alertMessage = `⚠️ ${message}`;
        
        if (limitInfo) {
          alertMessage += `\n\n📊 Limit Bilgileri:`;
          alertMessage += `\n• Kullanılan: ${limitInfo.currentCount}/${limitInfo.maxCount}`;
          alertMessage += `\n• Plan: ${limitInfo.planName}`;
          alertMessage += `\n\n💡 Daha fazla işletme eklemek için planınızı yükseltin.`;
        }
        
        alert(alertMessage);
      } else if (error.response?.data?.message) {
        if (error.response.data.message.includes('slug')) {
          setErrors({ slug: 'Bu slug zaten kullanılıyor' });
        } else {
          alert(error.response.data.message);
        }
      } else {
        alert('Restoran oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Restoran Oluştur</h1>
        <p className="text-gray-600">Restoranınızın bilgilerini girin</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restoran Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Restoran Adı *"
                type="text"
                placeholder="Örn: Lezzet Durağı"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="URL Slug *"
                type="text"
                placeholder="lezzet-duragi"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                QR menü URL'i: {window.location.origin}/{formData.slug}/menu
              </p>
              {errors.slug && (
                <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                placeholder="Restoranınız hakkında kısa bir açıklama..."
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
                placeholder="Restoran adresi..."
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
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo (Opsiyonel)
              </label>
              
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 cursor-pointer transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <div className="text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                          <p className="text-sm">Yükleniyor...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold text-primary-600">Dosya seç</span> veya sürükle bırak
                          </p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (max. 5MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-center py-8">
                  <span className="text-gray-400 text-sm">VEYA</span>
                </div>

                <div className="flex-1">
                  <Input
                    label="Logo URL"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  />
                </div>
              </div>

              {formData.logo && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Önizleme
                  </label>
                  <div className="relative inline-block">
                    <img 
                      src={formData.logo} 
                      alt="Logo önizleme" 
                      className="w-32 h-32 object-contain rounded-lg border border-gray-300 bg-white p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3EGeçersiz URL%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving}>
                Restoran Oluştur
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/restaurants')}
              >
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 İpucu:</strong> Restoran oluşturduktan sonra kategoriler ve ürünler ekleyerek menünüzü oluşturabilirsiniz.
        </p>
      </div>
    </div>
  );
}
