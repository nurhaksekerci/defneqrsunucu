'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

interface SystemStats {
  totalRestaurants: number;
  totalUsers: number;
  totalCategories: number;
  totalProducts: number;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  duration: string;
  application: {
    name: string;
    version: string;
    environment: string;
    nodeVersion: string;
    uptime: string;
  };
  checks: {
    database: {
      status: string;
      message: string;
      responseTime: string;
    };
    system: {
      status: string;
      message: string;
      details: {
        memory: {
          total: string;
          free: string;
          used: string;
          usagePercent: string;
        };
        cpu: {
          percent: string;
        };
        process: {
          uptime: string;
          pid: number;
        };
      };
    };
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalRestaurants: 0,
    totalUsers: 0,
    totalCategories: 0,
    totalProducts: 0
  });
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadHealth();
    
    // Auto-refresh health every 30 seconds
    const interval = setInterval(() => {
      loadHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Restoranları al
      const restaurantsRes = await api.get('/restaurants');
      const restaurants = restaurantsRes.data.data;

      // Global kategorileri al
      const categoriesRes = await api.get('/categories?isGlobal=true');
      const categories = categoriesRes.data.data;

      // Global ürünleri al
      const productsRes = await api.get('/products?isGlobal=true');
      const products = productsRes.data.data;

      setStats({
        totalRestaurants: restaurants.length,
        totalUsers: restaurants.reduce((sum: number, r: any) => sum + 1, 0),
        totalCategories: categories.length,
        totalProducts: products.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const response = await api.get('/health/detailed');
      setHealth(response.data);
    } catch (error) {
      console.error('Failed to load health:', error);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
      case 'ready':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'unhealthy':
      case 'error':
        return '❌';
      default:
        return '❓';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Sistem geneli istatistikler ve yönetim</p>
      </div>

      {/* System Health Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">🏥 Sistem Sağlığı</h2>
          <button
            onClick={loadHealth}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            disabled={healthLoading}
          >
            {healthLoading ? 'Yükleniyor...' : '🔄 Yenile'}
          </button>
        </div>

        {healthLoading && !health ? (
          <Card>
            <CardContent>
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            </CardContent>
          </Card>
        ) : health && health.status ? (
          <>
            {/* Overall Status */}
            <Card className="mb-4">
              <CardContent>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{getStatusIcon(health.status)}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Genel Durum: <span className={`${getStatusColor(health.status)} px-3 py-1 rounded-full text-sm`}>
                          {health.status?.toUpperCase()}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {health.application?.name} v{health.application?.version} • {health.application?.environment}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Sistem Çalışma Süresi</p>
                    <p className="text-lg font-bold text-gray-900">{health.application?.uptime}</p>
                    <p className="text-xs text-gray-500 mt-1">Node {health.application?.nodeVersion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Database Health */}
              {health.checks?.database && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>💾 Veritabanı</span>
                      <span className={`text-2xl ${getStatusColor(health.checks.database.status)} px-2 py-1 rounded-full text-xs`}>
                        {getStatusIcon(health.checks.database.status)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{health.checks.database.message}</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Yanıt Süresi:</span>
                        <span className="font-medium text-gray-900">{health.checks.database.responseTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Memory Usage */}
              {health.checks?.system?.details?.memory && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>🧠 Bellek Kullanımı</span>
                      <span className={`text-2xl ${getStatusColor(health.checks.system.status)} px-2 py-1 rounded-full text-xs`}>
                        {getStatusIcon(health.checks.system.status)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Toplam:</span>
                        <span className="font-medium text-gray-900">{health.checks.system.details.memory.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Kullanılan:</span>
                        <span className="font-medium text-gray-900">{health.checks.system.details.memory.used}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Boş:</span>
                        <span className="font-medium text-gray-900">{health.checks.system.details.memory.free}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Kullanım Oranı:</span>
                          <span className={`font-bold ${
                            parseFloat(health.checks.system.details.memory.usagePercent) > 80 ? 'text-red-600' :
                            parseFloat(health.checks.system.details.memory.usagePercent) > 60 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {health.checks.system.details.memory.usagePercent}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(health.checks.system.details.memory.usagePercent) > 80 ? 'bg-red-600' :
                              parseFloat(health.checks.system.details.memory.usagePercent) > 60 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: health.checks.system.details.memory.usagePercent }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CPU Usage */}
              {health.checks?.system?.details?.cpu && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>⚡ CPU Kullanımı</span>
                      <span className={`text-2xl ${getStatusColor(health.checks.system.status)} px-2 py-1 rounded-full text-xs`}>
                        {getStatusIcon(health.checks.system.status)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Sistem CPU:</span>
                          <span className={`font-bold ${
                            parseFloat(health.checks.system.details.cpu.percent) > 80 ? 'text-red-600' :
                            parseFloat(health.checks.system.details.cpu.percent) > 60 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {health.checks.system.details.cpu.percent}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(health.checks.system.details.cpu.percent) > 80 ? 'bg-red-600' :
                              parseFloat(health.checks.system.details.cpu.percent) > 60 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(parseFloat(health.checks.system.details.cpu.percent), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">CPU Çekirdek:</span>
                          <span className="font-medium text-gray-900">{health.checks.system.details.cpu.cores}</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Load Avg (1m):</span>
                          <span className="font-medium text-gray-900">{health.checks.system.details.cpu.loadAverage?.['1min']}</span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Process CPU:</span>
                          <span className="font-medium text-gray-900">{health.checks.system.details.cpu.process?.percent}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Process ID:</span>
                          <span className="font-medium text-gray-900">{health.checks.system.details.process?.pid}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Last Update Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Son güncelleme: {health.timestamp ? new Date(health.timestamp).toLocaleString('tr-TR') : 'N/A'} • 
                Kontrol süresi: {health.duration || 'N/A'} • 
                Otomatik yenileme: 30 saniye
              </p>
            </div>
          </>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-2">❌</div>
                <p className="text-gray-600">Sistem sağlığı bilgisi yüklenemedi</p>
                <button
                  onClick={loadHealth}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Tekrar Dene
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Toplam Restoranlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRestaurants}</p>
            <p className="text-sm text-gray-500 mt-1">Aktif restoran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Toplam Kullanıcılar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1">Kayıtlı kullanıcı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Global Kategoriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.totalCategories}</p>
            <p className="text-sm text-gray-500 mt-1">Sistem geneli</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              Global Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{stats.totalProducts}</p>
            <p className="text-sm text-gray-500 mt-1">Sistem geneli</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Son Eklenen Restoranlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Restoran listesi buraya gelecek...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem Aktivitesi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Aktivite logları buraya gelecek...</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/categories"
                className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition text-center"
              >
                <div className="text-2xl mb-2">📁</div>
                <p className="font-medium text-gray-900">Global Kategoriler</p>
                <p className="text-sm text-gray-600">Yönet</p>
              </a>
              <a
                href="/admin/products"
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
              >
                <div className="text-2xl mb-2">🍽️</div>
                <p className="font-medium text-gray-900">Global Ürünler</p>
                <p className="text-sm text-gray-600">Yönet</p>
              </a>
              <a
                href="/admin/restaurants"
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
              >
                <div className="text-2xl mb-2">🏪</div>
                <p className="font-medium text-gray-900">Restoranlar</p>
                <p className="text-sm text-gray-600">Listele</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
