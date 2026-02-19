'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  status: string;
  notes?: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    notes?: string;
    product: {
      name: string;
      category: {
        name: string;
      };
    };
  }>;
}

export default function KitchenPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (restaurant) {
      const interval = setInterval(() => {
        loadOrders(restaurant.id);
      }, 5000); // Her 5 saniyede bir yenile

      return () => clearInterval(interval);
    }
  }, [restaurant]);

  const checkAuth = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      const user = await authService.getCurrentUser();
      
      if (user.role !== 'COOK' && user.role !== 'BARISTA' && user.role !== 'ADMIN') {
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
      const activeOrders = response.data.data.filter(
        (o: Order) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (restaurant) {
        loadOrders(restaurant.id);
      }
      // Başarı sesi çal (opsiyonel)
      playNotificationSound();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const playNotificationSound = () => {
    // Basit bir bildirim sesi
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTREO');
    audio.play().catch(() => {});
  };

  const filteredOrders = orders.filter(o => o.status === selectedStatus);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      PREPARING: 'bg-blue-500',
      READY: 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Mutfak Ekranı (KDS)</h1>
          {restaurant && (
            <p className="text-gray-400">{restaurant.name}</p>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setSelectedStatus('PENDING')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              selectedStatus === 'PENDING'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Beklemede ({orders.filter(o => o.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setSelectedStatus('PREPARING')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              selectedStatus === 'PREPARING'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Hazırlanıyor ({orders.filter(o => o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setSelectedStatus('READY')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              selectedStatus === 'READY'
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Hazır ({orders.filter(o => o.status === 'READY').length})
          </button>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-lg p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{order.orderNumber}</h3>
                  <p className="text-gray-400">Masa: {order.tableNumber || '-'}</p>
                </div>
                <span className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></span>
              </div>

              <div className="space-y-3 mb-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-2xl font-bold ml-2">x{item.quantity}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-yellow-400 mt-1">📝 {item.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{item.product.category.name}</p>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="text-sm text-yellow-400 mb-4">💬 {order.notes}</p>
              )}

              <p className="text-xs text-gray-400 mb-4">{formatDate(order.createdAt)}</p>

              <div className="flex space-x-2">
                {order.status === 'PENDING' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    Hazırlamaya Başla
                  </Button>
                )}
                {order.status === 'PREPARING' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    ✓ Hazır
                  </Button>
                )}
                {order.status === 'READY' && (
                  <div className="w-full py-2 text-center bg-green-500 rounded-lg font-medium">
                    Teslim Bekleniyor
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-400">Bu kategoride sipariş bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
}
