import api from './api';

/**
 * Plan limiti aşıldığında (403) kullanıcıyı Premium'a yönlendir
 */
export async function redirectToPremiumUpgrade(): Promise<boolean> {
  try {
    const response = await api.get('/plans');
    const plans = response.data?.data || [];
    const premiumPlan = plans.find((p: { type: string }) => p.type === 'PREMIUM');
    if (premiumPlan) {
      window.location.href = `/subscription/checkout?planId=${premiumPlan.id}`;
      return true;
    }
  } catch {
    // Planlar yüklenemezse ana sayfaya yönlendir
  }
  window.location.href = '/#pricing';
  return false;
}

/**
 * Plan limiti hatası mesajı oluştur
 */
export function getPlanLimitErrorMessage(error: any): string {
  const errorData = error?.response?.data;
  const message = errorData?.message || 'Plan limitinize ulaştınız!';
  const limitInfo = errorData?.data;

  let alertMessage = `⚠️ ${message}`;
  if (limitInfo) {
    alertMessage += `\n\n📊 Limit Bilgileri:`;
    alertMessage += `\n• Kullanılan: ${limitInfo.currentCount}/${limitInfo.maxCount}`;
    alertMessage += `\n• Plan: ${limitInfo.planName}`;
    alertMessage += `\n\n💡 Daha fazla eklemek için planınızı yükseltin.`;
  }
  return alertMessage;
}
