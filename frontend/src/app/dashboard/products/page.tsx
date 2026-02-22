'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageHelper';

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number | null;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  products: Product[];
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryIdFromUrl = searchParams.get('categoryId');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryIdFromUrl || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGlobalCatalog, setShowGlobalCatalog] = useState(false);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    basePrice: '',
    categoryId: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Bulk price update için
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadProducts();
      loadCategories();
    }
  }, [selectedRestaurant]);

  // URL'den gelen categoryId ile selectedCategory'yi senkronize et
  useEffect(() => {
    if (categoryIdFromUrl && categoryIdFromUrl !== selectedCategory) {
      setSelectedCategory(categoryIdFromUrl);
    }
  }, [categoryIdFromUrl]);

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
      const response = await api.get('/categories', {
        params: { restaurantId: selectedRestaurant }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/products', {
        params: { restaurantId: selectedRestaurant }
      });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalProducts = async () => {
    try {
      // Restoranın kategorilerini al
      const categoriesRes = await api.get(`/categories?restaurantId=${selectedRestaurant}`);
      const restaurantCategories = categoriesRes.data.data || [];
      setGlobalCategories(restaurantCategories);

      // Global kategori ID'lerini al (restoranın global kategorilerden kopyaladıkları)
      const globalCategoryNames = restaurantCategories.map((c: any) => c.name);
      
      // Tüm global ürünleri al
      const productsRes = await api.get('/products?isGlobal=true');
      const allGlobalProducts = productsRes.data.data || [];
      
      // Sadece restoranın kategorilerine ait ve henüz kopyalanmamış ürünleri filtrele
      const existingProductNames = products.map(p => p.name.toLowerCase());
      
      const filteredProducts = allGlobalProducts.filter((gp: any) => {
        const isInRestaurantCategory = globalCategoryNames.includes(gp.category.name);
        const isNotCopied = !existingProductNames.includes(gp.name.toLowerCase());
        return isInRestaurantCategory && isNotCopied;
      });
      
      setGlobalProducts(filteredProducts);
      setShowGlobalCatalog(true);
    } catch (error) {
      console.error('Failed to load global products:', error);
      alert('Global ürünler yüklenemedi.');
    }
  };

  const toggleProductActive = async (productId: string, currentStatus: boolean) => {
    try {
      // Önce state'i güncelle (Optimistic Update)
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === productId ? { ...p, isActive: !currentStatus } : p
        )
      );

      // Sonra backend'e gönder
      await api.put(`/products/${productId}`, {
        isActive: !currentStatus
      });
    } catch (error) {
      console.error('Failed to toggle product:', error);
      alert('Ürün durumu değiştirilemedi. Lütfen tekrar deneyin.');
      // Hata olursa geri al
      loadProducts();
    }
  };

  const handlePriceChange = (productId: string, newPrice: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [productId]: newPrice
    }));
    setHasChanges(true);
  };

  const handleBulkPriceUpdate = async () => {
    if (!hasChanges || Object.keys(editedPrices).length === 0) return;

    try {
      setIsSaving(true);
      
      // Her ürün için fiyat güncellemesi yap
      const updates = Object.entries(editedPrices).map(([productId, price]) => {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
          throw new Error(`Geçersiz fiyat: ${price}`);
        }
        return api.put(`/products/${productId}`, { basePrice: numPrice });
      });

      await Promise.all(updates);
      
      setEditedPrices({});
      setHasChanges(false);
      loadProducts();
      alert('Fiyatlar başarıyla güncellendi!');
    } catch (error: any) {
      console.error('Failed to update prices:', error);
      alert(error.message || 'Fiyatlar güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoriesWithProducts = (): Category[] => {
    const categoryMap = new Map<string, Category>();
    
    // Filtrelenmiş ürünleri kullan
    filteredProducts.forEach(product => {
      const catId = product.category.id;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: catId,
          name: product.category.name,
          products: []
        });
      }
      categoryMap.get(catId)!.products.push(product);
    });
    
    return Array.from(categoryMap.values());
  };

  const copyFromGlobal = async (globalProduct: any) => {
    // Ürünün kategorisinin restorana kopyalanmış versiyonunu bul
    const matchingCategory = categories.find(c => c.name === globalProduct.category.name);
    
    if (!matchingCategory) {
      alert(`"${globalProduct.category.name}" kategorisi restoranınızda bulunamadı!`);
      return;
    }

    const price = prompt(`"${globalProduct.name}" ürünü için fiyat belirleyin (₺):`);
    if (!price || isNaN(parseFloat(price))) {
      return;
    }

    try {
      await api.post('/products', {
        name: globalProduct.name,
        description: globalProduct.description,
        image: globalProduct.image,
        basePrice: parseFloat(price),
        categoryId: matchingCategory.id,
        restaurantId: selectedRestaurant
      });

      setShowGlobalCatalog(false);
      loadProducts();
      alert('Ürün başarıyla kopyalandı!');
    } catch (error) {
      console.error('Failed to copy product:', error);
      alert('Ürün kopyalanamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        restaurantId: selectedRestaurant
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }

      setFormData({ name: '', description: '', image: '', basePrice: '', categoryId: '' });
      setShowAddForm(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Ürün kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir');
      return;
    }

    setIsUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('image', file);

      const response = await api.post('/upload/image', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, image: response.data.data.url }));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Dosya yüklenemedi');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      image: product.image || '',
      basePrice: product.basePrice ? product.basePrice.toString() : '',
      categoryId: product.category.id
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Ürün silinemedi. Lütfen tekrar deneyin.');
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
                Ürün eklemek için önce bir restoran oluşturmalısınız.
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

  // Filtrelenmiş ürünler
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category.id === selectedCategory);

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ürün Yönetimi</h1>
          <p className="text-gray-600">Menü ürünlerinizi yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadGlobalProducts}>
            📦 Global Katalogdan Ekle
          </Button>
          <Button onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', description: '', image: '', basePrice: '', categoryId: '' });
            setShowAddForm(true);
          }}>
            + Yeni Ürün Ekle
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        {restaurants.length > 1 && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restoran Seçin
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori Filtresi
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Modal
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Ürün Adı"
                type="text"
                placeholder="Örn: Türk Kahvesi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  placeholder="Ürün açıklaması..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Görseli (Opsiyonel)
                </label>
                
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 cursor-pointer transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                            <p className="text-sm">Yükleniyor...</p>
                          </div>
                        ) : (
                          <>
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-semibold text-primary-600">Dosya seç</span> veya sürükle bırak
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (max. 5MB)</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-center py-8">
                    <span className="text-gray-400 text-sm">VEYA</span>
                  </div>

                  <div className="flex-1">
                    <Input
                      label="Görsel URL"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                </div>

                {formData.image && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Görsel Önizleme
                    </label>
                    <div className="relative inline-block">
                      <img 
                        src={getImageUrl(formData.image)} 
                        alt="Ürün görseli önizleme" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          console.error('Image load error:', img.src);
                          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="12"%3EY%C3%BCkleniyor...%3C/text%3E%3C/svg%3E';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', getImageUrl(formData.image));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 break-all">
                      URL: {getImageUrl(formData.image)}
                    </p>
                  </div>
                )}
              </div>

              <Input
                label="Fiyat (₺)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                  required
                >
                  <option value="">Kategori seçin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={isSaving}>
                  {editingProduct ? 'Güncelle' : 'Ekle'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
      </Modal>

      {/* Bulk Price Update Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleBulkPriceUpdate}
            isLoading={isSaving}
            className="shadow-lg"
          >
            💾 Fiyat Değişikliklerini Kaydet ({Object.keys(editedPrices).length})
          </Button>
        </div>
      )}

      {/* Kategorilere Göre Ürünler */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {selectedCategory === 'all' 
                  ? 'Henüz ürün eklenmemiş' 
                  : 'Bu kategoride ürün bulunmuyor'}
              </p>
              {selectedCategory === 'all' ? (
                <Button onClick={() => setShowAddForm(true)}>
                  İlk Ürünü Ekle
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setSelectedCategory('all')}>
                  Tüm Ürünleri Göster
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {getCategoriesWithProducts().map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{category.products.length} ürün</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.products.map((product) => {
                    const currentPrice = editedPrices[product.id] !== undefined 
                      ? editedPrices[product.id] 
                      : (product.basePrice?.toString() || '0');
                    
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 transition ${
                          product.isActive 
                            ? 'border-gray-200 bg-white' 
                            : 'border-gray-300 bg-gray-50 opacity-75'
                        }`}
                      >
                        <div className="flex gap-4">
                          {/* Product Image */}
                          {product.image ? (
                            <img 
                              src={getImageUrl(product.image)} 
                              alt={product.name}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                              Görsel Yok
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{product.name}</h4>
                                {product.description && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Active/Inactive Toggle */}
                              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={product.isActive}
                                  onChange={() => toggleProductActive(product.id, product.isActive)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                              </label>
                            </div>

                            {/* Price Input */}
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={currentPrice}
                                  onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                  label=""
                                  className="text-sm"
                                />
                              </div>
                              <span className="text-gray-600 text-sm">₺</span>
                              
                              {/* Actions */}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="px-2 py-1 text-xs text-gray-600 hover:text-primary-600"
                                  title="Düzenle"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                                  title="Sil"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                product.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {product.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Global Catalog Modal - Old table code removed */}
      {showGlobalCatalog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Global Ürün Katalogu</CardTitle>
                <button
                  onClick={() => setShowGlobalCatalog(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              {globalProducts.length === 0 ? (
                <p className="text-center py-8 text-gray-500">
                  Kopyalanabilir ürün bulunamadı. Tüm ürünler zaten restoranınızda mevcut.
                </p>
              ) : (
                <div className="space-y-3">
                  {globalProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition flex justify-between items-center gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {product.image && (
                          <img 
                            src={getImageUrl(product.image)} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">Kategori: {product.category.name}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => copyFromGlobal(product)}>
                        Kopyala
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
