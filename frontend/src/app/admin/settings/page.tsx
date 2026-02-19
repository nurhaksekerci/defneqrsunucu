'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  maxRestaurantsPerUser: number;
  enableGoogleAuth: boolean;
  maintenanceMode: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Defne Qr',
    siteDescription: 'QR Menü ve Restoran Yönetim Sistemi',
    supportEmail: 'destek@defneqr.com',
    maxRestaurantsPerUser: 5,
    enableGoogleAuth: false,
    maintenanceMode: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      const serverSettings = response.data.data;
      setSettings({
        siteName: serverSettings.siteName || 'Defne Qr',
        siteDescription: serverSettings.siteDescription || 'QR Menü ve Restoran Yönetim Sistemi',
        supportEmail: serverSettings.supportEmail || 'destek@defneqr.com',
        maxRestaurantsPerUser: serverSettings.maxRestaurantsPerUser || 5,
        enableGoogleAuth: serverSettings.enableGoogleAuth || false,
        maintenanceMode: serverSettings.maintenanceMode || false
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      await api.put('/settings', settings);
      
      setSaveMessage('Ayarlar başarıyla kaydedildi!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistem Ayarları</h1>
        <p className="text-gray-600">Sistem geneli yapılandırma ve ayarlar</p>
      </div>

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.includes('başarıyla') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel Ayarlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Site Adı"
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="Defne Qr"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Açıklaması
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                  rows={3}
                  placeholder="QR Menü ve Restoran Yönetim Sistemi"
                />
              </div>

              <Input
                label="Destek Email"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="destek@defneqr.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Ayarları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Başına Maksimum Restoran Sayısı
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxRestaurantsPerUser}
                  onChange={(e) => setSettings({ ...settings, maxRestaurantsPerUser: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bir kullanıcının oluşturabileceği maksimum restoran sayısı
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kimlik Doğrulama</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Google OAuth</h4>
                  <p className="text-sm text-gray-500">
                    Kullanıcıların Google hesabı ile giriş yapmasına izin ver
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableGoogleAuth}
                    onChange={(e) => setSettings({ ...settings, enableGoogleAuth: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Bakım Modu</h4>
                  <p className="text-sm text-gray-500">
                    Sistemi bakım moduna al (sadece adminler erişebilir)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {settings.maintenanceMode && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Uyarı:</strong> Bakım modu aktif. Sadece admin kullanıcıları sisteme erişebilir.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Versiyon</span>
                <span className="font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Backend</span>
                <span className="font-medium text-gray-900">Node.js + Express</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Frontend</span>
                <span className="font-medium text-gray-900">Next.js 14</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Veritabanı</span>
                <span className="font-medium text-gray-900">PostgreSQL (Prisma ORM)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Son Güncelleme</span>
                <span className="font-medium text-gray-900">15 Şubat 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} isLoading={isSaving}>
            Ayarları Kaydet
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            İptal
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>💡 Not:</strong> Bu ayarlar sistem genelinde geçerlidir. 
          Değişiklikler tüm kullanıcıları ve restoranları etkileyebilir.
        </p>
      </div>
    </div>
  );
}
