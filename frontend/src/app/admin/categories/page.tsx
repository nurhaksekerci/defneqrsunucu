'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description?: string;
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0
  });
  const [isSaving, setIsSaving] = useState(false);

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

      setFormData({ name: '', description: '', order: 0 });
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
      order: category.order
    });
    setShowAddForm(true);
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
          setFormData({ name: '', description: '', order: 0 });
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
              <Button onClick={() => setShowAddForm(true)}>
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
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
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
                    <div className="flex gap-2">
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
