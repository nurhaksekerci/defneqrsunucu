'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  order: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number | null;
  isActive: boolean;
  order: number;
  category: {
    id: string;
    name: string;
  };
}

interface CategoryWithProducts extends Category {
  products: Product[];
}

// Sortable Category Component
function SortableCategory({
  category,
  products,
  onProductDragEnd,
  onToggleActive,
}: {
  category: Category;
  products: Product[];
  onProductDragEnd: (categoryId: string, event: DragEndEvent) => void;
  onToggleActive: (productId: string, currentStatus: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Ürünler için ayrı sensors
  const productSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4">
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="cursor-move p-2 hover:bg-gray-200 rounded transition-colors touch-none"
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Bu kategoride ürün bulunmuyor</p>
          ) : (
            <DndContext
              sensors={productSensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => onProductDragEnd(category.id, event)}
            >
              <SortableContext
                items={products.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {products.map((product) => (
                    <SortableProduct
                      key={product.id}
                      product={product}
                      onToggleActive={onToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Product Component
function SortableProduct({
  product,
  onToggleActive,
}: {
  product: Product;
  onToggleActive: (productId: string, currentStatus: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:border-primary-300"
    >
      <div
        className="cursor-move text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
        </svg>
      </div>

      {product.image && (
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="w-16 h-16 object-cover rounded"
        />
      )}

      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{product.name}</h4>
        {product.description && (
          <p className="text-sm text-gray-600">{product.description}</p>
        )}
        <p className="font-semibold text-primary-600">
          {product.basePrice !== null ? formatCurrency(product.basePrice) : 'Fiyat belirtilmemiş'}
        </p>
      </div>

      <button
        onClick={() => onToggleActive(product.id, product.isActive)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          product.isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {product.isActive ? 'Aktif' : 'Pasif'}
      </button>
    </div>
  );
}

export default function MenuPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadMenuData();
    }
  }, [selectedRestaurant]);

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

  const loadMenuData = async () => {
    try {
      setIsLoading(true);

      // Kategorileri yükle
      const categoriesResponse = await api.get('/categories', {
        params: {
          restaurantId: selectedRestaurant,
          isGlobal: false
        }
      });
      const categoriesData = categoriesResponse.data.data || [];

      // Ürünleri yükle
      const productsResponse = await api.get('/products', {
        params: {
          restaurantId: selectedRestaurant,
          isGlobal: false
        }
      });
      const productsData = productsResponse.data.data || [];

      // Kategorileri ve ürünleri birleştir (sadece aktif ürünleri göster)
      const categoriesWithProds: CategoryWithProducts[] = categoriesData
        .sort((a: Category, b: Category) => a.order - b.order)
        .map((cat: Category) => ({
          ...cat,
          products: productsData
            .filter((p: Product) => p.category.id === cat.id && p.isActive === true)
            .sort((a: Product, b: Product) => a.order - b.order)
        }));

      setCategoriesWithProducts(categoriesWithProds);
    } catch (error) {
      console.error('Failed to load menu data:', error);
      alert('Menü verileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categoriesWithProducts.findIndex((c) => c.id === active.id);
    const newIndex = categoriesWithProducts.findIndex((c) => c.id === over.id);

    const newCategories = arrayMove(categoriesWithProducts, oldIndex, newIndex);
    setCategoriesWithProducts(newCategories);

    // Backend'e sıralamayı kaydet
    try {
      const categoryOrders = newCategories.map((cat, index) => ({
        id: cat.id,
        order: index
      }));

      await api.post('/categories/reorder', { categoryOrders });
    } catch (error) {
      console.error('Failed to update category order:', error);
      alert('Kategori sıralaması kaydedilemedi');
      loadMenuData(); // Revert
    }
  };

  const handleProductDragEnd = async (categoryId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const categoryIndex = categoriesWithProducts.findIndex((c) => c.id === categoryId);
    if (categoryIndex === -1) return;

    const category = categoriesWithProducts[categoryIndex];
    const oldIndex = category.products.findIndex((p) => p.id === active.id);
    const newIndex = category.products.findIndex((p) => p.id === over.id);

    const newProducts = arrayMove(category.products, oldIndex, newIndex);
    const newCategories = [...categoriesWithProducts];
    newCategories[categoryIndex] = { ...category, products: newProducts };
    setCategoriesWithProducts(newCategories);

    // Backend'e sıralamayı kaydet
    try {
      const productOrders = newProducts.map((prod, index) => ({
        id: prod.id,
        order: index
      }));

      await api.post('/products/reorder', { productOrders });
    } catch (error) {
      console.error('Failed to update product order:', error);
      alert('Ürün sıralaması kaydedilemedi');
      loadMenuData(); // Revert
    }
  };

  const toggleProductActive = async (productId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setCategoriesWithProducts((prevCategories) =>
        prevCategories.map((cat) => ({
          ...cat,
          products: cat.products.map((p) =>
            p.id === productId ? { ...p, isActive: !currentStatus } : p
          ),
        }))
      );

      await api.put(`/products/${productId}`, { isActive: !currentStatus });
    } catch (error) {
      console.error('Failed to toggle product:', error);
      alert('Ürün durumu değiştirilemedi. Lütfen tekrar deneyin.');
      loadMenuData(); // Revert on error
    }
  };

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Menü Yönetimi</h1>
        {restaurants.length > 1 && (
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          💡 <strong>İpucu:</strong> Kategorileri ve ürünleri sürükleyerek sıralayabilirsiniz. 
          Bu sıralama QR menüde de yansıyacaktır.
        </p>
      </div>

      {categoriesWithProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Henüz kategori ve ürün eklenmemiş</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext
            items={categoriesWithProducts.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {categoriesWithProducts.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                products={category.products}
                onProductDragEnd={handleProductDragEnd}
                onToggleActive={toggleProductActive}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
