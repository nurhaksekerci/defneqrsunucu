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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[] | null;
  order: number;
  isGlobal?: boolean;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number | null;
  isActive: boolean;
  order: number;
  category: { id: string; name: string };
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

type TabType = 'menu' | 'categories' | 'products';

// Sortable Category Component
function SortableCategory({
  category,
  products,
  isExpanded,
  onToggleExpand,
  onProductDragEnd,
  onToggleActive,
  onEditCategory,
  onDeleteCategory,
  onEditProduct,
  onDeleteProduct,
  editedPrices,
  onPriceChange,
  onBulkSave,
  hasPriceChanges,
}: {
  category: Category;
  products: Product[];
  isExpanded: boolean;
  onToggleExpand: (categoryId: string) => void;
  onProductDragEnd: (categoryId: string, event: DragEndEvent) => void;
  onToggleActive: (productId: string, currentStatus: boolean) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string, category: Category) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  editedPrices: Record<string, string>;
  onPriceChange: (productId: string, value: string) => void;
  onBulkSave: () => void;
  hasPriceChanges: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const productSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4 overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleExpand(category.id)}
          onKeyDown={(e) => e.key === 'Enter' && onToggleExpand(category.id)}
          className="cursor-pointer select-none"
        >
          <CardHeader className="bg-gray-50 hover:bg-gray-100 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-move p-2 hover:bg-gray-200 rounded transition-colors touch-none"
                  onClick={(e) => e.stopPropagation()}
                  {...attributes}
                  {...listeners}
                >
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900">{category.name}</span>
                <span className="text-sm text-gray-500">({products.length} ürün)</span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => onEditCategory(category)}>
                  Düzenle
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDeleteCategory(category.id, category)}>
                  Sil
                </Button>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </CardTitle>
          </CardHeader>
        </div>
        {isExpanded && (
          <CardContent>
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Bu kategoride ürün bulunmuyor</p>
            ) : (
              <DndContext
                sensors={productSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => onProductDragEnd(category.id, event)}
              >
                <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {products.map((product) => (
                      <SortableProduct
                        key={product.id}
                        product={product}
                        onToggleActive={onToggleActive}
                        onEdit={onEditProduct}
                        onDelete={onDeleteProduct}
                        editedPrice={editedPrices[product.id]}
                        onPriceChange={onPriceChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            {hasPriceChanges && (
              <div className="mt-4 pt-4 border-t">
                <Button size="sm" onClick={onBulkSave}>
                  💾 Fiyat Değişikliklerini Kaydet
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Sortable Product Component
function SortableProduct({
  product,
  onToggleActive,
  onEdit,
  onDelete,
  editedPrice,
  onPriceChange,
}: {
  product: Product;
  onToggleActive: (productId: string, currentStatus: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  editedPrice?: string;
  onPriceChange: (productId: string, value: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentPrice = editedPrice !== undefined ? editedPrice : (product.basePrice?.toString() || '0');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:border-primary-300"
    >
      <div className="cursor-move text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {product.image && (
        <img src={getImageUrl(product.image)} alt={product.name} className="w-16 h-16 object-cover rounded" />
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900">{product.name}</h4>
        {product.description && <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>}
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={currentPrice}
            onChange={(e) => onPriceChange(product.id, e.target.value)}
            className="w-24 text-sm"
          />
          <span className="text-gray-600 text-sm">₺</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>
          ✏️
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(product.id)}>
          🗑️
        </Button>
        <button
          onClick={() => onToggleActive(product.id, product.isActive)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
            product.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {product.isActive ? 'Aktif' : 'Pasif'}
        </button>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const searchParams = useSearchParams();
  const categoryIdFromUrl = searchParams.get('categoryId');
  const tabFromUrl = searchParams.get('tab') as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl && ['menu', 'categories', 'products'].includes(tabFromUrl) ? tabFromUrl : 'menu');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<{ name: string; description: string; order: number; images: string[] }>({ name: '', description: '', order: 0, images: [] });
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    image: '',
    basePrice: '',
    categoryId: '',
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Global catalog
  const [showGlobalCategoryModal, setShowGlobalCategoryModal] = useState(false);
  const [showGlobalProductModal, setShowGlobalProductModal] = useState(false);
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);

  // Bulk price edit
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [hasPriceChanges, setHasPriceChanges] = useState(false);

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadAllData();
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    if (categoryIdFromUrl && categoriesWithProducts.length > 0) {
      setExpandedCategories((prev) => new Set(Array.from(prev).concat(categoryIdFromUrl)));
      setActiveTab('menu');
    }
  }, [categoryIdFromUrl, categoriesWithProducts]);

  useEffect(() => {
    if (tabFromUrl && ['menu', 'categories', 'products'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/my');
      const userRestaurants = response.data.data || [];
      setRestaurants(userRestaurants);
      if (userRestaurants.length > 0) {
        setSelectedRestaurant(userRestaurants[0].id);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    }
  };

  const loadAllData = async () => {
    if (!selectedRestaurant) return;
    try {
      setIsLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        api.get('/categories', { params: { restaurantId: selectedRestaurant, isGlobal: false } }),
        api.get('/products', { params: { restaurantId: selectedRestaurant, isGlobal: false } }),
      ]);
      const categoriesData = categoriesRes.data.data || [];
      const productsData = productsRes.data.data || [];

      const catsWithProds: CategoryWithProducts[] = categoriesData
        .sort((a: Category, b: Category) => a.order - b.order)
        .map((cat: Category) => ({
          ...cat,
          products: productsData
            .filter((p: Product) => p.category?.id === cat.id)
            .sort((a: Product, b: Product) => (a.order ?? 0) - (b.order ?? 0)),
        }));

      setCategoriesWithProducts(catsWithProds);
      setCategories(categoriesData);
      setProducts(productsData);
      setExpandedCategories(new Set(catsWithProds.map((c: CategoryWithProducts) => c.id)));
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Veriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGlobalCategories = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        api.get('/categories?isGlobal=true'),
        api.get('/products?isGlobal=true'),
      ]);
      const cats = categoriesRes.data.data || [];
      const prods = productsRes.data.data || [];
      const existingNames = categories.map((c) => c.name.toLowerCase());
      const availableCats = cats.filter((cat: any) => !existingNames.includes(cat.name.toLowerCase()));
      const catsWithProducts = availableCats.map((cat: any) => ({
        ...cat,
        products: prods.filter((p: any) => p.categoryId === cat.id),
      }));
      setGlobalCategories(catsWithProducts);
      setShowGlobalCategoryModal(true);
    } catch (error) {
      console.error('Failed to load global categories:', error);
      alert('Global kategoriler yüklenemedi.');
    }
  };

  const loadGlobalProducts = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        api.get(`/categories?restaurantId=${selectedRestaurant}`),
        api.get('/products?isGlobal=true'),
      ]);
      const restaurantCategories = categoriesRes.data.data || [];
      const allGlobalProducts = productsRes.data.data || [];
      const globalCategoryNames = restaurantCategories.map((c: any) => c.name);
      const existingProductNames = products.map((p) => p.name.toLowerCase());
      const filtered = allGlobalProducts.filter((gp: any) => {
        const isInCategory = globalCategoryNames.includes(gp.category?.name);
        const isNotCopied = !existingProductNames.includes(gp.name?.toLowerCase());
        return isInCategory && isNotCopied;
      });
      setGlobalProducts(filtered);
      setShowGlobalProductModal(true);
    } catch (error) {
      console.error('Failed to load global products:', error);
      alert('Global ürünler yüklenemedi.');
    }
  };

  const copyCategoryFromGlobal = async (
    globalCategory: any,
    productPrices: Record<string, number>,
    productActiveStates: Record<string, boolean>
  ) => {
    try {
      await api.post('/categories/copy-category-with-products', {
        categoryId: globalCategory.id,
        restaurantId: selectedRestaurant,
        productPrices,
        productActiveStates,
      });
      setShowGlobalCategoryModal(false);
      loadAllData();
      const activeCount = Object.values(productActiveStates).filter(Boolean).length;
      alert(`✅ Kategori kopyalandı! ${activeCount} aktif ürün eklendi.`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        const { getPlanLimitErrorMessage, redirectToPremiumUpgrade } = await import('@/lib/planLimitHelper');
        alert(getPlanLimitErrorMessage(error));
        if (confirm('Premium pakete yükseltmek ister misiniz?')) redirectToPremiumUpgrade();
      } else {
        alert(error.response?.data?.message || 'Kategori kopyalanamadı.');
      }
    }
  };

  const copyProductFromGlobal = async (globalProduct: any) => {
    const matchingCategory = categories.find((c) => c.name === globalProduct.category?.name);
    if (!matchingCategory) {
      alert(`"${globalProduct.category?.name}" kategorisi bulunamadı!`);
      return;
    }
    const price = prompt(`"${globalProduct.name}" için fiyat (₺):`);
    if (!price || isNaN(parseFloat(price))) return;
    try {
      await api.post('/products', {
        name: globalProduct.name,
        description: globalProduct.description,
        image: globalProduct.image,
        basePrice: parseFloat(price),
        categoryId: matchingCategory.id,
        restaurantId: selectedRestaurant,
      });
      setShowGlobalProductModal(false);
      loadAllData();
      alert('Ürün kopyalandı!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        const { getPlanLimitErrorMessage, redirectToPremiumUpgrade } = await import('@/lib/planLimitHelper');
        alert(getPlanLimitErrorMessage(error));
        if (confirm('Premium pakete yükseltmek ister misiniz?')) redirectToPremiumUpgrade();
      } else {
        alert(error.response?.data?.message || 'Ürün kopyalanamadı.');
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, {
          ...categoryFormData,
          restaurantId: selectedRestaurant,
        });
      } else {
        await api.post('/categories', {
          ...categoryFormData,
          restaurantId: selectedRestaurant,
        });
      }
      setCategoryFormData({ name: '', description: '', order: 0, images: [] });
      setNewCategoryImageUrl('');
      setShowCategoryForm(false);
      setEditingCategory(null);
      loadAllData();
      alert('✅ Kategori kaydedildi!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        const { getPlanLimitErrorMessage, redirectToPremiumUpgrade } = await import('@/lib/planLimitHelper');
        alert(getPlanLimitErrorMessage(error));
        if (confirm('Premium pakete yükseltmek ister misiniz?')) redirectToPremiumUpgrade();
      } else {
        alert(error.response?.data?.message || 'Kategori kaydedilemedi.');
      }
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      const data = {
        ...productFormData,
        basePrice: parseFloat(productFormData.basePrice),
        restaurantId: selectedRestaurant,
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }
      setProductFormData({ name: '', description: '', image: '', basePrice: '', categoryId: '' });
      setShowProductForm(false);
      setEditingProduct(null);
      loadAllData();
      alert('✅ Ürün kaydedildi!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        const { getPlanLimitErrorMessage, redirectToPremiumUpgrade } = await import('@/lib/planLimitHelper');
        alert(getPlanLimitErrorMessage(error));
        if (confirm('Premium pakete yükseltmek ister misiniz?')) redirectToPremiumUpgrade();
      } else {
        alert(error.response?.data?.message || 'Ürün kaydedilemedi.');
      }
    } finally {
      setIsSavingProduct(false);
    }
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
      if (res.data.success) setProductFormData((p) => ({ ...p, image: res.data.data.url }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Yükleme başarısız');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (res.data.success) setCategoryFormData((c) => ({ ...c, images: [...(c.images || []), res.data.data.url] }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Yükleme başarısız');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCategory = async (id: string, category: Category) => {
    const count = categoriesWithProducts.find((c) => c.id === id)?.products?.length || 0;
    const msg = count > 0
      ? `Bu kategoride ${count} ürün var. Silindiğinde ürünler de silinecek. Devam?`
      : 'Bu kategoriyi silmek istediğinize emin misiniz?';
    if (!confirm(msg)) return;
    try {
      await api.delete(`/categories/${id}`);
      loadAllData();
      alert('Kategori silindi');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Silinemedi');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/products/${id}`);
      loadAllData();
      alert('Ürün silindi');
    } catch (err) {
      alert('Ürün silinemedi');
    }
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categoriesWithProducts.findIndex((c) => c.id === active.id);
    const newIndex = categoriesWithProducts.findIndex((c) => c.id === over.id);
    const newCategories = arrayMove(categoriesWithProducts, oldIndex, newIndex);
    setCategoriesWithProducts(newCategories);
    try {
      await api.post('/categories/reorder', {
        categoryOrders: newCategories.map((cat, i) => ({ id: cat.id, order: i })),
      });
    } catch (err) {
      alert('Sıralama kaydedilemedi');
      loadAllData();
    }
  };

  const handleProductDragEnd = async (categoryId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const catIndex = categoriesWithProducts.findIndex((c) => c.id === categoryId);
    if (catIndex === -1) return;
    const cat = categoriesWithProducts[catIndex];
    const oldIdx = cat.products.findIndex((p) => p.id === active.id);
    const newIdx = cat.products.findIndex((p) => p.id === over.id);
    const newProducts = arrayMove(cat.products, oldIdx, newIdx);
    const newCats = [...categoriesWithProducts];
    newCats[catIndex] = { ...cat, products: newProducts };
    setCategoriesWithProducts(newCats);
    try {
      await api.post('/products/reorder', {
        productOrders: newProducts.map((p, i) => ({ id: p.id, order: i })),
      });
    } catch (err) {
      alert('Sıralama kaydedilemedi');
      loadAllData();
    }
  };

  const toggleProductActive = async (productId: string, currentStatus: boolean) => {
    try {
      setCategoriesWithProducts((prev) =>
        prev.map((cat) => ({
          ...cat,
          products: cat.products.map((p) =>
            p.id === productId ? { ...p, isActive: !currentStatus } : p
          ),
        }))
      );
      await api.put(`/products/${productId}`, { isActive: !currentStatus });
    } catch (err) {
      alert('Durum değiştirilemedi');
      loadAllData();
    }
  };

  const handlePriceChange = (productId: string, value: string) => {
    setEditedPrices((p) => ({ ...p, [productId]: value }));
    setHasPriceChanges(true);
  };

  const handleBulkPriceSave = async () => {
    if (!hasPriceChanges || Object.keys(editedPrices).length === 0) return;
    try {
      for (const [productId, price] of Object.entries(editedPrices)) {
        const num = parseFloat(price);
        if (!isNaN(num)) await api.put(`/products/${productId}`, { basePrice: num });
      }
      setEditedPrices({});
      setHasPriceChanges(false);
      loadAllData();
      alert('Fiyatlar kaydedildi!');
    } catch (err) {
      alert('Fiyatlar kaydedilemedi');
    }
  };

  const getCategoryPriceChanges = (categoryId: string) => {
    const cat = categoriesWithProducts.find((c) => c.id === categoryId);
    if (!cat) return false;
    return cat.products.some((p) => editedPrices[p.id] !== undefined);
  };

  if (isLoading && !categoriesWithProducts.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Restoran bulunamadı</p>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'menu', label: '📋 Menü' },
    { id: 'categories', label: '📁 Kategoriler' },
    { id: 'products', label: '🍽️ Ürünler' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
        <div className="flex flex-wrap gap-2">
          {restaurants.length > 1 && (
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="px-4 py-2 border rounded-lg text-gray-900 bg-white"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <Button variant="secondary" size="sm" onClick={loadGlobalCategories}>
            📦 Global Katalogdan Kategori
          </Button>
          <Button variant="secondary" size="sm" onClick={loadGlobalProducts}>
            📦 Global Katalogdan Ürün
          </Button>
          <Button size="sm" onClick={() => { setEditingCategory(null); setCategoryFormData({ name: '', description: '', order: 0, images: [] }); setNewCategoryImageUrl(''); setShowCategoryForm(true); }}>
            + Kategori
          </Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setProductFormData({ name: '', description: '', image: '', basePrice: '', categoryId: '' }); setShowProductForm(true); }}>
            + Ürün
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Menü */}
      {activeTab === 'menu' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 Kategorilere tıklayarak açıp kapatabilirsiniz. Sürükleyerek sıralayabilirsiniz. Ürünleri düzenleyebilir, fiyat güncelleyebilirsiniz.
            </p>
          </div>
          {categoriesWithProducts.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Button variant="secondary" size="sm" onClick={() => setExpandedCategories(new Set(categoriesWithProducts.map((c) => c.id)))}>
                Tümünü Aç
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setExpandedCategories(new Set())}>
                Tümünü Kapat
              </Button>
            </div>
          )}
          {categoriesWithProducts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">Henüz kategori ve ürün yok</p>
                <Button onClick={() => setActiveTab('categories')}>Kategori Ekle</Button>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
              <SortableContext items={categoriesWithProducts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {categoriesWithProducts.map((category) => (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    products={category.products}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggleExpand={toggleCategoryExpand}
                    onProductDragEnd={handleProductDragEnd}
                    onToggleActive={toggleProductActive}
                    onEditCategory={(cat) => { setEditingCategory(cat); setCategoryFormData({ name: cat.name, description: cat.description || '', order: cat.order, images: Array.isArray((cat as any).images) ? (cat as any).images : ((cat as any).image ? [(cat as any).image] : []) }); setNewCategoryImageUrl(''); setShowCategoryForm(true); }}
                    onDeleteCategory={handleDeleteCategory}
                    onEditProduct={(p) => { setEditingProduct(p); setProductFormData({ name: p.name, description: p.description || '', image: p.image || '', basePrice: p.basePrice?.toString() || '', categoryId: p.category.id }); setShowProductForm(true); }}
                    onDeleteProduct={handleDeleteProduct}
                    editedPrices={editedPrices}
                    onPriceChange={handlePriceChange}
                    onBulkSave={handleBulkPriceSave}
                    hasPriceChanges={getCategoryPriceChanges(category.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {/* Tab: Kategoriler */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Kategoriler ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Henüz kategori yok</p>
                <Button onClick={() => { setEditingCategory(null); setCategoryFormData({ name: '', description: '', order: 0, images: [] }); setNewCategoryImageUrl(''); setShowCategoryForm(true); }}>İlk Kategoriyi Ekle</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.sort((a, b) => a.order - b.order).map((cat) => {
                  const prodCount = categoriesWithProducts.find((c) => c.id === cat.id)?.products?.length || 0;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-900">{cat.name}</h3>
                        {cat.description && <p className="text-sm text-gray-600">{cat.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">Sıra: {cat.order} • {prodCount} ürün</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setEditingCategory(cat); setCategoryFormData({ name: cat.name, description: cat.description || '', order: cat.order, images: Array.isArray((cat as any).images) ? (cat as any).images : ((cat as any).image ? [(cat as any).image] : []) }); setNewCategoryImageUrl(''); setShowCategoryForm(true); }}>
                          Düzenle
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteCategory(cat.id, cat)}>
                          Sil
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Ürünler */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle>Ürünler ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Henüz ürün yok</p>
                <Button onClick={() => setShowProductForm(true)}>İlk Ürünü Ekle</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {categoriesWithProducts.map((cat) => (
                  <div key={cat.id}>
                    <h3 className="font-semibold text-gray-900 mb-2">{cat.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cat.products.map((p) => (
                        <div
                          key={p.id}
                          className={`border rounded-lg p-4 flex gap-4 ${!p.isActive ? 'bg-gray-50 opacity-75' : ''}`}
                        >
                          {p.image && <img src={getImageUrl(p.image)} alt={p.name} className="w-16 h-16 object-cover rounded" />}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">{p.name}</h4>
                            <p className="text-sm text-primary-600">{formatCurrency(p.basePrice ?? 0)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {p.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => { setEditingProduct(p); setProductFormData({ name: p.name, description: p.description || '', image: p.image || '', basePrice: p.basePrice?.toString() || '', categoryId: p.category.id }); setShowProductForm(true); }}>
                              ✏️
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteProduct(p.id)}>
                              🗑️
                            </Button>
                            <button
                              onClick={() => toggleProductActive(p.id, p.isActive)}
                              className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300"
                            >
                              {p.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Modal */}
      <Modal isOpen={showCategoryForm} onClose={() => { setShowCategoryForm(false); setEditingCategory(null); setNewCategoryImageUrl(''); }} title={editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}>
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Input label="Kategori Adı" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Görselleri</label>
            <p className="text-xs text-gray-500 mb-2">Menü şablonlarında kategorinin üstünde gösterilir (en fazla 4)</p>
            <div className="flex gap-2 mb-2">
              <label className="flex-1 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-primary-500 text-sm">
                <input type="file" accept="image/*" onChange={handleCategoryImageUpload} className="hidden" disabled={isUploading} />
                {isUploading ? 'Yükleniyor...' : '📷 Görsel Yükle'}
              </label>
              <Input type="url" placeholder="URL ekle" value={newCategoryImageUrl} onChange={(e) => setNewCategoryImageUrl(e.target.value)} className="flex-1" />
              <Button type="button" variant="secondary" size="sm" onClick={() => {
                const url = newCategoryImageUrl.trim();
                if (url && (categoryFormData.images?.length ?? 0) < 4) {
                  setCategoryFormData((c) => ({ ...c, images: [...(c.images || []), url] }));
                  setNewCategoryImageUrl('');
                }
              }}>Ekle</Button>
            </div>
            {(categoryFormData.images?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {(categoryFormData.images || []).slice(0, 4).map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={getImageUrl(url) || url} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                    <button type="button" onClick={() => setCategoryFormData((c) => ({ ...c, images: (c.images || []).filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Input label="Sıralama" type="number" value={categoryFormData.order} onChange={(e) => setCategoryFormData({ ...categoryFormData, order: parseInt(e.target.value) || 0 })} />
          <div className="flex gap-3">
            <Button type="submit" isLoading={isSavingCategory}>{editingCategory ? 'Güncelle' : 'Ekle'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}>İptal</Button>
          </div>
        </form>
      </Modal>

      {/* Product Modal */}
      <Modal isOpen={showProductForm} onClose={() => { setShowProductForm(false); setEditingProduct(null); }} title={editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'} size="lg">
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <Input label="Ürün Adı" value={productFormData.name} onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea value={productFormData.description} onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Görsel</label>
            <div className="flex gap-4">
              <label className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary-500">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                {isUploading ? 'Yükleniyor...' : 'Dosya seç veya sürükle'}
              </label>
              <Input label="URL" type="url" value={productFormData.image} onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })} className="flex-1" />
            </div>
          </div>
          <Input label="Fiyat (₺)" type="number" step="0.01" min="0" value={productFormData.basePrice} onChange={(e) => setProductFormData({ ...productFormData, basePrice: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select value={productFormData.categoryId} onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seçin</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" isLoading={isSavingProduct}>{editingProduct ? 'Güncelle' : 'Ekle'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowProductForm(false); setEditingProduct(null); }}>İptal</Button>
          </div>
        </form>
      </Modal>

      {/* Global Category Modal */}
      {showGlobalCategoryModal && (
        <GlobalCategoryModal
          globalCategories={globalCategories}
          onClose={() => setShowGlobalCategoryModal(false)}
          onCopy={copyCategoryFromGlobal}
        />
      )}

      {/* Global Product Modal */}
      {showGlobalProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Global Ürün Katalogu</CardTitle>
                <button onClick={() => setShowGlobalProductModal(false)} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[60vh]">
              {globalProducts.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Kopyalanabilir ürün yok.</p>
              ) : (
                <div className="space-y-3">
                  {globalProducts.map((gp: any) => (
                    <div key={gp.id} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{gp.name}</h3>
                        <p className="text-xs text-gray-500">{gp.category?.name}</p>
                      </div>
                      <Button size="sm" onClick={() => copyProductFromGlobal(gp)}>Kopyala</Button>
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

// Global Category Modal (from categories page)
function GlobalCategoryModal({
  globalCategories,
  onClose,
  onCopy,
}: {
  globalCategories: any[];
  onClose: () => void;
  onCopy: (cat: any, prices: Record<string, number>, activeStates: Record<string, boolean>) => Promise<void>;
}) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});
  const [productActiveStates, setProductActiveStates] = useState<Record<string, boolean>>({});
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = (cat: any) => {
    if (!cat.products?.length) {
      onCopy(cat, {}, {});
      return;
    }
    setSelectedCategory(cat);
    const prices: Record<string, string> = {};
    const active: Record<string, boolean> = {};
    cat.products.forEach((p: any) => {
      prices[p.id] = '';
      active[p.id] = true;
    });
    setProductPrices(prices);
    setProductActiveStates(active);
  };

  const handleConfirm = async () => {
    if (!selectedCategory) return;
    const prices: Record<string, number> = {};
    for (const p of selectedCategory.products || []) {
      const isActive = productActiveStates[p.id];
      if (isActive) {
        const v = productPrices[p.id];
        if (!v || isNaN(parseFloat(v))) {
          alert(`"${p.name}" için fiyat girin`);
          return;
        }
        prices[p.id] = parseFloat(v);
      } else {
        prices[p.id] = 0;
      }
    }
    setIsCopying(true);
    try {
      await onCopy(selectedCategory, prices, productActiveStates);
      setSelectedCategory(null);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{selectedCategory ? `Fiyat: ${selectedCategory.name}` : 'Global Kategori Katalogu'}</CardTitle>
            <button onClick={() => selectedCategory ? setSelectedCategory(null) : onClose()} className="text-2xl text-gray-500">×</button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh]">
          {!selectedCategory ? (
            globalCategories.length === 0 ? (
              <p className="text-center py-12 text-gray-500">Tüm kategoriler zaten eklenmiş.</p>
            ) : (
              <div className="space-y-4">
                {globalCategories.map((cat: any) => (
                  <Card key={cat.id} className="border-2 hover:border-primary-500">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.products?.length || 0} ürün</p>
                      </div>
                      <Button size="sm" onClick={() => handleCopy(cat)}>Kopyala</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {(selectedCategory.products || []).map((p: any) => (
                <div key={p.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{p.name}</h4>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={productActiveStates[p.id]} onChange={(e) => setProductActiveStates({ ...productActiveStates, [p.id]: e.target.checked })} />
                      Aktif
                    </label>
                  </div>
                  {productActiveStates[p.id] && (
                    <Input label="Fiyat (₺)" type="number" step="0.01" value={productPrices[p.id]} onChange={(e) => setProductPrices({ ...productPrices, [p.id]: e.target.value })} required />
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleConfirm} isLoading={isCopying}>Kategori ve Ürünleri Kopyala</Button>
                <Button variant="secondary" onClick={() => setSelectedCategory(null)}>İptal</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
