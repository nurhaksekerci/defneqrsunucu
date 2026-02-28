'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { authService } from '@/lib/auth';

interface Plan {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  maxRestaurants: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const restaurantCount = parseInt(searchParams.get('restaurantCount') || '1');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<any>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/auth/login?redirect=/subscription/checkout?planId=' + planId);
      return;
    }

    if (!planId) {
      router.push('/');
      return;
    }

    loadPlan();
  }, [planId, router]);

  const loadPlan = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/plans/${planId}`);
      setPlan(response.data.data);
    } catch (error) {
      console.error('Failed to load plan:', error);
      alert('Plan yüklenemedi');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      setIsValidatingPromo(true);
      const response = await api.get(`/promo-codes/validate/${promoCode}?planId=${planId}`);
      
      // İndirim hesapla
      const applyResponse = await api.post('/promo-codes/apply', {
        code: promoCode,
        subscriptionAmount: calculateTotal(),
        planId
      });

      setPromoDiscount(applyResponse.data.data);
      alert('✅ Promosyon kodu uygulandı!');
    } catch (error: any) {
      console.error('Failed to validate promo code:', error);
      alert(error.response?.data?.message || 'Promosyon kodu geçersiz');
      setPromoDiscount(null);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    
    let total = plan.price;
    
    // Kurumsal plan için ek işletme ücreti
    if (plan.type === 'CUSTOM' && restaurantCount > 1) {
      // extraRestaurantPrice backend'den gelmeli, şimdilik sabit
      const extraPrice = 50; // Bu değer plan'dan gelmeli
      total += (restaurantCount - 1) * extraPrice;
    }

    return total;
  };

  const getFinalAmount = () => {
    if (promoDiscount) {
      return promoDiscount.finalAmount;
    }
    return calculateTotal();
  };

  const isFree = getFinalAmount() === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) return;

    try {
      setIsProcessing(true);

      // Ödeme işlemi burada yapılacak (Stripe, iyzico, vb.)
      // Şimdilik demo olarak direkt abonelik oluşturalım

      const subscriptionData = {
        planId: plan.id,
        amount: getFinalAmount(),
        paymentDate: new Date().toISOString(),
        customRestaurantCount: plan.type === 'CUSTOM' ? restaurantCount : null
      };

      // Kullanıcı kendi planını satın alır (/subscribe endpoint'i)
      await api.post('/subscriptions/subscribe', subscriptionData);

      // Promo code kullanıldıysa kaydet
      if (promoDiscount) {
        // Backend'de otomatik kaydedilecek
      }

      alert('✅ Abonelik başarıyla oluşturuldu!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to process payment:', error);
      alert(error.response?.data?.message || 'Ödeme işlemi başarısız');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ödeme</h1>
          <p className="text-gray-600 mt-2">Plan aboneliğinizi tamamlayın</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="pb-4 border-b">
                  <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan Ücreti:</span>
                    <span className="font-semibold text-gray-900">₺{plan.price}</span>
                  </div>

                  {plan.type === 'CUSTOM' && restaurantCount > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{restaurantCount - 1} ek işletme:</span>
                      <span className="font-semibold text-gray-900">₺{(restaurantCount - 1) * 50}</span>
                    </div>
                  )}

                  {promoDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Promosyon İndirimi:</span>
                      <span className="font-semibold">-₺{promoDiscount.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Toplam:</span>
                    <span className="font-bold text-primary-600">₺{getFinalAmount().toFixed(2)}</span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promosyon Kodu
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="KOD GIRIN"
                      disabled={!!promoDiscount}
                    />
                    {!promoDiscount ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={validatePromoCode}
                        isLoading={isValidatingPromo}
                        disabled={!promoCode.trim()}
                      >
                        Uygula
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                          setPromoDiscount(null);
                          setPromoCode('');
                        }}
                      >
                        Kaldır
                      </Button>
                    )}
                  </div>
                  {promoDiscount && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Kod uygulandı: {promoDiscount.discountAmount > 0 ? `₺${promoDiscount.discountAmount.toFixed(2)} indirim` : 'Ücretsiz deneme'}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Plan Özellikleri:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form veya Ücretsiz Aktivasyon */}
          <Card>
            <CardHeader>
              <CardTitle>{isFree ? '✅ Planı Aktifleştir' : '💳 Ödeme Bilgileri'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isFree ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">
                        🎉 Promosyon kodu ile planınız tamamen ücretsiz! Kart bilgisi girmeden planı aktifleştirebilirsiniz.
                      </p>
                    </div>
                    <Button
                      type="submit"
                      isLoading={isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      Planı Aktifleştir
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kart Numarası *
                      </label>
                      <Input
                        value={paymentData.cardNumber}
                        onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kart Üzerindeki İsim *
                      </label>
                      <Input
                        value={paymentData.cardHolder}
                        onChange={(e) => setPaymentData({ ...paymentData, cardHolder: e.target.value })}
                        placeholder="AD SOYAD"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Son Kullanma Tarihi *
                        </label>
                        <Input
                          value={paymentData.expiryDate}
                          onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                          placeholder="AA/YY"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <Input
                          type="password"
                          value={paymentData.cvv}
                          onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-xs text-yellow-900">
                        🔒 Ödeme bilgileriniz güvenli bir şekilde şifrelenir. 
                        Kart bilgileriniz saklanmaz.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      isLoading={isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      ₺{getFinalAmount().toFixed(2)} Öde
                    </Button>
                  </>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Devam ederek{' '}
                  <a href="/terms" className="text-primary-600 hover:underline">
                    Kullanım Şartlarını
                  </a>
                  {' '}ve{' '}
                  <a href="/privacy" className="text-primary-600 hover:underline">
                    Gizlilik Politikasını
                  </a>
                  {' '}kabul etmiş olursunuz.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Yükleniyor...</div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
