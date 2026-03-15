'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageHelper';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[] | null;
  order: number;
  isGlobal: boolean;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{ name: string; description: string; order: number; images: string[] }>({
    name: '',
    description: '',
    order: 0,
    images: []
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories?isGlobal=true');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          ...formData,
          isGlobal: true
        });
      } else {
        await api.post('/categories', {
          ...formData,
          isGlobal: true
        });
      }

      setFormData({ name: '', description: '', order: 0, images: [] });
      setNewImageUrl('');
      setShowAddForm(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Kategori kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      order: category.order,
      images: Array.isArray(category.images) ? category.images : (category.image ? [category.image] : [])
    });
    setNewImageUrl('');
    setShowAddForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya 5MB\'dan küçük olmalı');
      return;
    }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) setFormData((f) => ({ ...f, images: [...(f.images || []), res.data.data.url] }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Yükleme başarısız');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, category: Category) => {
    const productCount = category._count?.products || 0;
    let message = 'Bu global kategoriyi silmek istediğinizden emin misiniz? Bu kategoriyi kullanan tüm restoranlar etkilenecektir.';
    
    if (productCount > 0) {
      message = `Bu kategoride ${productCount} adet ürün var. Kategoriyi sildiğinizde bu ürünler de silinecektir. Devam etmek istiyor musunuz?`;
    }

    if (!confirm(message)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.success) {
        alert(response.data.message || 'Kategori başarıyla silindi');
      }
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      const errorMessage = error.response?.data?.message || 'Kategori silinemedi. Lütfen tekrar deneyin.';
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Kategori Yönetimi</h1>
          <p className="text-gray-600">Tüm restoranlar için geçerli olan kategorileri yönetin</p>
        </div>
        <Button onClick={() => {
          setEditingCategory(null);
          setFormData({ name: '', description: '', order: 0, images: [] });
          setNewImageUrl('');
          setShowAddForm(true);
        }}>
          + Yeni Kategori Ekle
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Global Kategori Ekle'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Kategori Adı"
                type="text"
                placeholder="Örn: Sıcak İçecekler"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  placeholder="Kategori açıklaması..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Görselleri</label>
                <p className="text-xs text-gray-500 mb-2">Menü şablonlarında kategorinin üstünde gösterilir (en fazla 4)</p>
                <div className="flex gap-2 mb-2">
                  <label className="flex-1 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-primary-500 text-sm text-gray-600">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                    {isUploading ? 'Yükleniyor...' : '📷 Görsel Yükle'}
                  </label>
                  <Input
                    type="url"
                    placeholder="URL ekle"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const url = newImageUrl.trim();
                      if (url && (formData.images?.length ?? 0) < 4) {
                        setFormData((f) => ({ ...f, images: [...(f.images || []), url] }));
                        setNewImageUrl('');
                      }
                    }}
                  >
                    Ekle
                  </Button>
                </div>
                {(formData.images?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(formData.images || []).slice(0, 4).map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={getImageUrl(url) || url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, images: (f.images || []).filter((_, j) => j !== i) }))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="Sıralama"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={isSaving}>
                  {editingCategory ? 'Güncelle' : 'Ekle'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCategory(null);
                    setNewImageUrl('');
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Global Kategoriler ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Henüz global kategori eklenmemiş</p>
              <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', description: '', order: 0, images: [] }); setNewImageUrl(''); setShowAddForm(true); }}>
                İlk Kategoriyi Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {(Array.isArray(category.images) ? category.images : category.image ? [category.image] : []).length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {(Array.isArray(category.images) ? category.images : [category.image!]).slice(0, 3).map((url, i) => (
                            <img key={i} src={getImageUrl(url) || url} alt="" className="w-12 h-12 object-cover rounded border" />
                          ))}
                        </div>
                      )}
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                      <div className="flex gap-2 items-center mt-1">
                        <p className="text-xs text-gray-400">Sıra: {category.order} • Global Kategori</p>
                        {category._count && category._count.products > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {category._count.products} ürün
                          </span>
                        )}
                      </div>
                    </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(category)}>
                        Düzenle
                      </Button>
                      <button
                        onClick={() => handleDelete(category.id, category)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 İpucu:</strong> Global kategoriler tüm restoranlar tarafından görülebilir ve kullanılabilir. 
          Restoranlar bu kategorileri kopyalayıp kendi ihtiyaçlarına göre özelleştirebilir.
        </p>
      </div>
    </div>
  );
}
