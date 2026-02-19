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
    unitPrice: number;
    totalPrice: number;
    product: {
      name: string;
    };
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
  }>;
}

export default function CashierPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD'>('CASH');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
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
      
      if (user.role !== 'CASHIER' && user.role !== 'ADMIN') {
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
        params: { restaurantId, status: 'READY' }
      });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const calculateOrderTotal = (order: Order) => {
    return order.orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  };

  const calculatePaidAmount = (order: Order) => {
    return order.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const handlePayment = async () => {
    if (!selectedOrder || !paymentAmount) return;

    try {
      await api.post('/payments', {
        orderId: selectedOrder.id,
        amount: Number(paymentAmount),
        method: paymentMethod
      });

      // Başarılı, listeyi yenile
      if (restaurant) {
        loadOrders(restaurant.id);
      }
      setSelectedOrder(null);
      setPaymentAmount('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ödeme alınamadı');
    }
  };

  const getPaymentMethodName = (method: string) => {
    const names: Record<string, string> = {
      CASH: 'Nakit',
      CREDIT_CARD: 'Kredi Kartı',
      DEBIT_CARD: 'Banka Kartı'
    };
    return names[method] || method;
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Kasa Terminali</h1>
          {restaurant && (
            <p className="text-gray-600">{restaurant.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div>
            <h2 className="text-xl font-bold mb-4">Ödeme Bekleyen Siparişler</h2>
            <div className="space-y-4">
              {orders.map((order) => {
                const total = calculateOrderTotal(order);
                const paid = calculatePaidAmount(order);
                const remaining = total - paid;

                return (
                  <div
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order);
                      setPaymentAmount(remaining.toString());
                    }}
                  >
                    <Card
                      className={`transition ${
                        selectedOrder?.id === order.id ? 'ring-2 ring-primary-600' : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex justify-between">
                          <div>
                            <CardTitle>{order.orderNumber}</CardTitle>
                            <p className="text-sm text-gray-600">
                              Masa: {order.tableNumber || '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">
                              {formatCurrency(remaining)}
                            </p>
                            <p className="text-xs text-gray-500">kalan</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                        {order.orderItems.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.quantity}x {item.product.name}</span>
                            <span>{formatCurrency(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                );
              })}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Ödeme bekleyen sipariş yok</p>
              </div>
            )}
          </div>

          {/* Payment Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Al</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Sipariş No</p>
                      <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span>Toplam</span>
                        <span className="font-semibold">
                          {formatCurrency(calculateOrderTotal(selectedOrder))}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2 text-green-600">
                        <span>Ödenen</span>
                        <span className="font-semibold">
                          {formatCurrency(calculatePaidAmount(selectedOrder))}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Kalan</span>
                        <span className="text-primary-600">
                          {formatCurrency(calculateOrderTotal(selectedOrder) - calculatePaidAmount(selectedOrder))}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Yöntemi
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setPaymentMethod('CASH')}
                          className={`py-2 rounded-lg border-2 transition ${
                            paymentMethod === 'CASH'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          💵 Nakit
                        </button>
                        <button
                          onClick={() => setPaymentMethod('CREDIT_CARD')}
                          className={`py-2 rounded-lg border-2 transition ${
                            paymentMethod === 'CREDIT_CARD'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          💳 Kredi
                        </button>
                        <button
                          onClick={() => setPaymentMethod('DEBIT_CARD')}
                          className={`py-2 rounded-lg border-2 transition ${
                            paymentMethod === 'DEBIT_CARD'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          💳 Banka
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ödeme Tutarı
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <Button
                      onClick={handlePayment}
                      className="w-full py-4 text-lg"
                      disabled={!paymentAmount || Number(paymentAmount) <= 0}
                    >
                      Ödeme Al
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Ödeme almak için bir sipariş seçin
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
