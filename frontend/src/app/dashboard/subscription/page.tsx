'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  type: string;
  price?: number;
  maxRestaurants: number;
  maxCategories: number;
  maxProducts: number;
}

interface SubscriptionData {
  hasSubscription: boolean;
  plan: Plan;
  usage: { restaurants: number; categories: number; products: number };
  limits: { restaurants: number; categories: number; products: number };
  subscription?: { daysRemaining: number };
}

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/subscriptions/my'),
        api.get('/plans')
      ]);
      setData(subRes.data.data);
      setPlans(plansRes.data.data || []);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const premiumPlan = plans.find(p => p.type === 'PREMIUM');
  const isFreePlan = data.plan?.type === 'FREE';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plan ve Abonelik</h1>
        <p className="text-gray-600 mt-1">Mevcut planınız ve kullanım bilgileriniz</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Plan: {data.plan?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600">{data.usage.restaurants}/{data.limits.restaurants}</div>
              <div className="text-sm text-gray-600">İşletme</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600">{data.usage.categories}/{data.limits.categories}</div>
              <div className="text-sm text-gray-600">Kategori</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600">{data.usage.products}/{data.limits.products}</div>
              <div className="text-sm text-gray-600">Ürün</div>
            </div>
          </div>
          {data.subscription?.daysRemaining !== undefined && (
            <p className="text-sm text-gray-600">
              Kalan süre: <strong>{data.subscription.daysRemaining}</strong> gün
            </p>
          )}
        </CardContent>
      </Card>

      {isFreePlan && premiumPlan && (
        <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
          <CardHeader>
            <CardTitle>Premium&apos;a Yükselt</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Daha fazla işletme, kategori ve ürün eklemek için Premium plana geçin.
            </p>
          </CardHeader>
          <CardContent>
            <Link href={`/subscription/checkout?planId=${premiumPlan.id}`}>
              <Button className="w-full sm:w-auto">
                Premium&apos;a Geç
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
