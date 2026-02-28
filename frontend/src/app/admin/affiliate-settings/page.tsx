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
  daysPerReferral?: number;
  daysPerReferralFree?: number;
  daysPerReferralPaid?: number;
}

interface PendingReward {
  id: string;
  referredUser: { fullName: string; email: string };
  affiliate: { user: { fullName: string; email: string } };
  firstSubscription: string;
  daysToAward: number;
}

export default function AffiliateSettingsPage() {
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    commissionRate: 10,
    minimumPayout: 100,
    daysPerReferralFree: 7,
    daysPerReferralPaid: 14,
    isEnabled: true,
    requireApproval: true,
    cookieDuration: 30
  });
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadPendingRewards();
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
        daysPerReferralFree: data.daysPerReferralFree ?? data.daysPerReferral ?? 7,
        daysPerReferralPaid: data.daysPerReferralPaid ?? data.daysPerReferral ?? 14,
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

  const loadPendingRewards = async () => {
    try {
      const response = await api.get('/affiliates/pending-rewards');
      setPendingRewards(response.data.data || []);
    } catch (error) {
      console.error('Failed to load pending rewards:', error);
    }
  };

  const handleApproveReward = async (id: string) => {
    try {
      setIsApproving(true);
      await api.post(`/affiliates/referrals/${id}/approve-reward`);
      loadPendingRewards();
      alert('Ödül onaylandı');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Onay başarısız');
    } finally {
      setIsApproving(false);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`${pendingRewards.length} bekleyen ödülü onaylamak istediğinize emin misiniz?`)) return;
    try {
      setIsApproving(true);
      await api.post('/affiliates/approve-all-rewards');
      loadPendingRewards();
      alert('Tüm ödüller onaylandı');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Onay başarısız');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/affiliates/settings', {
        ...formData,
        daysPerReferralFree: formData.daysPerReferralFree,
        daysPerReferralPaid: formData.daysPerReferralPaid
      });
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

            {/* Require Approval - Affiliate başvurusu */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Affiliate Başvuru Onayı</h3>
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
              {/* Gün Kazanma - Plan Tipine Göre */}
              <div className="col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-900 mb-3">
                  🏪 Restoran Sahipleri İçin (Gün Kazanma Sistemi)
                </h3>
                <p className="text-xs text-green-800 mb-3">
                  Ücretsiz plana geçen referral → admin onayı gerekir. Ücretli plana geçen → otomatik onay.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ücretsiz Plan (gün) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.daysPerReferralFree}
                      onChange={(e) => setFormData({ ...formData, daysPerReferralFree: parseInt(e.target.value) || 0 })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ücretsiz plana geçen referral için kazanılan gün (admin onayı sonrası)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ücretli Plan (gün) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.daysPerReferralPaid}
                      onChange={(e) => setFormData({ ...formData, daysPerReferralPaid: parseInt(e.target.value) || 0 })}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ücretli plana geçen referral için kazanılan gün (otomatik)
                    </p>
                  </div>
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
                    <li>• <strong>Ücretsiz plan:</strong> Referral ücretsiz plana geçerse <strong>{formData.daysPerReferralFree} gün</strong> kazanılır (admin onayı gerekir)</li>
                    <li>• <strong>Ücretli plan:</strong> Referral ücretli plana geçerse <strong>{formData.daysPerReferralPaid} gün</strong> otomatik kazanılır</li>
                    <li>• <strong>Ödenen Affiliate'ler:</strong> Ücretli abonelikten <strong>%{formData.commissionRate}</strong> para komisyonu</li>
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

      {/* Bekleyen Onaylar */}
      {pendingRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⏳ Onay Bekleyen Referral Ödülleri ({pendingRewards.length})</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Ücretsiz plana geçen kullanıcılar için affiliate ödülü onayı
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {pendingRewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {r.referredUser.fullName} ({r.referredUser.email})
                    </p>
                    <p className="text-xs text-gray-600">
                      Affiliate: {r.affiliate.user.fullName} • {r.daysToAward} gün kazanacak
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApproveReward(r.id)}
                    disabled={isApproving}
                  >
                    Onayla
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={handleApproveAll}
              disabled={isApproving}
            >
              Tümünü Onayla
            </Button>
          </CardContent>
        </Card>
      )}

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
              <h4 className="font-semibold mb-2">4. Ödül / Komisyon</h4>
              <p>Ücretsiz plan: Admin onayı sonrası {formData.daysPerReferralFree} gün. Ücretli plan: Otomatik {formData.daysPerReferralPaid} gün. Para komisyonu: %{formData.commissionRate}</p>
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
