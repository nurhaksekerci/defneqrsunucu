'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  price: string;
  stockQuantity?: number | null;
  _count?: { sales: number };
}

interface ReportItem {
  productId: string;
  productName: string;
  sku?: string | null;
  totalQuantity: number;
  totalAmount: number;
  saleCount: number;
}

interface Sale {
  id: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  soldAt: string;
  product: { name: string };
}

export default function ProductsPage() {
  const params = useParams();
  const businessId = params.id as string;
  const [businessName, setBusinessName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<{ id: string; fullName: string; phone: string }[]>([]);
  const [report, setReport] = useState<{ report: ReportItem[]; grandTotal: number; recentSales: Sale[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'report'>('products');
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', stockQuantity: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saleModal, setSaleModal] = useState<{ product: Product } | null>(null);
  const [saleForm, setSaleForm] = useState({ quantity: '1', customerId: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  const now = new Date();
  const [dateRange, setDateRange] = useState({
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadProducts();
  }, [businessId]);

  useEffect(() => {
    if (activeTab === 'report') loadReport();
  }, [businessId, activeTab, dateRange]);

  const loadProducts = async () => {
    try {
      const [bizRes, prodRes] = await Promise.all([
        api.get(`/businesses/${businessId}`),
        api.get(`/businesses/${businessId}/products`),
      ]);
      if (bizRes.data.success) setBusinessName(bizRes.data.data.name);
      setProducts(prodRes.data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/products/report`, {
        params: { start: dateRange.start, end: dateRange.end },
      });
      if (res.data.success) setReport(res.data.data);
    } catch {
      setReport(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;
    const price = parseFloat(productForm.price);
    if (isNaN(price) || price < 0) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/businesses/${businessId}/products/${editingId}`, {
          name: productForm.name,
          sku: productForm.sku || undefined,
          price,
          stockQuantity: productForm.stockQuantity ? parseInt(productForm.stockQuantity, 10) : undefined,
        });
      } else {
        await api.post(`/businesses/${businessId}/products`, {
          name: productForm.name,
          sku: productForm.sku || undefined,
          price,
          stockQuantity: productForm.stockQuantity ? parseInt(productForm.stockQuantity, 10) : undefined,
        });
      }
      setProductForm({ name: '', sku: '', price: '', stockQuantity: '' });
      setEditingId(null);
      loadProducts();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Kayıt yapılamadı');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      sku: p.sku || '',
      price: p.price,
      stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/businesses/${businessId}/products/${id}`);
      loadProducts();
    } catch {
      alert('Silinemedi');
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleModal) return;
    const qty = parseInt(saleForm.quantity, 10);
    if (!qty || qty < 1) return;
    setIsSaving(true);
    try {
      await api.post(`/businesses/${businessId}/products/sales`, {
        productId: saleModal.product.id,
        quantity: qty,
        unitPrice: saleModal.product.price,
        customerId: saleForm.customerId || undefined,
        notes: saleForm.notes || undefined,
      });
      setSaleModal(null);
      setSaleForm({ quantity: '1', customerId: '', notes: '' });
      loadProducts();
      if (activeTab === 'report') loadReport();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Satış kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const formatMoney = (v: number | string) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(v));

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <Link
        href={`/dashboard/business/${businessId}`}
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {businessName || 'İşletme'} detayına dön
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ürün Yönetimi</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'products' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Ürünler
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'report' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Satış Raporu
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProduct} className="flex flex-wrap gap-4">
                <Input
                  placeholder="Ürün adı"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="min-w-[180px]"
                  required
                />
                <Input
                  placeholder="Stok kodu (SKU)"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className="w-28"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Fiyat"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="w-28"
                  required
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Stok (opsiyonel)"
                  value={productForm.stockQuantity}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                  className="w-24"
                />
                <Button type="submit" size="sm" isLoading={isSaving} disabled={!productForm.name}>
                  {editingId ? 'Güncelle' : 'Ekle'}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingId(null); setProductForm({ name: '', sku: '', price: '', stockQuantity: '' }); }}>
                    İptal
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ürün Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-gray-500 py-4">Henüz ürün yok.</p>
              ) : (
                <div className="space-y-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{p.name}</span>
                        {p.sku && <span className="text-gray-500 ml-2">({p.sku})</span>}
                        <span className="text-primary-600 font-medium ml-2">{formatMoney(p.price)}</span>
                        {p.stockQuantity != null && (
                          <span className="text-sm text-gray-500 ml-2">Stok: {p.stockQuantity}</span>
                        )}
                        {((p._count?.sales) ?? 0) > 0 && (
                          <span className="text-sm text-gray-400 ml-2">· {p._count?.sales} satış</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSaleModal({ product: p })}>
                          Satış
                        </Button>
                        <button onClick={() => handleEdit(p)} className="text-sm text-primary-600 hover:text-primary-700">
                          Düzenle
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:text-red-700">
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'report' && (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((r) => ({ ...r, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((r) => ({ ...r, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ürün Bazlı Satış</CardTitle>
                  <p className="text-sm text-gray-500">Toplam: {formatMoney(report.grandTotal)}</p>
                </CardHeader>
                <CardContent>
                  {report.report.length === 0 ? (
                    <p className="text-gray-500 py-4">Bu dönemde satış yok.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.report.map((r) => (
                        <div key={r.productId} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="font-medium">{r.productName}</span>
                          <span>{r.totalQuantity} adet · {formatMoney(r.totalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Son Satışlar</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.recentSales.length === 0 ? (
                    <p className="text-gray-500 py-4">Bu dönemde satış yok.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.recentSales.map((s) => (
                        <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                          <span>{s.product.name} × {s.quantity}</span>
                          <span>{formatMoney(s.totalAmount)}</span>
                          <span className="text-gray-500">{new Date(s.soldAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {saleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader className="flex flex-row justify-between">
                <CardTitle>Satış Kaydet — {saleModal.product.name}</CardTitle>
                <button onClick={() => setSaleModal(null)} className="text-gray-500 hover:text-gray-700">✕</button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecordSale} className="space-y-4">
                  <Input
                    type="number"
                    min={1}
                    label="Miktar"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  />
                  <p className="text-sm text-gray-600">
                    Birim: {formatMoney(saleModal.product.price)} · Toplam: {formatMoney(Number(saleModal.product.price) * parseInt(saleForm.quantity || '1', 10))}
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri (opsiyonel)</label>
                    <select
                      value={saleForm.customerId}
                      onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Seçin</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    placeholder="Not (opsiyonel)"
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={isSaving} disabled={!saleForm.quantity}>
                      Kaydet
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setSaleModal(null)}>
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
