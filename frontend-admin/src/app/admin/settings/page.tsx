'use client';

import { useState, useEffect } from 'react';
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
    maintenanceMode: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState(false);

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
        maxRestaurantsPerUser: serverSettings.maxRestaurantsPerUser ?? 5,
        enableGoogleAuth: serverSettings.enableGoogleAuth ?? false,
        maintenanceMode: serverSettings.maintenanceMode ?? false,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSaveMessage('Ayarlar yüklenemedi.');
      setSaveError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    setSaveError(false);

    try {
      await api.put('/settings', settings);
      setSaveMessage('Ayarlar başarıyla kaydedildi!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <p className="text-gray-600">
          Bu ayarlar <strong>defneqr.com</strong> ve <strong>randevu.defneqr.com</strong> sitelerinde geçerlidir.
        </p>
      </div>

      {saveMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            saveError
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Genel Ayarlar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Genel Ayarlar</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Adı</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                placeholder="Defne Qr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Açıklaması</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                rows={3}
                placeholder="QR Menü ve Restoran Yönetim Sistemi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destek Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                placeholder="destek@defneqr.com"
              />
            </div>
          </div>
        </div>

        {/* Kullanıcı Ayarları */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Ayarları</h2>
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kullanıcı Başına Maksimum Restoran Sayısı
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.maxRestaurantsPerUser}
                onChange={(e) =>
                  setSettings({ ...settings, maxRestaurantsPerUser: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">
                Bir kullanıcının oluşturabileceği maksimum restoran sayısı
              </p>
            </div>
          </div>
        </div>

        {/* Kimlik Doğrulama */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Kimlik Doğrulama</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Google ile Giriş</h4>
                <p className="text-sm text-gray-500">
                  defneqr.com ve randevu.defneqr.com giriş sayfalarında &quot;Google ile Giriş Yap&quot; butonunu göster
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableGoogleAuth}
                  onChange={(e) => setSettings({ ...settings, enableGoogleAuth: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
              </label>
            </div>
          </div>
        </div>

        {/* Sistem Durumu */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Sistem Durumu</h2>
          </div>
          <div className="p-6 space-y-4">
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
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
        </div>

        {/* Kaydet */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
          <button
            onClick={loadSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Yenile
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>💡 Not:</strong> Bu ayarlar sistem genelinde geçerlidir. Değişiklikler hem defneqr.com hem de
          randevu.defneqr.com sitelerini etkiler.
        </p>
      </div>
    </div>
  );
}
