'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { authService, User } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageHelper';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ fullName: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }
      const u = await authService.getCurrentUser();
      setUser(u);
      setFormData({ fullName: u.fullName || '' });
    } catch {
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    try {
      const res = await api.put('/auth/profile', { fullName: formData.fullName });
      if (res.data.success) {
        setUser(res.data.data);
        setSuccessMessage('Profil güncellendi');
        window.dispatchEvent(new Event('profile-updated'));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya 5MB\'dan küçük olmalı');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir');
      return;
    }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const uploadRes = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (uploadRes.data.success) {
        const avatarUrl = uploadRes.data.data.url;
        const profileRes = await api.put('/auth/profile', { avatar: avatarUrl });
        if (profileRes.data.success) {
          setUser(profileRes.data.data);
          setSuccessMessage('Profil fotoğrafı güncellendi');
          window.dispatchEvent(new Event('profile-updated'));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Yükleme başarısız');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Profil fotoğrafını kaldırmak istediğinize emin misiniz?')) return;
    setIsSaving(true);
    try {
      const res = await api.put('/auth/profile', { avatar: null });
      if (res.data.success) {
        setUser(res.data.data);
        setSuccessMessage('Profil fotoğrafı kaldırıldı');
        window.dispatchEvent(new Event('profile-updated'));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    const names: Record<string, string> = {
      ADMIN: 'Admin',
      STAFF: 'Personel',
      RESTAURANT_OWNER: 'Restoran Sahibi',
      CASHIER: 'Kasiyer',
      WAITER: 'Garson',
      BARISTA: 'Barista',
      COOK: 'Aşçı',
    };
    return names[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil</h1>
        <p className="text-gray-600">Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ {successMessage}</p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profil Fotoğrafı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={getImageUrl(user.avatar)!}
                  alt={user.fullName}
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {user.fullName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <span
                  className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isUploading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {isUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                </span>
              </label>
              {user.avatar && (
                <Button variant="ghost" size="sm" className="text-red-600" onClick={handleRemoveAvatar} disabled={isSaving}>
                  Fotoğrafı Kaldır
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG veya GIF. Maksimum 5MB.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hesap Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Ad Soyad"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
            </div>
            {user.username && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı adı</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <input
                type="text"
                value={getRoleName(user.role)}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" isLoading={isSaving}>
                Kaydet
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
