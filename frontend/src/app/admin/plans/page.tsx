'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  type: 'FREE' | 'PREMIUM' | 'CUSTOM';
  price: number;
  duration: number;
  maxRestaurants: number;
  maxCategories: number;
  maxProducts: number;
  canRemoveBranding: boolean;
  hasGlobalCatalog: boolean;
  hasDetailedReports: boolean;
  isPopular: boolean;
  extraRestaurantPrice: number;
  description: string | null;
  features: any;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'FREE' as 'FREE' | 'PREMIUM' | 'CUSTOM',
    price: 0,
    duration: 365,
    maxRestaurants: 1,
    maxCategories: 5,
    maxProducts: 20,
    canRemoveBranding: false,
    hasGlobalCatalog: true,
    hasDetailedReports: true,
    isPopular: false,
    extraRestaurantPrice: 0,
    description: '',
    features: [] as string[]
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        features: JSON.stringify(formData.features)
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        alert('Plan başarıyla güncellendi');
      } else {
        await api.post('/plans', payload);
        alert('Plan başarıyla oluşturuldu');
      }

      setShowForm(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      price: plan.price,
      duration: plan.duration,
      maxRestaurants: plan.maxRestaurants,
      maxCategories: plan.maxCategories,
      maxProducts: plan.maxProducts,
      canRemoveBranding: plan.canRemoveBranding,
      hasGlobalCatalog: plan.hasGlobalCatalog,
      hasDetailedReports: plan.hasDetailedReports,
      isPopular: plan.isPopular,
      extraRestaurantPrice: plan.extraRestaurantPrice,
      description: plan.description || '',
      features: plan.features ? JSON.parse(plan.features) : []
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu planı silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/plans/${id}`);
      alert('Plan başarıyla silindi');
      loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const handleSeedPlans = async () => {
    try {
      await api.post('/plans/seed');
      alert('Default planlar oluşturuldu');
      loadPlans();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'FREE',
      price: 0,
      duration: 365,
      maxRestaurants: 1,
      maxCategories: 5,
      maxProducts: 20,
      canRemoveBranding: false,
      hasGlobalCatalog: true,
      hasDetailedReports: true,
      isPopular: false,
      extraRestaurantPrice: 0,
      description: '',
      features: []
    });
  };

  const getPlanTypeName = (type: string) => {
    const types = {
      FREE: 'Ücretsiz',
      PREMIUM: 'Premium',
      CUSTOM: 'Kurumsal'
    };
    return types[type as keyof typeof types] || type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plan Yönetimi</h1>
            <p className="text-gray-600 mt-2">Abonelik planlarını yönetin</p>
          </div>
          <div className="flex gap-3">
            {plans.length === 0 && (
              <Button onClick={handleSeedPlans} variant="secondary">
                Default Planları Oluştur
              </Button>
            )}
            <Button onClick={() => { resetForm(); setEditingPlan(null); setShowForm(!showForm); }}>
              {showForm ? 'İptal' : '+ Yeni Plan'}
            </Button>
          </div>
        </div>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingPlan ? 'Plan Düzenle' : 'Yeni Plan Oluştur'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Input
                  label="Plan Adı"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Tipi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="FREE">Ücretsiz</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="CUSTOM">Kurumsal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <Input
                  label="Fiyat (₺)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Ek İşletme Ücreti (₺)"
                  type="number"
                  value={formData.extraRestaurantPrice}
                  onChange={(e) => setFormData({ ...formData, extraRestaurantPrice: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Süre (Gün)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 365 })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <Input
                  label="Max İşletme"
                  type="number"
                  value={formData.maxRestaurants}
                  onChange={(e) => setFormData({ ...formData, maxRestaurants: parseInt(e.target.value) || 1 })}
                  required
                />
                <Input
                  label="Max Kategori"
                  type="number"
                  value={formData.maxCategories}
                  onChange={(e) => setFormData({ ...formData, maxCategories: parseInt(e.target.value) || 5 })}
                  required
                />
                <Input
                  label="Max Ürün"
                  type="number"
                  value={formData.maxProducts}
                  onChange={(e) => setFormData({ ...formData, maxProducts: parseInt(e.target.value) || 20 })}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm font-medium text-gray-700">⭐ Popüler Plan (ana sayfada vurgulu gösterilir)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.canRemoveBranding}
                    onChange={(e) => setFormData({ ...formData, canRemoveBranding: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Powered by kaldırma izni</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.hasGlobalCatalog}
                    onChange={(e) => setFormData({ ...formData, hasGlobalCatalog: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Global Katalog erişimi</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.hasDetailedReports}
                    onChange={(e) => setFormData({ ...formData, hasDetailedReports: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Detaylı raporlar</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  {editingPlan ? 'Güncelle' : 'Oluştur'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingPlan(null); resetForm(); }}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`${!plan.isActive ? 'opacity-50' : ''} ${plan.isPopular ? 'border-2 border-yellow-400 shadow-lg' : ''} relative`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold shadow-md">
                  ⭐ POPÜLER
                </span>
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{getPlanTypeName(plan.type)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">₺{plan.price.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-gray-600">{plan.duration} gün</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-700">🏢 <span className="font-medium">{plan.maxRestaurants === 999999 ? 'Sınırsız' : plan.maxRestaurants}</span> İşletme</p>
                <p className="text-sm text-gray-700">📁 <span className="font-medium">{plan.maxCategories === 999999 ? 'Sınırsız' : plan.maxCategories}</span> Kategori</p>
                <p className="text-sm text-gray-700">📦 <span className="font-medium">{plan.maxProducts === 999999 ? 'Sınırsız' : plan.maxProducts}</span> Ürün</p>
                {plan.extraRestaurantPrice > 0 && (
                  <p className="text-sm text-blue-600">💰 +₺{plan.extraRestaurantPrice.toLocaleString('tr-TR')} / ek işletme</p>
                )}
                {plan.canRemoveBranding && <p className="text-sm text-green-600">✓ Powered by kaldırma</p>}
                {plan.hasGlobalCatalog && <p className="text-sm text-green-600">✓ Global Katalog</p>}
                {plan.hasDetailedReports && <p className="text-sm text-green-600">✓ QR Tarama İstatistikleri</p>}
              </div>
              {plan.description && (
                <p className="text-sm text-gray-600 mb-4 italic">{plan.description}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(plan)}>Düzenle</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(plan.id)}>Sil</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
