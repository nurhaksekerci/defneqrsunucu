'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { getImageUrl } from '@/lib/imageHelper';

interface Category {
  id: string;
  name: string;
  description?: string;
  order: number;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number | null;
  isActive: boolean;
  order: number;
  stocks?: Array<{
    price: number;
    quantity: number;
  }>;
}

interface MenuSettings {
  primaryColor: string;
  backgroundColor: string;
  viewType: 'card' | 'list';
  showHeader: boolean;
  showFooter: boolean;
  itemsPerRow: number;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  headerBgColor: string;
  headerTextColor: string;
  headerTemplate?: 'classic' | 'centered' | 'modern' | 'minimal';
  logoPosition: 'left' | 'center' | 'right';
  namePosition: 'left' | 'center' | 'right';
  descPosition: 'left' | 'center' | 'right';
  logoSize?: 'small' | 'medium' | 'large';
  mainBgColor: string;
  mainTextColor: string;
  categoryBgColor: string;
  categoryTextColor: string;
  categoryActiveBgColor: string;
  categoryActiveTextColor: string;
  categoryStyle?: 'rounded' | 'pill' | 'square';
  cardBgColor: string;
  cardTextColor: string;
  cardPriceColor: string;
  cardBorderRadius?: 'none' | 'small' | 'medium' | 'large';
  cardShadow?: 'none' | 'small' | 'medium' | 'large';
  cardHoverEffect?: boolean;
  listBgColor: string;
  listTextColor: string;
  imageAspectRatio?: '1:1' | '4:3' | '16:9' | 'auto';
  imageObjectFit?: 'cover' | 'contain';
  contentPadding?: 'compact' | 'normal' | 'relaxed';
  cardGap?: 'small' | 'medium' | 'large';
  footerBgColor: string;
  footerTextColor: string;
  showPoweredBy?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
  currencySymbol?: string;
  currencyPosition?: 'before' | 'after';
  enableAnimations?: boolean;
  showSearch?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  menuSettings?: MenuSettings;
}

const defaultMenuSettings: MenuSettings = {
  primaryColor: '#2563eb',
  backgroundColor: '#ffffff',
  viewType: 'card',
  showHeader: true,
  showFooter: true,
  itemsPerRow: 2,
  fontFamily: 'Inter, sans-serif',
  fontSize: 'medium',
  headerBgColor: '#ffffff',
  headerTextColor: '#111827',
  headerTemplate: 'classic',
  logoPosition: 'left',
  namePosition: 'left',
  descPosition: 'left',
  logoSize: 'medium',
  mainBgColor: '#f9fafb',
  mainTextColor: '#111827',
  categoryBgColor: '#f3f4f6',
  categoryTextColor: '#6b7280',
  categoryActiveBgColor: '#2563eb',
  categoryActiveTextColor: '#ffffff',
  categoryStyle: 'pill',
  cardBgColor: '#ffffff',
  cardTextColor: '#111827',
  cardPriceColor: '#2563eb',
  cardBorderRadius: 'medium',
  cardShadow: 'small',
  cardHoverEffect: true,
  listBgColor: '#ffffff',
  listTextColor: '#111827',
  imageAspectRatio: '4:3',
  imageObjectFit: 'cover',
  contentPadding: 'normal',
  cardGap: 'medium',
  footerBgColor: '#ffffff',
  footerTextColor: '#6b7280',
  showPoweredBy: true,
  socialLinks: {},
  currencySymbol: '₺',
  currencyPosition: 'after',
  enableAnimations: true,
  showSearch: false
};

export default function QRMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [siteName, setSiteName] = useState('Defne Qr');

  // Preview mode için URL parametrelerini kontrol et (Base64 encoded)
  const previewParam = searchParams.get('preview');
  const isPreviewMode = !!previewParam && previewParam !== 'true';
  let previewSettings = null;
  
  if (isPreviewMode && previewParam) {
    try {
      const decoded = decodeURIComponent(atob(previewParam));
      previewSettings = JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to decode preview settings:', e);
    }
  }
  
  // Fallback to old query params if base64 decode fails
  if (!previewSettings && searchParams.get('preview') === 'true') {
    previewSettings = {
      primaryColor: searchParams.get('primaryColor') || defaultMenuSettings.primaryColor,
      backgroundColor: searchParams.get('backgroundColor') || defaultMenuSettings.backgroundColor,
      viewType: (searchParams.get('viewType') as 'card' | 'list') || defaultMenuSettings.viewType,
      showHeader: searchParams.get('showHeader') === 'true',
      showFooter: searchParams.get('showFooter') === 'true',
      itemsPerRow: parseInt(searchParams.get('itemsPerRow') || String(defaultMenuSettings.itemsPerRow)),
      fontFamily: searchParams.get('fontFamily') || defaultMenuSettings.fontFamily,
      fontSize: (searchParams.get('fontSize') as 'small' | 'medium' | 'large') || defaultMenuSettings.fontSize,
      headerBgColor: searchParams.get('headerBgColor') || defaultMenuSettings.headerBgColor,
      headerTextColor: searchParams.get('headerTextColor') || defaultMenuSettings.headerTextColor,
      logoPosition: (searchParams.get('logoPosition') as 'left' | 'center' | 'right') || defaultMenuSettings.logoPosition,
      namePosition: (searchParams.get('namePosition') as 'left' | 'center' | 'right') || defaultMenuSettings.namePosition,
      descPosition: (searchParams.get('descPosition') as 'left' | 'center' | 'right') || defaultMenuSettings.descPosition,
      mainBgColor: searchParams.get('mainBgColor') || defaultMenuSettings.mainBgColor,
      mainTextColor: searchParams.get('mainTextColor') || defaultMenuSettings.mainTextColor,
      categoryBgColor: searchParams.get('categoryBgColor') || defaultMenuSettings.categoryBgColor,
      categoryTextColor: searchParams.get('categoryTextColor') || defaultMenuSettings.categoryTextColor,
      categoryActiveBgColor: searchParams.get('categoryActiveBgColor') || defaultMenuSettings.categoryActiveBgColor,
      categoryActiveTextColor: searchParams.get('categoryActiveTextColor') || defaultMenuSettings.categoryActiveTextColor,
      cardBgColor: searchParams.get('cardBgColor') || defaultMenuSettings.cardBgColor,
      cardTextColor: searchParams.get('cardTextColor') || defaultMenuSettings.cardTextColor,
      cardPriceColor: searchParams.get('cardPriceColor') || defaultMenuSettings.cardPriceColor,
      listBgColor: searchParams.get('listBgColor') || defaultMenuSettings.listBgColor,
      listTextColor: searchParams.get('listTextColor') || defaultMenuSettings.listTextColor,
      footerBgColor: searchParams.get('footerBgColor') || defaultMenuSettings.footerBgColor,
      footerTextColor: searchParams.get('footerTextColor') || defaultMenuSettings.footerTextColor
    };
  }
  
  useEffect(() => {
    loadRestaurantData();
  }, [slug]);

  const loadRestaurantData = async () => {
    try {
      // Restoran bilgilerini al
      const restaurantResponse = await api.get(`/restaurants/slug/${slug}`);
      const restaurantData = restaurantResponse.data.data;
      setRestaurant(restaurantData);

      // Sistem ayarlarını al (site adı için)
      try {
        const settingsResponse = await api.get('/settings');
        const settings = settingsResponse.data.data;
        setSiteName(settings.siteName || 'Defne Qr');
      } catch {
        // Sistem ayarları yüklenemezse varsayılan ismi kullan
        setSiteName('Defne Qr');
      }

      // QR Menü taramasını kaydet (arka planda, hata alırsa sorun yok)
      api.post(`/scans/record/${slug}`).catch(() => {
        // Sessizce başarısız ol
      });

      // Kategorileri ve ürünleri al
      const productsResponse = await api.get('/products', {
        params: { restaurantId: restaurantData.id }
      });

      const products = productsResponse.data.data;

      // Kategorilere göre grupla
      const categoriesResponse = await api.get('/categories', {
        params: { restaurantId: restaurantData.id }
      });

      const categoriesData = categoriesResponse.data.data
        .map((cat: any) => ({
          ...cat,
          products: products
            .filter((p: any) => p.category.id === cat.id && p.isActive !== false)
            .sort((a: Product, b: Product) => a.order - b.order)
        }))
        .sort((a: Category, b: Category) => a.order - b.order);

      setCategories(categoriesData);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Menü yüklenemedi');
      setIsLoading(false);
    }
  };

  const getProductPrice = (product: Product) => {
    if (product.stocks && product.stocks.length > 0) {
      return product.stocks[0].price;
    }
    return product.basePrice || 0;
  };

  const getFontSizeClass = (size: 'small' | 'medium' | 'large') => {
    return size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base';
  };

  const getAlignClass = (position: 'left' | 'center' | 'right') => {
    return position === 'center' ? 'justify-center text-center' : position === 'right' ? 'justify-end text-right' : 'justify-start text-left';
  };

  const getLogoSize = (size: 'small' | 'medium' | 'large' | undefined) => {
    if (!size) return 'w-16 h-16';
    return size === 'small' ? 'w-12 h-12' : size === 'large' ? 'w-20 h-20' : 'w-16 h-16';
  };

  const getCategoryStyle = (style: 'rounded' | 'pill' | 'square' | undefined) => {
    if (!style) return 'rounded-full';
    return style === 'rounded' ? 'rounded-lg' : style === 'square' ? 'rounded-none' : 'rounded-full';
  };

  const getCardBorderRadius = (radius: 'none' | 'small' | 'medium' | 'large' | undefined) => {
    if (!radius) return 'rounded-lg';
    return radius === 'none' ? 'rounded-none' : radius === 'small' ? 'rounded' : radius === 'large' ? 'rounded-2xl' : 'rounded-lg';
  };

  const getCardShadow = (shadow: 'none' | 'small' | 'medium' | 'large' | undefined) => {
    if (!shadow) return 'shadow-sm';
    return shadow === 'none' ? '' : shadow === 'small' ? 'shadow-sm' : shadow === 'large' ? 'shadow-lg' : 'shadow-md';
  };

  const getCardGap = (gap: 'small' | 'medium' | 'large' | undefined) => {
    if (!gap) return 'gap-4';
    return gap === 'small' ? 'gap-2' : gap === 'large' ? 'gap-6' : 'gap-4';
  };

  const getContentPadding = (padding: 'compact' | 'normal' | 'relaxed' | undefined) => {
    if (!padding) return 'px-4 py-6';
    return padding === 'compact' ? 'px-3 py-4' : padding === 'relaxed' ? 'px-6 py-8' : 'px-4 py-6';
  };

  const getImageAspectRatio = (ratio: '1:1' | '4:3' | '16:9' | 'auto' | undefined) => {
    if (!ratio || ratio === 'auto') return 'h-48';
    return ratio === '1:1' ? 'aspect-square h-auto' : ratio === '16:9' ? 'aspect-video h-auto' : 'h-48';
  };

  let filteredCategories = selectedCategory === 'all'
    ? categories
    : categories.filter(cat => cat.id === selectedCategory);

  // Search filtering
  if (searchQuery.trim()) {
    filteredCategories = filteredCategories.map(cat => ({
      ...cat,
      products: cat.products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.products.length > 0);
  }

  // Preview mode'daysa URL parametrelerini, değilse restaurant settings'i kullan
  const menuSettings = previewSettings || restaurant?.menuSettings || defaultMenuSettings;

  // Custom currency formatter
  const formatPrice = (amount: number) => {
    const numAmount = Number(amount) || 0;
    const formatted = numAmount.toFixed(2);
    const symbol = menuSettings.currencySymbol || '₺';
    const position = menuSettings.currencyPosition || 'after';
    return position === 'before' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Restoran Bulunamadı</h1>
          <p className="text-gray-600">{error || 'Lütfen QR kodu tekrar okutun'}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col" 
      style={{ 
        backgroundColor: menuSettings.mainBgColor,
        fontFamily: menuSettings.fontFamily,
        color: menuSettings.mainTextColor
      }}
    >
      {/* Header */}
      {menuSettings.showHeader && (
        <div 
          className="shadow-sm sticky top-0 z-10"
          style={{ backgroundColor: menuSettings.headerBgColor }}
        >
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Classic Template: Sol hizalı */}
            {(!menuSettings.headerTemplate || menuSettings.headerTemplate === 'classic') && (
              <div className="flex items-center space-x-4">
                {restaurant.logo && (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className={`${getLogoSize(menuSettings.logoSize)} rounded-full object-cover flex-shrink-0`}
                  />
                )}
                <div className="flex-1">
                  <h1 
                    className={`text-2xl font-bold ${getFontSizeClass(menuSettings.fontSize)}`}
                    style={{ color: menuSettings.headerTextColor }}
                  >
                    {restaurant.name}
                  </h1>
                  {restaurant.description && (
                    <p 
                      className="text-sm mt-1"
                      style={{ color: menuSettings.headerTextColor, opacity: 0.8 }}
                    >
                      {restaurant.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Centered Template: Orta hizalı */}
            {menuSettings.headerTemplate === 'centered' && (
              <div className="text-center">
                {restaurant.logo && (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className={`${getLogoSize(menuSettings.logoSize)} rounded-full object-cover mx-auto mb-4`}
                  />
                )}
                <h1 
                  className={`text-2xl font-bold ${getFontSizeClass(menuSettings.fontSize)}`}
                  style={{ color: menuSettings.headerTextColor }}
                >
                  {restaurant.name}
                </h1>
                {restaurant.description && (
                  <p 
                    className="text-sm mt-2"
                    style={{ color: menuSettings.headerTextColor, opacity: 0.8 }}
                  >
                    {restaurant.description}
                  </p>
                )}
              </div>
            )}

            {/* Modern Template: Logo sol, içerik orta */}
            {menuSettings.headerTemplate === 'modern' && (
              <div className="flex items-center gap-6">
                {restaurant.logo && (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 text-center">
                  <h1 
                    className={`text-2xl font-bold ${getFontSizeClass(menuSettings.fontSize)}`}
                    style={{ color: menuSettings.headerTextColor }}
                  >
                    {restaurant.name}
                  </h1>
                  {restaurant.description && (
                    <p 
                      className="text-sm mt-2"
                      style={{ color: menuSettings.headerTextColor, opacity: 0.8 }}
                    >
                      {restaurant.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Minimal Template: Sadece logo ve isim orta, açıklama yok */}
            {menuSettings.headerTemplate === 'minimal' && (
              <div className="text-center">
                {restaurant.logo && (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                  />
                )}
                <h1 
                  className={`text-2xl font-bold ${getFontSizeClass(menuSettings.fontSize)}`}
                  style={{ color: menuSettings.headerTextColor }}
                >
                  {restaurant.name}
                </h1>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div 
        className={`border-b sticky z-10 ${menuSettings.showHeader ? 'top-24' : 'top-0'}`}
        style={{ backgroundColor: menuSettings.mainBgColor }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 whitespace-nowrap ${getCategoryStyle(menuSettings.categoryStyle)} ${
                menuSettings.enableAnimations !== false ? 'transition-all' : ''
              } ${getFontSizeClass(menuSettings.fontSize)}`}
              style={
                selectedCategory === 'all'
                  ? { backgroundColor: menuSettings.categoryActiveBgColor, color: menuSettings.categoryActiveTextColor }
                  : { backgroundColor: menuSettings.categoryBgColor, color: menuSettings.categoryTextColor }
              }
            >
              Tümü
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 whitespace-nowrap ${getCategoryStyle(menuSettings.categoryStyle)} ${
                  menuSettings.enableAnimations !== false ? 'transition-all' : ''
                } ${getFontSizeClass(menuSettings.fontSize)}`}
                style={
                  selectedCategory === category.id
                    ? { backgroundColor: menuSettings.categoryActiveBgColor, color: menuSettings.categoryActiveTextColor }
                    : { backgroundColor: menuSettings.categoryBgColor, color: menuSettings.categoryTextColor }
                }
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {menuSettings.showSearch && (
        <div 
          className="border-b"
          style={{ backgroundColor: menuSettings.mainBgColor }}
        >
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                style={{ 
                  backgroundColor: menuSettings.cardBgColor,
                  color: menuSettings.mainTextColor 
                }}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className={`max-w-4xl mx-auto flex-1 ${getContentPadding(menuSettings.contentPadding)}`}>
        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-8">
            <h2 
              className={`text-xl font-bold mb-4 ${getFontSizeClass(menuSettings.fontSize)}`}
              style={{ color: menuSettings.mainTextColor }}
            >
              {category.name}
            </h2>
            
            {menuSettings.viewType === 'card' ? (
              <div 
                className={`grid ${getCardGap(menuSettings.cardGap)}`}
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 536px), 1fr))`,
                  maxWidth: '100%'
                }}
              >
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`${getCardBorderRadius(menuSettings.cardBorderRadius)} ${getCardShadow(menuSettings.cardShadow)} overflow-hidden cursor-pointer w-full ${
                      menuSettings.cardHoverEffect !== false && menuSettings.enableAnimations !== false 
                        ? 'hover:shadow-xl hover:scale-105 transition-all duration-300' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: menuSettings.cardBgColor,
                      maxWidth: '100%'
                    }}
                  >
                    {product.image && (
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className={`w-full ${getImageAspectRatio(menuSettings.imageAspectRatio)}`}
                        style={{ objectFit: menuSettings.imageObjectFit || 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="p-4">
                      <h3 
                        className={`font-semibold ${getFontSizeClass(menuSettings.fontSize)}`}
                        style={{ color: menuSettings.cardTextColor }}
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p 
                          className="text-sm mt-1 line-clamp-2"
                          style={{ color: menuSettings.cardTextColor, opacity: 0.7 }}
                        >
                          {product.description}
                        </p>
                      )}
                      <p 
                        className="text-xl font-bold mt-3" 
                        style={{ color: menuSettings.cardPriceColor }}
                      >
                        {formatPrice(getProductPrice(product))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={getCardGap(menuSettings.cardGap).replace('gap-', 'space-y-')}>
                {category.products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`${getCardBorderRadius(menuSettings.cardBorderRadius)} ${getCardShadow(menuSettings.cardShadow)} overflow-hidden cursor-pointer flex ${
                      menuSettings.cardHoverEffect !== false && menuSettings.enableAnimations !== false 
                        ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-300' 
                        : ''
                    }`}
                    style={{ backgroundColor: menuSettings.listBgColor }}
                  >
                    {product.image && (
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        className="w-24 h-24 flex-shrink-0"
                        style={{ objectFit: menuSettings.imageObjectFit || 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="p-4 flex-1 flex justify-between items-center">
                      <div className="flex-1">
                        <h3 
                          className={`font-semibold ${getFontSizeClass(menuSettings.fontSize)}`}
                          style={{ color: menuSettings.listTextColor }}
                        >
                          {product.name}
                        </h3>
                        {product.description && (
                          <p 
                            className="text-sm mt-1 line-clamp-1"
                            style={{ color: menuSettings.listTextColor, opacity: 0.7 }}
                          >
                            {product.description}
                          </p>
                        )}
                      </div>
                      <p 
                        className="text-lg font-bold ml-4" 
                        style={{ color: menuSettings.cardPriceColor }}
                      >
                        {formatPrice(getProductPrice(product))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: menuSettings.mainTextColor, opacity: 0.5 }}>
              {searchQuery ? 'Aradığınız ürün bulunamadı' : 'Bu kategoride ürün bulunmuyor'}
            </p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="rounded-t-2xl sm:rounded-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: menuSettings.viewType === 'card' ? menuSettings.cardBgColor : menuSettings.listBgColor,
              fontFamily: menuSettings.fontFamily
            }}
          >
            {selectedProduct.image && (
              <img
                src={getImageUrl(selectedProduct.image)}
                alt={selectedProduct.name}
                className="w-full h-64 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="p-6">
              <h3 
                className={`text-2xl font-bold mb-2 ${getFontSizeClass(menuSettings.fontSize)}`}
                style={{ color: menuSettings.viewType === 'card' ? menuSettings.cardTextColor : menuSettings.listTextColor }}
              >
                {selectedProduct.name}
              </h3>
              {selectedProduct.description && (
                <p 
                  className="mb-4"
                  style={{ 
                    color: menuSettings.viewType === 'card' ? menuSettings.cardTextColor : menuSettings.listTextColor,
                    opacity: 0.8
                  }}
                >
                  {selectedProduct.description}
                </p>
              )}
              <p className="text-2xl font-bold mb-4" style={{ color: menuSettings.cardPriceColor }}>
                {formatPrice(getProductPrice(selectedProduct))}
              </p>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full py-3 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: menuSettings.primaryColor }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {menuSettings.showFooter && (
        <div 
          className="border-t mt-auto"
          style={{ backgroundColor: menuSettings.footerBgColor }}
        >
          <div 
            className="max-w-4xl mx-auto px-4 py-6 text-center text-sm"
            style={{ color: menuSettings.footerTextColor }}
          >
            {/* Social Links */}
            {menuSettings.socialLinks && Object.keys(menuSettings.socialLinks).some(key => menuSettings.socialLinks?.[key as keyof typeof menuSettings.socialLinks]) && (
              <div className="flex justify-center gap-4 mb-4">
                {menuSettings.socialLinks.facebook && (
                  <a 
                    href={menuSettings.socialLinks.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <span className="text-white text-lg">f</span>
                  </a>
                )}
                {menuSettings.socialLinks.instagram && (
                  <a 
                    href={menuSettings.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white text-lg font-bold">📷</span>
                  </a>
                )}
                {menuSettings.socialLinks.twitter && (
                  <a 
                    href={menuSettings.socialLinks.twitter} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center hover:bg-sky-600 transition-colors"
                  >
                    <span className="text-white text-lg">𝕏</span>
                  </a>
                )}
                {menuSettings.socialLinks.whatsapp && (
                  <a 
                    href={`https://wa.me/${menuSettings.socialLinks.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    <span className="text-white text-lg">💬</span>
                  </a>
                )}
              </div>
            )}
            
            <p>
              Powered by <span className="font-semibold" style={{ color: menuSettings.primaryColor }}>{siteName}</span>
            </p>
            {restaurant.address && <p className="mt-2">{restaurant.address}</p>}
            {restaurant.phone && <p>{restaurant.phone}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
