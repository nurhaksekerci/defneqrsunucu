'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Zayıf' };
    if (strength <= 4) return { level: 'medium', color: 'bg-yellow-500', text: 'Orta' };
    return { level: 'strong', color: 'bg-green-500', text: 'Güçlü' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mevcut şifre gerekli';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Yeni şifre gerekli';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Şifre en az 8 karakter olmalı';
    } else if (!/[a-z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Şifre en az bir küçük harf içermelidir';
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Şifre en az bir büyük harf içermelidir';
    } else if (!/\d/.test(formData.newPassword)) {
      newErrors.newPassword = 'Şifre en az bir rakam içermelidir';
    } else if (!/[^a-zA-Z0-9]/.test(formData.newPassword)) {
      newErrors.newPassword = 'Şifre en az bir özel karakter (. - _ @ $ ! % * ? & vb.) içermelidir';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Yeni şifre mevcut şifreden farklı olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccessMessage('Şifreniz başarıyla değiştirildi!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setErrors({
        submit: err.response?.data?.message || 'Şifre değiştirilemedi. Lütfen tekrar deneyin.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Şifre Değiştir</h1>
        <p className="text-gray-600">Hesap güvenliğiniz için güçlü bir şifre seçin</p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ {successMessage}</p>
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{errors.submit}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Şifre Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Mevcut Şifre"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              error={errors.currentPassword}
              required
            />

            <div>
              <Input
                label="Yeni Şifre"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                error={errors.newPassword}
                required
              />
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{ width: `${(getPasswordStrength(formData.newPassword).level === 'weak' ? 33 : getPasswordStrength(formData.newPassword).level === 'medium' ? 66 : 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{passwordStrength.text}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Şifre gereksinimleri: En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter (. - _ @ $ ! % * ? & vb.)
                  </p>
                </div>
              )}
            </div>

            <Input
              label="Yeni Şifre (Tekrar)"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              required
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                isLoading={isLoading}
                className="flex-1"
              >
                Şifreyi Değiştir
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Güvenli Şifre İpuçları</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Farklı web siteleri için farklı şifreler kullanın</li>
          <li>• Kişisel bilgilerinizi (isim, doğum tarihi) şifrenizde kullanmayın</li>
          <li>• Düzenli olarak şifrenizi değiştirin</li>
          <li>• Şifrenizi kimseyle paylaşmayın</li>
        </ul>
      </div>
    </div>
  );
}
