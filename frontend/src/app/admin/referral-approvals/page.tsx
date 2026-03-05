'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import Link from 'next/link';

interface PendingReward {
  id: string;
  referredUser: { fullName: string; email: string };
  affiliate: { user: { fullName: string; email: string } };
  firstSubscription: string;
  daysToAward: number;
  restaurantSlug: string | null;
  restaurantName: string | null;
  restaurantUrl: string | null;
}

export default function ReferralApprovalsPage() {
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  const loadPendingRewards = async () => {
    try {
      const response = await api.get('/affiliates/pending-rewards');
      setPendingRewards(response.data.data || []);
    } catch (error) {
      console.error('Failed to load pending rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRewards();
  }, []);

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
    if (pendingRewards.length === 0) return;
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Ödül Onayları</h1>
        <p className="text-gray-600">
          Ücretsiz plana geçen affiliate davetlileri için gün ödülü onayı. Davet eden affiliate&apos;e Premium gün eklenir.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Onay Bekleyen Referrallar
              {pendingRewards.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  {pendingRewards.length} bekliyor
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Affiliate linki ile kayıt olup ücretsiz plana geçen kullanıcılar. Onayladığınızda davet eden kişiye Premium gün eklenir.
            </p>
          </div>
          {pendingRewards.length > 0 && (
            <Button onClick={handleApproveAll} disabled={isApproving}>
              Tümünü Onayla
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingRewards.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-600 font-medium">Bekleyen onay yok</p>
              <p className="text-sm text-gray-500 mt-1">
                Ücretsiz plana geçen yeni affiliate davetlileri burada listelenecek
              </p>
              <Link
                href="/admin/affiliate-settings"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Affiliate ayarlarına git →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100/50 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {r.referredUser.fullName}
                    </p>
                    <p className="text-sm text-gray-600">{r.referredUser.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Davet eden: <strong>{r.affiliate.user.fullName}</strong> ({r.affiliate.user.email}) •{' '}
                      <span className="text-amber-700 font-medium">{r.daysToAward} gün</span> kazanacak
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      İlk abonelik: {new Date(r.firstSubscription).toLocaleDateString('tr-TR')}
                    </p>
                    {r.restaurantUrl && (
                      <a
                        href={r.restaurantUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium mt-1.5"
                      >
                        🏪 {(r.restaurantName || r.restaurantSlug || 'Restoran')} menüsü →
                      </a>
                    )}
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
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link
          href="/admin/affiliate-settings"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Affiliate ayarlarına dön
        </Link>
      </div>
    </div>
  );
}
