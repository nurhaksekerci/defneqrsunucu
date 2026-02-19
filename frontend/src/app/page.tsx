'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService, User } from '@/lib/auth';
import api from '@/lib/api';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
}

interface Plan {
  id: string;
  name: string;
  type: 'FREE' | 'PREMIUM' | 'CUSTOM';
  price: number;
  maxRestaurants: number;
  maxCategories: number;
  maxProducts: number;
  canRemoveBranding: boolean;
  isPopular: boolean;
  extraRestaurantPrice: number;
  description: string | null;
  features: any;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Defne Qr',
    siteDescription: 'QR Menü ve Restoran Yönetim Sistemi'
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [restaurantCount, setRestaurantCount] = useState(2);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    const loadSettings = async () => {
      try {
        const response = await api.get('/settings');
        const systemSettings = response.data.data;
        setSettings({
          siteName: systemSettings.siteName || 'Defne Qr',
          siteDescription: systemSettings.siteDescription || 'QR Menü ve Restoran Yönetim Sistemi'
        });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    const loadPlans = async () => {
      try {
        const response = await api.get('/plans');
        setPlans(response.data.data || []);
      } catch (error) {
        console.error('Failed to load plans:', error);
      }
    };

    checkAuth();
    loadSettings();
    loadPlans();
  }, []);

  const calculatePrice = (plan: Plan, count: number) => {
    return plan.price + ((count - 1) * plan.extraRestaurantPrice);
  };

  const handleCalculateClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setRestaurantCount(2);
    setShowCalculator(true);
  };

  const features = [
    {
      icon: '📱',
      title: 'QR Menü Sistemi',
      description: 'Müşterileriniz telefon kameralarıyla QR kodu okutarak dijital menünüzü anında görüntüleyebilir. Temassız, hızlı ve güvenli.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🎨',
      title: 'Tam Özelleştirme',
      description: 'Menünüzün renklerini, fontlarını, düzenini dilediğiniz gibi özelleştirin. 4 hazır tema veya kendi markanıza özel tasarım.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🏪',
      title: 'Restoran Yönetimi',
      description: 'Tek bir panelden birden fazla restoranınızı yönetin. Her restoran için ayrı menü, kategori ve ürün tanımlamaları.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '📦',
      title: 'Kategori & Ürün Yönetimi',
      description: 'Sürükle-bırak ile kategorileri ve ürünleri sıralayın. Görselli ürün kartları, fiyat yönetimi, aktif/pasif durum kontrolü.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🎯',
      title: 'Global Katalog',
      description: 'Hazır kategori ve ürün şablonları. Yemek, içecek, tatlı kategorilerini tek tıkla kopyalayın, kendi ürünlerinizi ekleyin.',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: '📊',
      title: 'Detaylı Raporlar',
      description: 'QR menü tarama istatistikleri, saatlik/günlük/aylık analizler, en yoğun saatler, grafik ve tablolarla veri görselleştirme.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: '📈',
      title: 'QR Tarama Analizi',
      description: 'Her menü taraması kaydedilir. Bugün, bu ay, bu yıl tarama sayıları, saatlik dağılım grafikleri, tarih bazlı filtreleme.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: '🔒',
      title: 'Güvenli & Hızlı',
      description: 'Rol tabanlı yetkilendirme, güvenli kimlik doğrulama, hızlı sunucu yanıt süreleri, modern teknoloji altyapısı.',
      color: 'from-gray-700 to-gray-900'
    },
    {
      icon: '📲',
      title: 'Mobil Uyumlu',
      description: 'Telefon, tablet ve bilgisayarda mükemmel görüntüleme. Responsive tasarım, dokunmatik ekran optimizasyonu.',
      color: 'from-blue-600 to-indigo-600'
    },
    {
      icon: '⚡',
      title: 'Anlık Önizleme',
      description: 'Menü ayarlarınızı değiştirirken canlı önizleme. Kaydetmeden görün, beğenirseniz uygulayın.',
      color: 'from-amber-500 to-yellow-500'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Kayıt Olun',
      description: 'Ücretsiz hesap oluşturun ve restoranınızı sisteme ekleyin'
    },
    {
      number: '2',
      title: 'Menünüzü Oluşturun',
      description: 'Global katalogdan hazır şablonları kopyalayın veya sıfırdan ürün ekleyin'
    },
    {
      number: '3',
      title: 'Özelleştirin',
      description: '4 hazır tema veya özel tasarım ile menünüzü markanıza uyarlayın'
    },
    {
      number: '4',
      title: 'QR Kodunuzu Kullanın',
      description: 'QR kodunu masalarınıza yerleştirin ve müşterileriniz dijital menünüzü görüntülesin'
    }
  ];

  const useCases = [
    { icon: '🍽️', title: 'Restoranlar', desc: 'Yemek menüleri' },
    { icon: '☕', title: 'Kafeler', desc: 'İçecek listeleri' },
    { icon: '🍕', title: 'Fast Food', desc: 'Hızlı servis' },
    { icon: '🍰', title: 'Pastaneler', desc: 'Tatlı & Pasta' },
    { icon: '🍺', title: 'Bar & Pub', desc: 'İçki menüleri' },
    { icon: '🏨', title: 'Oteller', desc: 'Oda servisi' }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt={settings.siteName}
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700 text-sm sm:text-base hidden sm:inline">Hoş geldiniz, {user.fullName}</span>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 text-gray-700 hover:text-gray-900 transition text-sm sm:text-base"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Restoranlar için Modern Dijital Çözüm
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {settings.siteDescription}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Restoranınızı tamamen dijitalleştirin. Özelleştirilebilir QR menü, kapsamlı ürün yönetimi ve detaylı 
              tarama analizi özellikleriyle işletmenizi bir üst seviyeye taşıyın.
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center gap-2">
                    Ücretsiz Başla
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-white text-gray-900 text-lg rounded-xl hover:bg-gray-50 transition-all shadow-lg border-2 border-gray-200 hover:border-gray-300 w-full sm:w-auto"
                >
                  Giriş Yap
                </Link>
              </div>
            )}

            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Kurulum Gerektirmez</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Anında Kullanıma Hazır</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Tüm Cihazlarda Çalışır</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Her Tür İşletme İçin</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white p-4 rounded-xl text-center hover:shadow-lg transition-all border border-gray-200 hover:border-primary-300">
                <div className="text-3xl mb-2">{useCase.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{useCase.title}</div>
                <div className="text-xs text-gray-600 mt-1">{useCase.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Dijital Menü Yönetimi İçin Her Şey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              QR menü oluşturmak, özelleştirmek ve yönetmek için ihtiyacınız olan tüm özellikler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                <div className="relative">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-lg text-gray-600">
              4 basit adımda dijital restorana dönüşün
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-300 to-primary-200 z-0"></div>
                )}
                <div className="relative bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 mx-auto shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Size Uygun Planı Seçin
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              İşletmenizin ihtiyaçlarına göre esnek fiyatlandırma seçenekleri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isPremium = plan.isPopular;
              // Features is already parsed by Prisma, no need for JSON.parse
              const featuresList = plan.features || [];
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 hover:shadow-xl transition-all flex flex-col ${
                    isPremium 
                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 transform hover:-translate-y-2 border-4 border-primary-400' 
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {isPremium && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-xs font-bold">
                        ⭐ EN POPÜLER
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className={`text-2xl font-bold mb-2 ${isPremium ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className={`text-5xl font-bold ${isPremium ? 'text-white' : 'text-gray-900'}`}>
                        ₺{plan.price.toLocaleString('tr-TR')}
                      </span>
                      {plan.extraRestaurantPrice > 0 && (
                        <span className={`text-xl ${isPremium ? 'text-white' : 'text-gray-600'}`}>+</span>
                      )}
                    </div>
                    {plan.price > 0 && (
                      <p className={`text-sm mb-4 ${isPremium ? 'text-primary-100' : 'text-gray-600'}`}>
                        / yıl
                      </p>
                    )}
                    {plan.extraRestaurantPrice > 0 && (
                      <p className={`text-xs mb-4 ${isPremium ? 'text-white' : 'text-gray-600'}`}>
                        + Her ek işletme için ₺{plan.extraRestaurantPrice.toLocaleString('tr-TR')}
                      </p>
                    )}
                    {plan.description && (
                      <p className={`text-sm ${isPremium ? 'text-white' : 'text-gray-600'}`}>
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Spacer - boşluk üstte kalması için */}
                  <div className="flex-grow"></div>

                  <ul className="space-y-4">
                    {/* İşletme */}
                    <li className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${isPremium ? 'text-white' : 'text-gray-700'}`}>
                        <span className="font-semibold">
                          {plan.maxRestaurants === 999999 ? 'Çoklu İşletme' : `${plan.maxRestaurants} İşletme`}
                        </span>
                      </span>
                    </li>
                    {/* Kategori */}
                    <li className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${isPremium ? 'text-white' : 'text-gray-700'}`}>
                        <span className="font-semibold">
                          {plan.maxCategories === 999999 ? 'Sınırsız' : plan.maxCategories} Kategori
                        </span>
                      </span>
                    </li>
                    {/* Ürün */}
                    <li className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${isPremium ? 'text-white' : 'text-gray-700'}`}>
                        <span className="font-semibold">
                          {plan.maxProducts === 999999 ? 'Sınırsız' : plan.maxProducts} Ürün
                        </span>
                      </span>
                    </li>
                    {/* Global Katalog */}
                    <li className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${isPremium ? 'text-white' : 'text-gray-700'}`}>
                        Global Kategori & Ürün
                      </span>
                    </li>
                    {/* Detaylı Grafikler */}
                    <li className="flex items-start gap-3">
                      <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${isPremium ? 'text-white' : 'text-gray-700'}`}>
                        Detaylı Grafikler
                      </span>
                    </li>
                    {/* Powered by kaldırma */}
                    <li className="flex items-start gap-3">
                      {plan.canRemoveBranding ? (
                        <>
                          <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isPremium ? 'text-yellow-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className={`text-sm font-semibold ${isPremium ? 'text-white' : 'text-gray-700'}`}>
                            ✨ Powered by kaldırma
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-500 text-sm line-through">Powered by kaldırma</span>
                        </>
                      )}
                    </li>
                  </ul>

                  <div className="mt-auto pt-2.5">
                    {plan.type === 'CUSTOM' ? (
                      <button
                        onClick={() => handleCalculateClick(plan)}
                        className="block w-full py-3 px-6 text-center font-semibold rounded-xl transition-all bg-primary-600 text-white hover:bg-primary-700"
                      >
                        Hesapla
                      </button>
                    ) : (
                      <Link
                        href="/auth/register"
                        className={`block w-full py-3 px-6 text-center font-semibold rounded-xl transition-all ${
                          isPremium
                            ? 'bg-white text-primary-700 hover:bg-gray-50 shadow-lg'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {plan.type === 'FREE' ? 'Hemen Başla' : "Premium'a Geç"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 text-sm">
              💳 Tüm planlar yıllık ödeme ile geçerlidir. Fiyatlar KDV dahildir.
            </p>
          </div>
        </div>
      </section>

      {/* Price Calculator Modal */}
      {showCalculator && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCalculator(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowCalculator(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🧮</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Fiyat Hesaplama</h3>
              <p className="text-gray-600">{selectedPlan.name} Plan</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kaç işletme eklemek istiyorsunuz?
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={restaurantCount}
                  onChange={(e) => setRestaurantCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-center text-lg font-semibold"
                />
                <div className="flex justify-center gap-2 mt-3">
                  <button
                    onClick={() => setRestaurantCount(Math.max(1, restaurantCount - 1))}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setRestaurantCount(restaurantCount + 1)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6 border-2 border-primary-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Temel Paket (1 işletme dahil):</span>
                    <span className="font-semibold">₺{selectedPlan.price.toLocaleString('tr-TR')}</span>
                  </div>
                  {restaurantCount > 1 && (
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>{restaurantCount - 1} ek işletme x ₺{selectedPlan.extraRestaurantPrice.toLocaleString('tr-TR')}:</span>
                      <span className="font-semibold">₺{((restaurantCount - 1) * selectedPlan.extraRestaurantPrice).toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-primary-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Toplam (Yıllık):</span>
                      <span className="text-3xl font-bold text-primary-600">
                        ₺{calculatePrice(selectedPlan, restaurantCount).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/register"
                  className="block w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
                >
                  Hemen Kayıt Ol
                </Link>
                <p className="text-xs text-gray-500 mt-3">
                  Kayıt olduktan sonra planınızı seçebilirsiniz
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Hemen Dijitalleşmeye Başlayın
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Ücretsiz hesap oluşturun, restoranınızı ekleyin, menünüzü özelleştirin ve QR kodunuzu hemen kullanmaya başlayın.
          </p>
          {!user && (
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              Ücretsiz Dene
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt={settings.siteName}
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {settings.siteDescription} - Restoranınızı dijitalleştirmenin en kolay yolu.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hızlı Bağlantılar</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/auth/register" className="hover:text-white transition">Kayıt Ol</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition">Giriş Yap</Link></li>
                {user && <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Özellikler</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Özelleştirilebilir QR Menü</li>
                <li>Global Katalog</li>
                <li>Ürün Yönetimi</li>
                <li>Detaylı Raporlar</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {settings.siteName}. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </main>
  );
}
