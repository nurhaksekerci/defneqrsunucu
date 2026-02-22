'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGlobalCatalog, setShowGlobalCatalog] = useState(false);
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast state (simpler approach without hook)
  const [toastData, setToastData] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadCategories();
    }
  }, [selectedRestaurant]);

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/my');
      const restaurantList = response.data.data;
      setRestaurants(restaurantList);
      
      if (restaurantList.length > 0) {
        setSelectedRestaurant(restaurantList[0].id);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/categories', {
        params: { restaurantId: selectedRestaurant }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalCategories = async () => {
    try {
      // Global kategorileri ve ürünleri al
      const categoriesRes = await api.get('/categories?isGlobal=true');
      const productsRes = await api.get('/products?isGlobal=true');
      
      const cats = categoriesRes.data.data || [];
      const prods = productsRes.data.data || [];
      
      // Restorana ait kategori isimlerini al (zaten kopyalanmış olanlar)
      const existingCategoryNames = categories.map(c => c.name.toLowerCase());
      
      // Henüz kopyalanmamış kategorileri filtrele
      const availableCats = cats.filter((cat: any) => 
        !existingCategoryNames.includes(cat.name.toLowerCase())
      );
      
      // Kategorilere ürünleri ekle
      const catsWithProducts = availableCats.map((cat: any) => ({
        ...cat,
        products: prods.filter((p: any) => p.categoryId === cat.id)
      }));
      
      setGlobalCategories(catsWithProducts);
      setShowGlobalCatalog(true);
    } catch (error) {
      console.error('Failed to load global categories:', error);
      alert('Global kategoriler yüklenemedi.');
    }
  };

  const copyFromGlobal = async (globalCategory: any, productPrices: Record<string, number>, productActiveStates: Record<string, boolean>) => {
    try {
      // Yeni API endpoint'ini kullan
      await api.post('/categories/copy-category-with-products', {
        categoryId: globalCategory.id,
        restaurantId: selectedRestaurant,
        productPrices: productPrices,
        productActiveStates: productActiveStates
      });

      setShowGlobalCatalog(false);
      loadCategories();
      
      const activeCount = Object.values(productActiveStates).filter(v => v).length;
      const passiveCount = globalCategory.products.length - activeCount;
      setToastData({ 
        type: 'success', 
        title: 'Başarılı', 
        message: `Kategori başarıyla kopyalandı! ${activeCount} aktif, ${passiveCount} pasif ürün eklendi.` 
      });
    } catch (error: any) {
      console.error('Failed to copy category:', error);
      
      // Plan limiti hatası kontrolü (403)
      if (error.response?.status === 403) {
        const errorData = error.response?.data;
        const message = errorData?.message || 'Plan limitinize ulaştınız!';
        const limitInfo = errorData?.data;
        
        let alertMessage = `⚠️ ${message}`;
        
        if (limitInfo) {
          alertMessage += `\n\n📊 Limit Bilgileri:`;
          alertMessage += `\n• Kullanılan: ${limitInfo.currentCount}/${limitInfo.maxCount}`;
          alertMessage += `\n• Plan: ${limitInfo.planName}`;
          alertMessage += `\n\n💡 Daha fazla ${message.includes('kategori') ? 'kategori' : 'ürün'} eklemek için planınızı yükseltin.`;
        }
        
        setToastData({
          type: 'warning',
          title: 'Plan Limiti Aşıldı',
          message,
          details: limitInfo ? {
            currentCount: limitInfo.currentCount,
            maxCount: limitInfo.maxCount,
            planName: limitInfo.planName
          } : undefined
        });
      } else {
        const errorMessage = error.response?.data?.message || 'Kategori kopyalanamadı. Lütfen tekrar deneyin.';
        setToastData({ type: 'error', title: 'Hata', message: errorMessage });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          ...formData,
          restaurantId: selectedRestaurant
        });
      } else {
        await api.post('/categories', {
          ...formData,
          restaurantId: selectedRestaurant
        });
      }

      setFormData({ name: '', description: '', order: 0 });
      setShowAddForm(false);
      setEditingCategory(null);
      loadCategories();
      setToastData({ type: 'success', title: 'Başarılı', message: 'Kategori başarıyla kaydedildi!' });
    } catch (error: any) {
      console.error('Failed to save category:', error);
      
      // Plan limiti hatası kontrolü (403)
      if (error.response?.status === 403) {
        const errorData = error.response?.data;
        const message = errorData?.message || 'Plan limitinize ulaştınız!';
        const limitInfo = errorData?.data;
        
        setToastData({
          type: 'warning',
          title: 'Plan Limiti Aşıldı',
          message,
          details: limitInfo ? {
            currentCount: limitInfo.currentCount,
            maxCount: limitInfo.maxCount,
            planName: limitInfo.planName
          } : undefined
        });
      } else {
        const errorMessage = error.response?.data?.message || 'Kategori kaydedilemedi. Lütfen tekrar deneyin.';
        setToastData({ type: 'error', title: 'Hata', message: errorMessage });
      }
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
    let message = 'Bu kategoriyi silmek istediğinizden emin misiniz?';
    
    if (productCount > 0) {
      message = `Bu kategoride ${productCount} adet ürün var. Kategoriyi sildiğinizde bu ürünler de silinecektir. Devam etmek istiyor musunuz?`;
    }

    if (!confirm(message)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.data.success) {
        setToastData({ type: 'success', title: 'Başarılı', message: response.data.message || 'Kategori başarıyla silindi' });
      }
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      const errorMessage = error.response?.data?.message || 'Kategori silinemedi. Lütfen tekrar deneyin.';
      setToastData({ type: 'error', title: 'Hata', message: errorMessage });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Restoran Bulunamadı
              </h2>
              <p className="text-gray-600 mb-6">
                Kategori eklemek için önce bir restoran oluşturmalısınız.
              </p>
              <a
                href="/dashboard/restaurant/create"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Restoran Oluştur
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategori Yönetimi</h1>
          <p className="text-gray-600">Menü kategorilerinizi yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadGlobalCategories}>
            📦 Global Katalogdan Ekle
          </Button>
          <Button onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', description: '', order: 0 });
            setShowAddForm(true);
          }}>
            + Yeni Kategori Ekle
          </Button>
        </div>
      </div>

      {restaurants.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restoran Seçin
          </label>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Modal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
      >
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
      </Modal>

      <Card>
        <CardHeader>
          <CardTitle>Kategoriler ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Henüz kategori eklenmemiş</p>
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
                        <p className="text-xs text-gray-400">Sıra: {category.order}</p>
                        {category._count && category._count.products > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {category._count.products} ürün
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/dashboard/products?categoryId=${category.id}`}>
                        <Button size="sm" variant="ghost">
                          📦 Ürünleri Gör
                        </Button>
                      </a>
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

      {/* Global Katalog Modal */}
      {showGlobalCatalog && (
        <GlobalCatalogModal 
          globalCategories={globalCategories}
          onClose={() => setShowGlobalCatalog(false)}
          onCopy={copyFromGlobal}
        />
      )}
    </div>
  );
}

// Global Katalog Modal Component
function GlobalCatalogModal({ 
  globalCategories, 
  onClose, 
  onCopy 
}: { 
  globalCategories: any[]; 
  onClose: () => void;
  onCopy: (category: any, prices: Record<string, number>, activeStates: Record<string, boolean>) => Promise<void>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  const [productActiveStates, setProductActiveStates] = useState<Record<string, boolean>>({});
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyCategory = async (category: any) => {
    if (!category.products || category.products.length === 0) {
      // Ürün yoksa direkt kopyala
      await onCopy(category, {}, {});
      return;
    }

    setSelectedCategory(category);
    // Default fiyatları ve durumları ayarla
    const defaultPrices: Record<string, string> = {};
    const defaultActiveStates: Record<string, boolean> = {};
    category.products.forEach((p: any) => {
      defaultPrices[p.id] = '';
      defaultActiveStates[p.id] = true; // Default: Aktif
    });
    setProductPrices(defaultPrices);
    setProductActiveStates(defaultActiveStates);
  };

  const handleConfirmCopy = async () => {
    if (!selectedCategory) return;

    // Sadece aktif ürünler için fiyat kontrolü
    const prices: Record<string, number> = {};
    let hasError = false;

    for (const product of selectedCategory.products) {
      const isActive = productActiveStates[product.id];
      
      if (isActive) {
        // Aktif ürünler için fiyat zorunlu
        const priceStr = productPrices[product.id];
        if (!priceStr || isNaN(parseFloat(priceStr))) {
          alert(`"${product.name}" aktif durumda. Lütfen fiyat belirleyin.`);
          hasError = true;
          break;
        }
        prices[product.id] = parseFloat(priceStr);
      } else {
        // Pasif ürünler için fiyat 0
        prices[product.id] = 0;
      }
    }

    if (hasError) return;

    setIsCopying(true);
    try {
      // Backend'e ürün durumlarını da gönder
      await onCopy(selectedCategory, prices, productActiveStates);
      setSelectedCategory(null);
      setProductPrices({});
      setProductActiveStates({});
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {selectedCategory ? `Fiyat Belirle: ${selectedCategory.name}` : 'Global Kategori Katalogu'}
            </CardTitle>
            <button
              onClick={() => {
                if (selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  onClose();
                }
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              {selectedCategory ? '←' : '×'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh]">
          {!selectedCategory ? (
            // Kategori Listesi
            globalCategories.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">✅</span>
                <p className="text-gray-700 font-medium mb-2">Tüm Kategoriler Kopyalandı</p>
                <p className="text-sm text-gray-500">
                  Global katalogdaki tüm kategoriler restoranınıza zaten eklenmiş.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {globalCategories.map((category: any) => (
                  <Card key={category.id} className="border-2 hover:border-primary-500 transition">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleCopyCategory(category)}>
                          Kopyala
                        </Button>
                      </div>
                      
                      {category.products && category.products.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 font-medium mb-2">
                            📦 {category.products.length} Ürün İçerir:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {category.products.map((product: any) => (
                              <div key={product.id} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                                • {product.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Fiyat Belirleme Formu
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 İpucu:</strong> Satmak istemediğiniz ürünleri pasif yapabilirsiniz. 
                  Sadece aktif ürünler için fiyat girmeniz gerekir.
                </p>
              </div>

              {selectedCategory.products.map((product: any) => {
                const isActive = productActiveStates[product.id];
                return (
                  <div 
                    key={product.id} 
                    className={`border rounded-lg p-4 transition ${
                      isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-sm text-gray-600">{product.description}</p>
                        )}
                      </div>
                      
                      {/* Aktif/Pasif Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setProductActiveStates({
                            ...productActiveStates,
                            [product.id]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Fiyat Input - Sadece aktif ürünler için zorunlu */}
                    {isActive && (
                      <div className="w-full">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Fiyat girin (₺)"
                          value={productPrices[product.id] || ''}
                          onChange={(e) => setProductPrices({
                            ...productPrices,
                            [product.id]: e.target.value
                          })}
                          label="Fiyat (₺)"
                          required
                        />
                      </div>
                    )}
                    
                    {!isActive && (
                      <p className="text-sm text-gray-500 italic">
                        Bu ürün pasif olarak eklenecek (fiyat girilmeyecek)
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t pt-4">
                <Button 
                  onClick={handleConfirmCopy}
                  isLoading={isCopying}
                  className="flex-1"
                >
                  Kategori ve Ürünleri Kopyala
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setSelectedCategory(null)}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Notification */}
      {toastData && (
        <Toast
          type={toastData.type}
          title={toastData.title}
          message={toastData.message}
          details={toastData.details}
          onClose={() => setToastData(null)}
        />
      )}
    </div>
  );
}
