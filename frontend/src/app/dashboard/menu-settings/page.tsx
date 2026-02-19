'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

// Color picker component
const ColorPicker = ({ label, value, onChange, description }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex gap-3 items-center">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm"
        placeholder="#000000"
      />
    </div>
    {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
  </div>
);

// Position selector component
const PositionSelector = ({ label, value, onChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="grid grid-cols-3 gap-2">
      {['left', 'center', 'right'].map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={`px-3 py-2 border-2 rounded-lg transition-all text-sm ${
            value === pos
              ? 'border-primary-600 bg-primary-50 text-gray-900'
              : 'border-gray-300 hover:border-gray-400 text-gray-700'
          }`}
        >
          {pos === 'left' ? '← Sol' : pos === 'center' ? '↔ Orta' : 'Sağ →'}
        </button>
      ))}
    </div>
  </div>
);

interface MenuSettings {
  primaryColor: string;
  backgroundColor: string;
  viewType: 'card' | 'list';
  showHeader: boolean;
  showFooter: boolean;
  itemsPerRow: number;
  
  // Typography
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // Header
  headerBgColor: string;
  headerTextColor: string;
  headerTemplate: 'classic' | 'centered' | 'modern' | 'minimal';
  logoPosition: 'left' | 'center' | 'right';
  namePosition: 'left' | 'center' | 'right';
  descPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  
  // Main Content
  mainBgColor: string;
  mainTextColor: string;
  
  // Categories
  categoryBgColor: string;
  categoryTextColor: string;
  categoryActiveBgColor: string;
  categoryActiveTextColor: string;
  categoryStyle: 'rounded' | 'pill' | 'square';
  
  // Cards
  cardBgColor: string;
  cardTextColor: string;
  cardPriceColor: string;
  cardBorderRadius: 'none' | 'small' | 'medium' | 'large';
  cardShadow: 'none' | 'small' | 'medium' | 'large';
  cardHoverEffect: boolean;
  
  // List
  listBgColor: string;
  listTextColor: string;
  
  // Images
  imageAspectRatio: '1:1' | '4:3' | '16:9' | 'auto';
  imageObjectFit: 'cover' | 'contain';
  
  // Spacing
  contentPadding: 'compact' | 'normal' | 'relaxed';
  cardGap: 'small' | 'medium' | 'large';
  
  // Footer
  footerBgColor: string;
  footerTextColor: string;
  showPoweredBy: boolean;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
  
  // Localization
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  
  // Advanced
  enableAnimations: boolean;
  showSearch: boolean;
}

const defaultSettings: MenuSettings = {
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

export default function MenuSettingsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [settings, setSettings] = useState<MenuSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [siteName, setSiteName] = useState('Defne Qr');

  useEffect(() => {
    loadRestaurants();
    loadSystemSettings();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadMenuSettings();
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    // Her ayar değişikliğinde preview URL'ini güncelle
    if (selectedRestaurant) {
      const restaurant = restaurants.find(r => r.id === selectedRestaurant);
      if (restaurant) {
        // Base64 encode settings for preview
        const settingsJson = JSON.stringify(settings);
        const settingsBase64 = btoa(encodeURIComponent(settingsJson));
        setPreviewUrl(`/${restaurant.slug}/menu?preview=${settingsBase64}`);
      }
    }
  }, [settings, selectedRestaurant, restaurants]);

  const loadSystemSettings = async () => {
    try {
      const response = await api.get('/settings');
      const systemSettings = response.data.data;
      setSiteName(systemSettings.siteName || 'Defne Qr');
    } catch (error) {
      console.error('Failed to load system settings:', error);
      setSiteName('Defne Qr');
    }
  };

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/my');
      const restaurantList = response.data.data || [];
      setRestaurants(restaurantList);
      
      if (restaurantList.length > 0) {
        setSelectedRestaurant(restaurantList[0].id);
        const restaurant = restaurantList[0];
        setPreviewUrl(`/${restaurant.slug}/menu`);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMenuSettings = async () => {
    try {
      const restaurant = restaurants.find(r => r.id === selectedRestaurant);
      if (restaurant?.menuSettings) {
        setSettings({ ...defaultSettings, ...restaurant.menuSettings });
      } else {
        setSettings(defaultSettings);
      }
      setPreviewUrl(`/${restaurant?.slug}/menu`);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // showPoweredBy her zaman true olacak
      const settingsToSave = { ...settings, showPoweredBy: true };
      
      await api.put(`/restaurants/${selectedRestaurant}`, {
        menuSettings: settingsToSave
      });
      
      alert('Menü ayarları başarıyla kaydedildi!');
      
      // Restaurants'ı yeniden yükle
      await loadRestaurants();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert(error.response?.data?.message || 'Ayarlar kaydedilemedi');
    } finally {
      setIsSaving(false);
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
                Menü özelleştirme için önce bir restoran oluşturmalısınız.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 -m-6 p-6">
      {/* Professional Header */}
      {restaurants.length > 1 && (
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-end gap-3">
              <label className="text-sm font-medium text-gray-700">Restoran:</label>
              <select
                value={selectedRestaurant}
                onChange={(e) => setSelectedRestaurant(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-900 bg-white hover:border-primary-500 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sol Taraf - Ayarlar */}
        <div className="xl:col-span-2 space-y-5">
          
          {/* Tema Presets */}
          <Card className="border-2 border-primary-100 bg-gradient-to-br from-white to-primary-50/30">
            <CardHeader className="border-b border-primary-100 bg-white/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎨</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Hazır Temalar</CardTitle>
                  <p className="text-xs text-gray-600 mt-0.5">Hızlı başlangıç için bir tema seçin</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSettings({
                    ...defaultSettings,
                    primaryColor: '#6366f1',
                    mainBgColor: '#f8fafc',
                    headerBgColor: '#ffffff',
                    headerTextColor: '#0f172a',
                    headerTemplate: 'modern',
                    mainTextColor: '#0f172a',
                    categoryBgColor: '#e0e7ff',
                    categoryTextColor: '#4f46e5',
                    categoryActiveBgColor: '#6366f1',
                    categoryActiveTextColor: '#ffffff',
                    cardBgColor: '#ffffff',
                    cardTextColor: '#0f172a',
                    cardPriceColor: '#6366f1',
                    footerBgColor: '#f1f5f9',
                    footerTextColor: '#64748b',
                    cardBorderRadius: 'large',
                    cardShadow: 'medium',
                    categoryStyle: 'pill'
                  })}
                  className="group relative p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg"></div>
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-indigo-200 shadow-sm"></div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">Modern</div>
                    <div className="text-xs text-gray-600 mt-0.5">İndigo & Mor Tonlar</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setSettings({
                    ...defaultSettings,
                    primaryColor: '#f97316',
                    mainBgColor: '#fffbeb',
                    headerBgColor: '#ffffff',
                    headerTextColor: '#78350f',
                    headerTemplate: 'centered',
                    mainTextColor: '#78350f',
                    categoryBgColor: '#fed7aa',
                    categoryTextColor: '#c2410c',
                    categoryActiveBgColor: '#f97316',
                    categoryActiveTextColor: '#ffffff',
                    cardBgColor: '#ffffff',
                    cardTextColor: '#78350f',
                    cardPriceColor: '#ea580c',
                    footerBgColor: '#fef3c7',
                    footerTextColor: '#92400e',
                    cardBorderRadius: 'medium',
                    cardShadow: 'medium',
                    categoryStyle: 'rounded'
                  })}
                  className="group relative p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 shadow-lg"></div>
                      <div className="w-6 h-6 rounded-full bg-amber-50 border-2 border-orange-300 shadow-sm"></div>
                    </div>
                    <div className="text-sm font-semibold text-orange-900">Sıcak</div>
                    <div className="text-xs text-orange-700 mt-0.5">Turuncu & Altın</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setSettings({
                    ...defaultSettings,
                    primaryColor: '#14b8a6',
                    mainBgColor: '#f0fdfa',
                    headerBgColor: '#ffffff',
                    headerTextColor: '#134e4a',
                    headerTemplate: 'classic',
                    mainTextColor: '#134e4a',
                    categoryBgColor: '#ccfbf1',
                    categoryTextColor: '#0f766e',
                    categoryActiveBgColor: '#14b8a6',
                    categoryActiveTextColor: '#ffffff',
                    cardBgColor: '#ffffff',
                    cardTextColor: '#134e4a',
                    cardPriceColor: '#0d9488',
                    footerBgColor: '#e6fffa',
                    footerTextColor: '#2dd4bf',
                    cardBorderRadius: 'large',
                    cardShadow: 'medium',
                    categoryStyle: 'pill'
                  })}
                  className="group relative p-4 border-2 border-gray-200 rounded-xl hover:border-teal-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 shadow-lg"></div>
                      <div className="w-6 h-6 rounded-full bg-teal-50 border-2 border-teal-300 shadow-sm"></div>
                    </div>
                    <div className="text-sm font-semibold text-teal-900">Taze</div>
                    <div className="text-xs text-teal-700 mt-0.5">Turkuaz & Nane</div>
                  </div>
                </button>
                
                <button
                  onClick={() => setSettings({
                    ...defaultSettings,
                    primaryColor: '#eab308',
                    mainBgColor: '#1f2937',
                    headerBgColor: '#111827',
                    headerTextColor: '#f3f4f6',
                    headerTemplate: 'minimal',
                    mainTextColor: '#f3f4f6',
                    categoryBgColor: '#374151',
                    categoryTextColor: '#f3f4f6',
                    categoryActiveBgColor: '#eab308',
                    categoryActiveTextColor: '#000000',
                    cardBgColor: '#374151',
                    cardTextColor: '#f3f4f6',
                    cardPriceColor: '#eab308',
                    footerBgColor: '#111827',
                    footerTextColor: '#9ca3af',
                    cardBorderRadius: 'medium',
                    categoryStyle: 'square'
                  })}
                  className="group relative p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 shadow-sm"></div>
                      <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-600"></div>
                    </div>
                    <div className="text-sm font-semibold text-white">Dark Mode</div>
                    <div className="text-xs text-gray-400 mt-0.5">Altın & Siyah</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
          
          {/* Typography */}
          <Card className="border border-gray-200 hover:border-gray-300 transition-colors shadow-sm hover:shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✍️</span>
                </div>
                <CardTitle className="text-lg">Tipografi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Ailesi</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                >
                  <option value="Inter, sans-serif">Inter (Modern)</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="Georgia, serif">Georgia (Serif)</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Font Boyutu</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setSettings({ ...settings, fontSize: size })}
                      className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center ${
                        settings.fontSize === size
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className={`text-gray-900 font-semibold ${
                        size === 'small' ? 'text-xs' : size === 'medium' ? 'text-base' : 'text-xl'
                      }`}>
                        Aa
                      </span>
                      <span className="text-xs text-gray-600 mt-1">
                        {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : 'Büyük'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Header Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ColorPicker
                label="Header Arka Plan Rengi"
                value={settings.headerBgColor}
                onChange={(val: string) => setSettings({ ...settings, headerBgColor: val })}
              />
              <ColorPicker
                label="Header Yazı Rengi"
                value={settings.headerTextColor}
                onChange={(val: string) => setSettings({ ...settings, headerTextColor: val })}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Header Tasarım Şablonu</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Classic Template */}
                  <button
                    onClick={() => setSettings({ 
                      ...settings, 
                      headerTemplate: 'classic',
                      logoPosition: 'left',
                      namePosition: 'left',
                      descPosition: 'left',
                      logoSize: 'medium'
                    })}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      settings.headerTemplate === 'classic'
                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-400 rounded w-20 mb-1"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-32"></div>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-3">Classic</p>
                      <p className="text-xs text-gray-500">Sol hizalı, geleneksel düzen</p>
                    </div>
                  </button>

                  {/* Centered Template */}
                  <button
                    onClick={() => setSettings({ 
                      ...settings, 
                      headerTemplate: 'centered',
                      logoPosition: 'center',
                      namePosition: 'center',
                      descPosition: 'center',
                      logoSize: 'medium'
                    })}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      settings.headerTemplate === 'centered'
                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        <div>
                          <div className="h-2 bg-gray-400 rounded w-20 mb-1 mx-auto"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-32 mx-auto"></div>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-3">Centered</p>
                      <p className="text-xs text-gray-500">Orta hizalı, dengeli görünüm</p>
                    </div>
                  </button>

                  {/* Modern Template */}
                  <button
                    onClick={() => setSettings({ 
                      ...settings, 
                      headerTemplate: 'modern',
                      logoPosition: 'left',
                      namePosition: 'center',
                      descPosition: 'center',
                      logoSize: 'large'
                    })}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      settings.headerTemplate === 'modern'
                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-300 rounded"></div>
                        <div className="flex-1 text-center">
                          <div className="h-2 bg-gray-400 rounded w-20 mb-1 mx-auto"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-28 mx-auto"></div>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-3">Modern</p>
                      <p className="text-xs text-gray-500">Logo sol, içerik orta, büyük logo</p>
                    </div>
                  </button>

                  {/* Minimal Template */}
                  <button
                    onClick={() => setSettings({ 
                      ...settings, 
                      headerTemplate: 'minimal',
                      logoPosition: 'center',
                      namePosition: 'center',
                      descPosition: 'center',
                      logoSize: 'large'
                    })}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      settings.headerTemplate === 'minimal'
                        ? 'border-primary-600 bg-primary-50 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400 hover:shadow'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gray-300 rounded"></div>
                        <div className="h-2 bg-gray-400 rounded w-24 mx-auto"></div>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-3">Minimal</p>
                      <p className="text-xs text-gray-500">Sade, büyük logo, açıklama yok</p>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  💡 Şablon seçtiğinizde logo ve metin pozisyonları otomatik ayarlanır
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>📄 Ana İçerik Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker
                label="Ana Arka Plan Rengi"
                value={settings.mainBgColor}
                onChange={(val: string) => setSettings({ ...settings, mainBgColor: val })}
                description="Menü içeriğinin arka plan rengi"
              />
              <ColorPicker
                label="Ana Yazı Rengi"
                value={settings.mainTextColor}
                onChange={(val: string) => setSettings({ ...settings, mainTextColor: val })}
              />
            </CardContent>
          </Card>

          {/* Kategori Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>📁 Kategori Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase">Pasif Kategori</p>
                <ColorPicker
                  label="Arka Plan Rengi"
                  value={settings.categoryBgColor}
                  onChange={(val: string) => setSettings({ ...settings, categoryBgColor: val })}
                />
                <ColorPicker
                  label="Yazı Rengi"
                  value={settings.categoryTextColor}
                  onChange={(val: string) => setSettings({ ...settings, categoryTextColor: val })}
                />
              </div>
              
              <div className="bg-primary-50 p-3 rounded-lg space-y-3">
                <p className="text-xs font-semibold text-primary-700 uppercase">Aktif Kategori</p>
                <ColorPicker
                  label="Arka Plan Rengi"
                  value={settings.categoryActiveBgColor}
                  onChange={(val: string) => setSettings({ ...settings, categoryActiveBgColor: val })}
                />
                <ColorPicker
                  label="Yazı Rengi"
                  value={settings.categoryActiveTextColor}
                  onChange={(val: string) => setSettings({ ...settings, categoryActiveTextColor: val })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Buton Stili</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['rounded', 'pill', 'square'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSettings({ ...settings, categoryStyle: style })}
                      className={`p-3 border-2 transition-all text-sm font-medium ${
                        settings.categoryStyle === style
                          ? 'border-primary-600 bg-primary-50 text-gray-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-900'
                      } ${
                        style === 'rounded' ? 'rounded-lg' : style === 'pill' ? 'rounded-full' : 'rounded-none'
                      }`}
                    >
                      {style === 'rounded' ? 'Yuvarlak' : style === 'pill' ? 'Hap' : 'Kare'}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>🎭 Footer Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorPicker
                label="Footer Arka Plan Rengi"
                value={settings.footerBgColor}
                onChange={(val: string) => setSettings({ ...settings, footerBgColor: val })}
              />
              <ColorPicker
                label="Footer Yazı Rengi"
                value={settings.footerTextColor}
                onChange={(val: string) => setSettings({ ...settings, footerTextColor: val })}
              />
              
              <div className="border-2 border-green-200 rounded-lg p-4 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏷️</span>
                      <div className="text-sm font-semibold text-gray-900">"Powered by {siteName}"</div>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Premium Özellik</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      Menü altında <span className="font-medium text-gray-900">"Powered by {siteName}"</span> yazısı her zaman gösterilir.
                      <br />
                      <span className="text-gray-500 italic">Not: "{siteName}" ismi Admin → Ayarlar'dan değiştirilebilir.</span>
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs">
                      <span className="text-gray-600">Önizleme:</span>
                      <span className="font-medium text-gray-900">
                        Powered by <span style={{ color: settings.primaryColor }}>{siteName}</span>
                      </span>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center ml-4 flex-shrink-0 opacity-60 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sosyal Medya Linkleri</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Facebook URL"
                    value={settings.socialLinks.facebook || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm"
                  />
                  <input
                    type="url"
                    placeholder="Instagram URL"
                    value={settings.socialLinks.instagram || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm"
                  />
                  <input
                    type="url"
                    placeholder="Twitter URL"
                    value={settings.socialLinks.twitter || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp (5551234567)"
                    value={settings.socialLinks.whatsapp || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialLinks: { ...settings.socialLinks, whatsapp: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Görünüm & Display */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Görünüm Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Görünüm Tipi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSettings({ ...settings, viewType: 'card' })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      settings.viewType === 'card'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">🃏</div>
                    <div className="font-medium text-gray-900">Kart</div>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, viewType: 'list' })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      settings.viewType === 'list'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">📋</div>
                    <div className="font-medium text-gray-900">Liste</div>
                  </button>
                </div>
              </div>

              {settings.viewType === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satır Başına Ürün Sayısı
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSettings({ ...settings, itemsPerRow: num })}
                        className={`p-2 border-2 rounded-lg transition-all ${
                          settings.itemsPerRow === num
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-lg font-bold text-gray-900">{num}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">Header Göster</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showHeader}
                    onChange={(e) => setSettings({ ...settings, showHeader: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">Footer Göster</div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showFooter}
                    onChange={(e) => setSettings({ ...settings, showFooter: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Conditional: Kart veya Liste Ayarları */}
          {settings.viewType === 'card' ? (
            <Card>
              <CardHeader>
                <CardTitle>🃏 Kart Görünümü Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker
                  label="Kart Arka Plan Rengi"
                  value={settings.cardBgColor}
                  onChange={(val: string) => setSettings({ ...settings, cardBgColor: val })}
                />
                <ColorPicker
                  label="Kart Yazı Rengi"
                  value={settings.cardTextColor}
                  onChange={(val: string) => setSettings({ ...settings, cardTextColor: val })}
                />
                <ColorPicker
                  label="Fiyat Rengi"
                  value={settings.cardPriceColor}
                  onChange={(val: string) => setSettings({ ...settings, cardPriceColor: val })}
                  description="Ürün fiyatlarının gösterim rengi"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kart Köşe Yuvarlakliği</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'small', 'medium', 'large'] as const).map((radius) => (
                      <button
                        key={radius}
                        onClick={() => setSettings({ ...settings, cardBorderRadius: radius })}
                        className={`p-2 border-2 transition-all ${
                          settings.cardBorderRadius === radius
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        } ${
                          radius === 'none' ? 'rounded-none' : radius === 'small' ? 'rounded' : radius === 'medium' ? 'rounded-lg' : 'rounded-2xl'
                        }`}
                      >
                        <span className="text-xs text-gray-900">
                          {radius === 'none' ? 'Yok' : radius === 'small' ? 'Küçük' : radius === 'medium' ? 'Orta' : 'Büyük'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kart Gölgesi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'small', 'medium', 'large'] as const).map((shadow) => (
                      <button
                        key={shadow}
                        onClick={() => setSettings({ ...settings, cardShadow: shadow })}
                        className={`p-2 border-2 rounded-lg transition-all ${
                          settings.cardShadow === shadow
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        } ${
                          shadow === 'none' ? '' : shadow === 'small' ? 'shadow-sm' : shadow === 'medium' ? 'shadow-md' : 'shadow-lg'
                        }`}
                      >
                        <span className="text-xs text-gray-900">
                          {shadow === 'none' ? 'Yok' : shadow === 'small' ? 'Küçük' : shadow === 'medium' ? 'Orta' : 'Büyük'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Hover Efekti</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.cardHoverEffect}
                      onChange={(e) => setSettings({ ...settings, cardHoverEffect: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>📋 Liste Görünümü Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker
                  label="Liste Arka Plan Rengi"
                  value={settings.listBgColor}
                  onChange={(val: string) => setSettings({ ...settings, listBgColor: val })}
                />
                <ColorPicker
                  label="Liste Yazı Rengi"
                  value={settings.listTextColor}
                  onChange={(val: string) => setSettings({ ...settings, listTextColor: val })}
                />
              </CardContent>
            </Card>
          )}

          {/* Image Settings */}
          <Card>
            <CardHeader>
              <CardTitle>🖼️ Görsel Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görsel En-Boy Oranı</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1:1', '4:3', '16:9', 'auto'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setSettings({ ...settings, imageAspectRatio: ratio })}
                      className={`p-2 border-2 rounded-lg transition-all ${
                        settings.imageAspectRatio === ratio
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs text-gray-900">{ratio}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görsel Sığdırma</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cover', 'contain'] as const).map((fit) => (
                    <button
                      key={fit}
                      onClick={() => setSettings({ ...settings, imageObjectFit: fit })}
                      className={`p-2 border-2 rounded-lg transition-all ${
                        settings.imageObjectFit === fit
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs text-gray-900">
                        {fit === 'cover' ? 'Kapla' : 'Sığdır'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spacing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>📏 Boşluk Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İçerik Padding</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'relaxed'] as const).map((padding) => (
                    <button
                      key={padding}
                      onClick={() => setSettings({ ...settings, contentPadding: padding })}
                      className={`p-2 border-2 rounded-lg transition-all ${
                        settings.contentPadding === padding
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs text-gray-900">
                        {padding === 'compact' ? 'Sıkı' : padding === 'normal' ? 'Normal' : 'Gevşek'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kart Arası Boşluk</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((gap) => (
                    <button
                      key={gap}
                      onClick={() => setSettings({ ...settings, cardGap: gap })}
                      className={`p-2 border-2 rounded-lg transition-all ${
                        settings.cardGap === gap
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs text-gray-900">
                        {gap === 'small' ? 'Küçük' : gap === 'medium' ? 'Orta' : 'Büyük'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency & Localization */}
          <Card>
            <CardHeader>
              <CardTitle>💰 Para Birimi Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi Sembolü</label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  placeholder="₺"
                  maxLength={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sembol Pozisyonu</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['before', 'after'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setSettings({ ...settings, currencyPosition: pos })}
                      className={`p-2 border-2 rounded-lg transition-all ${
                        settings.currencyPosition === pos
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xs text-gray-900">
                        {pos === 'before' ? '₺ 100' : '100 ₺'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Gelişmiş Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Animasyonlar</div>
                  <div className="text-xs text-gray-600">Hover ve geçiş efektleri</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAnimations}
                    onChange={(e) => setSettings({ ...settings, enableAnimations: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Arama Çubuğu</div>
                  <div className="text-xs text-gray-600">Ürün arama özelliği</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showSearch}
                    onChange={(e) => setSettings({ ...settings, showSearch: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button 
              onClick={handleSave} 
              isLoading={isSaving} 
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all text-base py-3 font-semibold"
            >
              {isSaving ? '💾 Kaydediliyor...' : '💾 Ayarları Kaydet'}
            </Button>
          </div>
        </div>

        {/* Sağ Taraf - Önizleme */}
        <div className="xl:col-span-1">
          <div className="sticky top-1 h-[calc(100vh-100px)] overflow-hidden">
            <Card className="border-2 border-primary-100 shadow-xl h-full flex flex-col">
              <CardHeader className="border-b border-primary-100 bg-gradient-to-br from-white to-primary-50/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">👁️</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Canlı Önizleme</CardTitle>
                      <p className="text-xs text-gray-600 mt-0.5">Anlık görünüm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Canlı</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                <div className="relative">
                  {/* iPhone Frame */}
                  <div className="relative w-[380px] h-[650px] bg-gray-900 rounded-[3.5rem] shadow-2xl p-3 border-[14px] border-gray-800">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[28px] bg-gray-900 rounded-b-3xl z-20"></div>
                    
                    {/* Dynamic Island */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-[120px] h-[20px] bg-black rounded-full z-30 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    </div>
                    
                    {/* Screen */}
                    <div className="w-full h-full bg-white rounded-[2.3rem] overflow-hidden relative">
                      <style dangerouslySetInnerHTML={{
                        __html: `
                          .preview-frame {
                            scrollbar-width: none;
                            -ms-overflow-style: none;
                          }
                          .preview-frame::-webkit-scrollbar {
                            display: none;
                          }
                        `
                      }} />
                      <iframe
                        key={previewUrl}
                        src={previewUrl}
                        className="w-full h-full preview-frame"
                        title="Menu Preview"
                      />
                    </div>
                    
                    {/* Side Buttons */}
                    <div className="absolute -left-[2px] top-[140px] w-1 h-14 bg-gray-800 rounded-l-lg"></div>
                    <div className="absolute -left-[2px] top-[210px] w-1 h-20 bg-gray-800 rounded-l-lg"></div>
                    <div className="absolute -left-[2px] top-[290px] w-1 h-20 bg-gray-800 rounded-l-lg"></div>
                    <div className="absolute -right-[2px] top-[240px] w-1 h-24 bg-gray-800 rounded-r-lg"></div>
                  </div>
                  
                  {/* Reflection Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[3.5rem] pointer-events-none"></div>
                  
                  {/* Glow Effect */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/30 via-purple-500/20 to-pink-500/30 blur-2xl -z-10 opacity-60"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
