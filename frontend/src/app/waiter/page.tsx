'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  status: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

export default function WaiterPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      const user = await authService.getCurrentUser();
      
      if (user.role !== 'WAITER' && user.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      if (user.restaurants && user.restaurants.length > 0) {
        setRestaurant(user.restaurants[0]);
        loadOrders(user.restaurants[0].id);
      }

      setIsLoading(false);
    } catch (error) {
      router.push('/auth/login');
    }
  };

  const loadOrders = async (restaurantId: string) => {
    try {
      const response = await api.get('/orders', {
        params: { restaurantId }
      });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PREPARING: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: 'Beklemede',
      PREPARING: 'Hazırlanıyor',
      READY: 'Hazır',
      DELIVERED: 'Teslim Edildi',
      CANCELLED: 'İptal Edildi'
    };
    return texts[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Garson Terminali</h1>
            {restaurant && (
              <p className="text-gray-600">{restaurant.name}</p>
            )}
          </div>
          <Button onClick={() => router.push('/waiter/new-order')}>
            + Yeni Sipariş
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Masa: {order.tableNumber || 'Belirtilmemiş'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aktif sipariş bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
}
