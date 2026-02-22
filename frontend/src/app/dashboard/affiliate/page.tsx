'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

interface AffiliateInfo {
  id: string;
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  bankName: string | null;
  accountHolder: string | null;
  iban: string | null;
  createdAt: string;
  stats?: {
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    unpaidCommissions: number;
  };
}

interface Referral {
  id: string;
  referredUser: {
    fullName: string;
    email: string;
    createdAt: string;
  };
  hasSubscribed: boolean;
  firstSubscription: string | null;
  createdAt: string;
}

interface Commission {
  id: string;
  amount: number;
  percentage: number;
  subscriptionAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
}

type UserRole = 'ADMIN' | 'STAFF' | 'RESTAURANT_OWNER';

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export default function AffiliateDashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankData, setBankData] = useState({
    bankName: '',
    accountHolder: '',
    iban: ''
  });

  useEffect(() => {
    loadUserAndAffiliate();
  }, []);

  const loadUserAndAffiliate = async () => {
    try {
      setIsLoading(true);
      // Kullanıcı bilgisini al
      const userRes = await api.get('/auth/me');
      setUser(userRes.data.user);

      await loadAffiliateInfo();
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAffiliateInfo = async () => {
    try {
      const response = await api.get('/affiliates/me');
      setAffiliateInfo(response.data.data);

      // Referral link al
      if (response.data.data.status === 'ACTIVE') {
        const linkRes = await api.get('/affiliates/me/link');
        setReferralLink(linkRes.data.data.referralLink);

        // Referrals ve commissions yükle
        const [refRes, commRes] = await Promise.all([
          api.get('/affiliates/me/referrals'),
          api.get('/affiliates/me/commissions')
        ]);
        setReferrals(refRes.data.data);
        setCommissions(commRes.data.data);
      }

      // Banka bilgilerini form'a yükle
      if (response.data.data.bankName) {
        setBankData({
          bankName: response.data.data.bankName || '',
          accountHolder: response.data.data.accountHolder || '',
          iban: response.data.data.iban || ''
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Affiliate kaydı yok
        setAffiliateInfo(null);
      } else {
        console.error('Failed to load affiliate info:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/affiliates/apply', bankData);
      alert('✅ Başvurunuz alındı! Onay bekliyor.');
      setShowApplyForm(false);
      loadAffiliateInfo();
    } catch (error: any) {
      console.error('Failed to apply:', error);
      alert(error.response?.data?.message || 'Başvuru gönderilemedi');
    }
  };

  const handleUpdateBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/affiliates/me/bank-info', bankData);
      alert('✅ Banka bilgileriniz güncellendi');
      setShowBankForm(false);
      loadAffiliateInfo();
    } catch (error) {
      console.error('Failed to update bank info:', error);
      alert('Banka bilgileri güncellenemedi');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Kopyalandı!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  // Affiliate kaydı yoksa
  if (!affiliateInfo) {
    // Restoran sahibi ise otomatik affiliate oluştur
    if (user?.role === 'RESTAURANT_OWNER') {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏪 Referral Programı</h1>
            <p className="text-gray-600 mt-2">Restoran Sahipleri İçin Özel!</p>
          </div>

          <Card>
            <CardContent>
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="text-6xl mb-6">🎁</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Ücretsiz Abonelik Kazanın
                </h2>
                <p className="text-gray-600 mb-8">
                  Sizin için özel referral linkiniz hazır! Arkadaşlarınıza gönderin, 
                  her kayıt için <strong>ücretsiz abonelik günleri</strong> kazanın.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">🔗</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Özel Link</h3>
                    <p className="text-sm text-gray-600">Size özel referral linkiniz</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">📆</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Gün Kazanın</h3>
                    <p className="text-sm text-gray-600">Her referral için ek gün</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl mb-2">♾️</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Limit Yok</h3>
                    <p className="text-sm text-gray-600">İstediğiniz kadar referral</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-900">
                    ℹ️ Affiliate hesabınız ilk restoranınızı oluşturduğunuzda otomatik olarak oluşturuldu. 
                    Aşağıdaki butona tıklayarak bilgilerinizi görüntüleyebilirsiniz.
                  </p>
                </div>

                <Button onClick={loadAffiliateInfo} size="lg">
                  Referral Linkimi Göster
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Diğer kullanıcılar için başvuru formu
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🤝 Affiliate Partner Programı</h1>
          <p className="text-gray-600 mt-2">Defne Qr'yi tanıtın, kazanın!</p>
        </div>

        <Card>
          <CardContent>
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="text-6xl mb-6">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Affiliate Partner Olun
              </h2>
              <p className="text-gray-600 mb-8">
                Defne Qr'yi arkadaşlarınıza ve müşterilerinize tanıtın. 
                Her başarılı kayıt ve abonelikten komisyon kazanın!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🔗</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Benzersiz Link</h3>
                  <p className="text-sm text-gray-600">Size özel referral linki alın</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">💵</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Komisyon Kazanın</h3>
                  <p className="text-sm text-gray-600">Her abonelikten gelir elde edin</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-1">İstatistikler</h3>
                  <p className="text-sm text-gray-600">Kazançlarınızı takip edin</p>
                </div>
              </div>

              <Button onClick={() => setShowApplyForm(true)} size="lg">
                Başvur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Apply Modal */}
        <Modal
          isOpen={showApplyForm}
          onClose={() => setShowApplyForm(false)}
          title="Affiliate Partner Başvurusu"
        >
          <form onSubmit={handleApply} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                ℹ️ Banka bilgileriniz ödeme yapılması için gereklidir. 
                Bu bilgileri daha sonra da güncelleyebilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banka Adı
              </label>
              <Input
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                placeholder="Örn: Garanti BBVA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hesap Sahibi
              </label>
              <Input
                value={bankData.accountHolder}
                onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })}
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IBAN
              </label>
              <Input
                value={bankData.iban}
                onChange={(e) => setBankData({ ...bankData, iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Başvuruyu Gönder
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowApplyForm(false)}
              >
                İptal
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Affiliate kaydı var ama pending
  if (affiliateInfo.status === 'PENDING') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🤝 Affiliate Partner</h1>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-6">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Başvurunuz İnceleniyor
              </h2>
              <p className="text-gray-600 mb-4">
                Affiliate partner başvurunuz alınmıştır. 
                Admin onayından sonra referral linkiniz aktif olacak.
              </p>
              <p className="text-sm text-gray-500">
                Başvuru Tarihi: {new Date(affiliateInfo.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affiliate kaydı var ve aktif
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🤝 Affiliate Dashboard</h1>
        <p className="text-gray-600 mt-2">Referanslarınız ve kazançlarınız</p>
      </div>

      {/* Stats Cards */}
      {affiliateInfo.stats && user && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-blue-600">{affiliateInfo.stats.totalReferrals}</p>
                <p className="text-gray-600 text-sm mt-1">Toplam Referans</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-green-600">{affiliateInfo.stats.activeReferrals}</p>
                <p className="text-gray-600 text-sm mt-1">Aktif Abonelik</p>
              </div>
            </CardContent>
          </Card>
          {user.role === 'RESTAURANT_OWNER' ? (
            <Card>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-purple-600">
                    {affiliateInfo.stats.totalReferrals * 7} gün
                  </p>
                  <p className="text-gray-600 text-sm mt-1">Toplam Kazanılan Süre</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold text-purple-600">₺{affiliateInfo.stats.totalEarnings.toFixed(2)}</p>
                    <p className="text-gray-600 text-sm mt-1">Toplam Kazanç</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold text-yellow-600">₺{affiliateInfo.stats.pendingEarnings.toFixed(2)}</p>
                    <p className="text-gray-600 text-sm mt-1">Bekleyen Kazanç</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Referral Linkiniz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="flex-1"
              />
              <Button onClick={() => copyToClipboard(referralLink)}>
                Kopyala
              </Button>
            </div>
            {user && (
              <div className={`border rounded-lg p-4 ${
                user.role === 'RESTAURANT_OWNER' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${
                  user.role === 'RESTAURANT_OWNER' 
                    ? 'text-green-900' 
                    : 'text-blue-900'
                }`}>
                  {user.role === 'RESTAURANT_OWNER' ? (
                    <>
                      🎁 Bu linki arkadaşlarınıza gönderin. Link üzerinden kayıt olan her kullanıcı için 
                      <strong> abonelik süreniz otomatik uzar!</strong>
                    </>
                  ) : (
                    <>
                      💡 Bu linki sosyal medyada, blogunuzda veya e-postalarınızda paylaşın. 
                      Link üzerinden kayıt olan ve abonelik satın alan her kullanıcıdan komisyon kazanırsınız!
                    </>
                  )}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(referralLink)}
              >
                📋 Kopyala
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Defne Qr ile işletmenizi dijitalleştirin!&url=${encodeURIComponent(referralLink)}`, '_blank')}
              >
                🐦 Twitter'da Paylaş
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}
              >
                📘 Facebook'ta Paylaş
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Defne Qr ile işletmenizi dijitalleştirin! ' + referralLink)}`, '_blank')}
              >
                💬 WhatsApp'ta Paylaş
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Info - Sadece ödenen affiliate'ler için */}
      {user && user.role !== 'RESTAURANT_OWNER' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>🏦 Banka Bilgileri</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => setShowBankForm(true)}>
                Düzenle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Banka</p>
                <p className="font-medium text-gray-900">{affiliateInfo.bankName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hesap Sahibi</p>
                <p className="font-medium text-gray-900">{affiliateInfo.accountHolder || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IBAN</p>
                <p className="font-medium text-gray-900 font-mono text-sm">{affiliateInfo.iban || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Referanslarınız ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz referansınız yok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kayıt Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{referral.referredUser.fullName}</div>
                          <div className="text-sm text-gray-500">{referral.referredUser.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(referral.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        {referral.hasSubscribed ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Abone Oldu
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Henüz Abone Değil
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Komisyonlarınız ({commissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz komisyon kazanmadınız
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abonelik Tutarı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Komisyon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(commission.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ₺{commission.subscriptionAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ₺{commission.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        %{commission.percentage}
                      </td>
                      <td className="px-6 py-4">
                        {commission.isPaid ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Ödendi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Bekliyor
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Info Edit Modal */}
      <Modal
        isOpen={showBankForm}
        onClose={() => setShowBankForm(false)}
        title="Banka Bilgilerini Güncelle"
      >
        <form onSubmit={handleUpdateBankInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banka Adı
            </label>
            <Input
              value={bankData.bankName}
              onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
              placeholder="Örn: Garanti BBVA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hesap Sahibi
            </label>
            <Input
              value={bankData.accountHolder}
              onChange={(e) => setBankData({ ...bankData, accountHolder: e.target.value })}
              placeholder="Ad Soyad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <Input
              value={bankData.iban}
              onChange={(e) => setBankData({ ...bankData, iban: e.target.value })}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Güncelle
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowBankForm(false)}
            >
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
