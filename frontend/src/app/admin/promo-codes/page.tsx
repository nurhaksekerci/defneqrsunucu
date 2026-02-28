'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';

interface PromoCode {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_TRIAL';
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  applicablePlans: string[] | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  _count?: {
    usages: number;
  };
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'FREE_TRIAL',
    discountValue: '',
    maxUses: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    description: ''
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/promo-codes');
      setPromoCodes(response.data.data);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code,
        type: formData.type,
        discountValue: parseFloat(formData.discountValue),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || null,
        description: formData.description || null
      };

      if (editingCode) {
        await api.put(`/promo-codes/${editingCode.id}`, payload);
      } else {
        await api.post('/promo-codes', payload);
      }

      setShowAddForm(false);
      setEditingCode(null);
      resetForm();
      loadPromoCodes();
    } catch (error: any) {
      console.error('Failed to save promo code:', error);
      alert(error.response?.data?.message || 'Promosyon kodu kaydedilemedi');
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      type: code.type,
      discountValue: code.discountValue.toString(),
      maxUses: code.maxUses?.toString() || '',
      validFrom: code.validFrom.split('T')[0],
      validUntil: code.validUntil ? code.validUntil.split('T')[0] : '',
      description: code.description || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu promosyon kodunu silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/promo-codes/${id}`);
      loadPromoCodes();
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      alert('Promosyon kodu silinemedi');
    }
  };

  const toggleActive = async (code: PromoCode) => {
    try {
      await api.put(`/promo-codes/${code.id}`, {
        isActive: !code.isActive
      });
      loadPromoCodes();
    } catch (error) {
      console.error('Failed to toggle promo code:', error);
      alert('Durum güncellenemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      discountValue: '',
      maxUses: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      description: ''
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      PERCENTAGE: '% İndirim',
      FIXED: '₺ Sabit İndirim',
      FREE_TRIAL: 'Ücretsiz Deneme'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎟️ Promosyon Kodları</h1>
          <p className="text-gray-600 mt-2">İndirim kodları oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingCode(null);
          setShowAddForm(true);
        }}>
          + Yeni Kod Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-primary-600">
                {promoCodes.length}
              </p>
              <p className="text-gray-600 mt-2">Toplam Kod</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-green-600">
                {promoCodes.filter(p => p.isActive).length}
              </p>
              <p className="text-gray-600 mt-2">Aktif Kod</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-blue-600">
                {promoCodes.reduce((sum, p) => sum + (p._count?.usages || 0), 0)}
              </p>
              <p className="text-gray-600 mt-2">Toplam Kullanım</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-yellow-600">
                {promoCodes.filter(p => {
                  const usageCount = p._count?.usages ?? p.usedCount;
                  return p.maxUses && usageCount >= p.maxUses;
                }).length}
              </p>
              <p className="text-gray-600 mt-2">Limit Dolmuş</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Promosyon Kodları</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Henüz promosyon kodu eklenmemiş</p>
              <Button onClick={() => setShowAddForm(true)}>İlk Kodu Ekle</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İndirim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanım</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Geçerlilik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {promoCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-gray-100 text-primary-600 font-bold rounded text-sm">
                            {code.code}
                          </code>
                        </div>
                        {code.description && (
                          <p className="text-xs text-gray-500 mt-1">{code.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getTypeLabel(code.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">
                        {code.type === 'PERCENTAGE' 
                          ? `%${code.discountValue}` 
                          : code.type === 'FIXED'
                          ? `₺${code.discountValue}`
                          : `${code.discountValue} gün`
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {code._count?.usages ?? code.usedCount} / {code.maxUses || '∞'}
                        </div>
                        {code.maxUses && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className={`h-1.5 rounded-full ${
                                (code._count?.usages ?? code.usedCount) >= code.maxUses ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(((code._count?.usages ?? code.usedCount) / code.maxUses) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{formatDate(code.validFrom)}</div>
                        {code.validUntil && (
                          <div className="text-xs">→ {formatDate(code.validUntil)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(code)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            code.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {code.isActive ? '✓ Aktif' : '✗ Pasif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(code)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(code.id)}
                          >
                            Sil
                          </Button>
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingCode(null);
          resetForm();
        }}
        title={editingCode ? 'Promosyon Kodunu Düzenle' : 'Yeni Promosyon Kodu'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod *
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="YILBASI2026"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Sadece harf, rakam, tire ve alt çizgi kullanın
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                required
              >
                <option value="PERCENTAGE">% İndirim</option>
                <option value="FIXED">₺ Sabit İndirim</option>
                <option value="FREE_TRIAL">Ücretsiz Deneme (gün)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İndirim Değeri *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.type === 'PERCENTAGE' ? '10' : '100'}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'PERCENTAGE' && '0-100 arası yüzde değeri'}
                {formData.type === 'FIXED' && 'TL cinsinden tutar'}
                {formData.type === 'FREE_TRIAL' && 'Gün sayısı'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Kullanım
              </label>
              <Input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="Boş = sınırsız"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Tarihi *
              </label>
              <Input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                placeholder="Boş = süresiz"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                rows={3}
                placeholder="İç kullanım için not"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingCode ? 'Güncelle' : 'Oluştur'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddForm(false);
                setEditingCode(null);
                resetForm();
              }}
            >
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
