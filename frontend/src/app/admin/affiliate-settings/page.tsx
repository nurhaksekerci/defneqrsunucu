'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface AffiliateSettings {
  id: string;
  commissionRate: number;
  minimumPayout: number;
  isEnabled: boolean;
  requireApproval: boolean;
  cookieDuration: number;
}

export default function AffiliateSettingsPage() {
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    commissionRate: 10,
    minimumPayout: 100,
    daysPerReferral: 7,
    isEnabled: true,
    requireApproval: true,
    cookieDuration: 30
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/affiliates/settings');
      const data = response.data.data;
      setSettings(data);
      setFormData({
        commissionRate: data.commissionRate,
        minimumPayout: data.minimumPayout,
        daysPerReferral: data.daysPerReferral || 7,
        isEnabled: data.isEnabled,
        requireApproval: data.requireApproval,
        cookieDuration: data.cookieDuration
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/affiliates/settings', formData);
      alert('✅ Ayarlar başarıyla kaydedildi!');
      loadSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ Ayarlar kaydedilemedi!');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🤝 Affiliate Marketing Ayarları</h1>
        <p className="text-gray-600 mt-2">Komisyon oranları ve genel ayarları yönetin</p>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Ayarlar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Affiliate Sistemi</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Affiliate marketing sistemini aktif/pasif yapın
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Require Approval */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Başvuru Onayı</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Yeni affiliate başvuruları manuel onay gerektirsin
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Days Per Referral - RESTORAN SAHİPLERİ İÇİN */}
              <div className="col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-900 mb-3">
                  🏪 Restoran Sahipleri İçin (Gün Kazanma Sistemi)
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Her Referral Başına Kazanılan Gün *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.daysPerReferral}
                    onChange={(e) => setFormData({ ...formData, daysPerReferral: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Restoran sahipleri her referral için bu kadar gün abonelik uzatması kazanır
                  </p>
                </div>
              </div>

              {/* Commission Rate - ÖDENEN AFFİLİATE'LER İÇİN */}
              <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  💰 Ödenen Affiliate'ler İçin (Para Komisyonu)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Komisyon Oranı (%) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ödenen affiliate'ler her abonelikten bu oranda komisyon alır
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Ödeme Tutarı (₺) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimumPayout}
                      onChange={(e) => setFormData({ ...formData, minimumPayout: parseFloat(e.target.value) })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Bu tutara ulaşmadan ödeme yapılamaz
                    </p>
                  </div>
                </div>
              </div>

              {/* Cookie Duration */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cookie Süresi (Gün) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.cookieDuration}
                  onChange={(e) => setFormData({ ...formData, cookieDuration: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Referral link tıklandıktan sonra kaç gün geçerli olsun
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-purple-600 text-xl">ℹ️</div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">
                    Sistem Nasıl Çalışır?
                  </h4>
                  <ul className="text-xs text-purple-800 space-y-1">
                    <li>• <strong>Restoran Sahipleri:</strong> Her referral için <strong>{formData.daysPerReferral} gün</strong> abonelik uzatması kazanırlar (para yok)</li>
                    <li>• <strong>Ödenen Affiliate'ler:</strong> Her abonelikten <strong>%{formData.commissionRate}</strong> para komisyonu alırlar</li>
                    <li>• İlk restoran oluşturulduğunda otomatik affiliate partner olunur</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isSaving} className="flex-1">
                Kaydet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Affiliate Marketing Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">1. Affiliate Başvurusu</h4>
              <p>Kullanıcılar affiliate olmak için başvuruda bulunur. {formData.requireApproval ? 'Manuel onay gerekir.' : 'Otomatik onaylanır.'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Referral Link</h4>
              <p>Onaylanan affiliateler benzersiz bir referral link alır (örn: defneqr.com/register?ref=ABC123)</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Kullanıcı Kaydı</h4>
              <p>Link üzerinden kayıt olan kullanıcılar {formData.cookieDuration} gün içinde affiliate ile eşleştirilir</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4. Komisyon</h4>
              <p>Referans kullanıcı abonelik satın aldığında, affiliate %{formData.commissionRate} komisyon kazanır</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">5. Ödeme</h4>
              <p>Bekleyen kazançlar ₺{formData.minimumPayout} tutarına ulaştığında ödeme yapılabilir</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
