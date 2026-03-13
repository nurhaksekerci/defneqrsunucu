'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

interface AffiliatePartner {
  id: string;
  userId: string;
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  bankName: string | null;
  accountHolder: string | null;
  iban: string | null;
  approvedAt: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
  _count?: {
    referrals: number;
    commissions: number;
  };
}

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;
  totalReferrals: number;
  totalCommissions: number;
  unpaidCommissions: number;
  totalEarnings: number;
}

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliatePartner | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutData, setPayoutData] = useState({
    method: 'BANK_TRANSFER',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [affiliatesRes, statsRes] = await Promise.all([
        api.get('/affiliates/all'),
        api.get('/affiliates/stats')
      ]);
      setAffiliates(affiliatesRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to load affiliates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/affiliates/${id}/status`, { status });
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Durum güncellenemedi');
    }
  };

  const createPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate) return;

    try {
      // Ödenmemiş komisyonları al
      const commissionsRes = await api.get(`/affiliates/me/commissions?isPaid=false`);
      const unpaidCommissions = commissionsRes.data.data;

      if (unpaidCommissions.length === 0) {
        alert('Ödenecek komisyon bulunamadı');
        return;
      }

      await api.post('/affiliates/payouts', {
        affiliateId: selectedAffiliate.id,
        commissionIds: unpaidCommissions.map((c: any) => c.id),
        method: payoutData.method,
        notes: payoutData.notes
      });

      alert('✅ Ödeme talebi oluşturuldu');
      setShowPayoutModal(false);
      setSelectedAffiliate(null);
      loadData();
    } catch (error) {
      console.error('Failed to create payout:', error);
      alert('Ödeme oluşturulamadı');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-orange-100 text-orange-800',
      BANNED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      PENDING: 'Onay Bekliyor',
      ACTIVE: 'Aktif',
      SUSPENDED: 'Askıya Alınmış',
      BANNED: 'Yasaklanmış'
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🤝 Affiliate Partnerlar</h1>
        <p className="text-gray-600 mt-2">Tüm affiliate partnerları yönetin</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-gray-900">{stats.totalAffiliates}</p>
                <p className="text-gray-600 text-sm mt-1">Toplam Partner</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-green-600">{stats.activeAffiliates}</p>
                <p className="text-gray-600 text-sm mt-1">Aktif Partner</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingAffiliates}</p>
                <p className="text-gray-600 text-sm mt-1">Onay Bekliyor</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-blue-600">₺{stats.totalEarnings.toFixed(2)}</p>
                <p className="text-gray-600 text-sm mt-1">Toplam Kazanç</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Affiliates List */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Affiliate Partnerlar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : affiliates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Henüz affiliate partner yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referanslar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kazançlar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {affiliate.user?.fullName ?? (affiliate.userId ? 'Silinmiş kullanıcı' : '—')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {affiliate.user?.email ?? (affiliate.userId ? 'Hesap kaldırılmış' : '—')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-3 py-1 bg-gray-100 text-primary-600 font-bold rounded text-sm">
                          {affiliate.referralCode}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">{affiliate.totalReferrals} kayıt</div>
                          <div className="text-xs text-gray-500">{affiliate._count?.commissions || 0} komisyon</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">₺{affiliate.totalEarnings.toFixed(2)}</div>
                          <div className="text-xs text-yellow-600">₺{affiliate.pendingEarnings.toFixed(2)} bekliyor</div>
                          <div className="text-xs text-green-600">₺{affiliate.paidEarnings.toFixed(2)} ödendi</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(affiliate.status)}`}>
                          {getStatusLabel(affiliate.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {affiliate.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => updateStatus(affiliate.id, 'ACTIVE')}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => updateStatus(affiliate.id, 'BANNED')}
                              >
                                Reddet
                              </Button>
                            </>
                          )}
                          {affiliate.status === 'ACTIVE' && (
                            <>
                              {affiliate.pendingEarnings > 0 && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    setSelectedAffiliate(affiliate);
                                    setShowPayoutModal(true);
                                  }}
                                >
                                  Ödeme Yap
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateStatus(affiliate.id, 'SUSPENDED')}
                              >
                                Askıya Al
                              </Button>
                            </>
                          )}
                          {affiliate.status === 'SUSPENDED' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => updateStatus(affiliate.id, 'ACTIVE')}
                            >
                              Aktifleştir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Modal */}
      {selectedAffiliate && (
        <Modal
          isOpen={showPayoutModal}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedAffiliate(null);
          }}
          title="Ödeme Yap"
        >
          <form onSubmit={createPayout} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Partner:</span>
                <span className="font-semibold text-gray-900">{selectedAffiliate.user?.fullName ?? selectedAffiliate.userId ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bekleyen Kazanç:</span>
                <span className="font-bold text-yellow-600">₺{selectedAffiliate.pendingEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Banka:</span>
                <span className="text-gray-900">{selectedAffiliate.bankName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hesap Sahibi:</span>
                <span className="text-gray-900">{selectedAffiliate.accountHolder || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IBAN:</span>
                <span className="text-gray-900 font-mono text-sm">{selectedAffiliate.iban || '-'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Yöntemi
              </label>
              <select
                value={payoutData.method}
                onChange={(e) => setPayoutData({ ...payoutData, method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                required
              >
                <option value="BANK_TRANSFER">Banka Havalesi</option>
                <option value="PAYPAL">PayPal</option>
                <option value="WIRE_TRANSFER">Havale/EFT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notlar
              </label>
              <textarea
                value={payoutData.notes}
                onChange={(e) => setPayoutData({ ...payoutData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                rows={3}
                placeholder="Ödeme ile ilgili notlar"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Ödemeyi Onayla
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowPayoutModal(false);
                  setSelectedAffiliate(null);
                }}
              >
                İptal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
