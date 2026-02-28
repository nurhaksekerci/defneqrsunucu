'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api';

interface ScanStats {
  totalScans: number;
  yearScans: number;
  monthScans: number;
  todayTotal: number;
  dailyScans: Record<string, number>;
  hourlyScans: number[];
  selectedDate?: string;
  selectedDateTotal?: number;
}

export default function ReportsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
  );
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadScanStats();
    }
  }, [selectedRestaurant, selectedDate]);

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/my');
      const restaurantList = response.data.data || [];
      setRestaurants(restaurantList);
      
      if (restaurantList.length > 0) {
        setSelectedRestaurant(restaurantList[0].id);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScanStats = async () => {
    try {
      const response = await api.get(`/scans/stats/${selectedRestaurant}?date=${selectedDate}`);
      setScanStats(response.data.data || null);
    } catch (error) {
      console.error('Failed to load scan stats:', error);
      setScanStats(null);
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
                Raporları görüntülemek için önce bir restoran oluşturmalısınız.
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Menü İstatistikleri</h1>
        <p className="text-gray-600">QR menünüzün tarama verilerini ve kullanım analizlerini görüntüleyin</p>
      </div>

      {restaurants.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restoran Seçin
          </label>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* QR Menü Tarama İstatistikleri */}
      {scanStats && (
        <div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
            {/* Toplam Tarama */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-purple-100 text-xs font-medium">Toplam Tarama</span>
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{scanStats.totalScans.toLocaleString('tr-TR')}</p>
                <p className="text-purple-100 text-xs">Tüm zamanlar</p>
              </div>
            </div>

            {/* Bu Yılki Tarama */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-rose-100 text-xs font-medium">Bu Yılki Tarama</span>
                  <span className="text-3xl">📅</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{scanStats.yearScans.toLocaleString('tr-TR')}</p>
                <p className="text-rose-100 text-xs">{new Date().getFullYear()}</p>
              </div>
            </div>

            {/* Bu Ayki Tarama */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-amber-100 text-xs font-medium">Bu Ayki Tarama</span>
                  <span className="text-3xl">📆</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{scanStats.monthScans.toLocaleString('tr-TR')}</p>
                <p className="text-amber-100 text-xs">
                  {new Date().toLocaleDateString('tr-TR', { month: 'long' })}
                </p>
              </div>
            </div>

            {/* Bugünkü Tarama */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-100 text-xs font-medium">Bugünkü Tarama</span>
                  <span className="text-3xl">📱</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{scanStats.todayTotal.toLocaleString('tr-TR')}</p>
                <p className="text-blue-100 text-xs">Son 24 saat</p>
              </div>
            </div>

            {/* En Yoğun Saat */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white opacity-5 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-emerald-100 text-xs font-medium">En Yoğun Saat</span>
                  <span className="text-3xl">⏰</span>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {scanStats.hourlyScans.indexOf(Math.max(...scanStats.hourlyScans))}:00
                </p>
                <p className="text-emerald-100 text-xs">
                  {Math.max(...scanStats.hourlyScans)} tarama
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 mb-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Saatlik Tarama Dağılımı</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDate === new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }) 
                    ? 'Bugünün saat bazlı analizi' 
                    : `${new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinin saat bazlı analizi`}
                  {scanStats.selectedDateTotal !== undefined && (
                    <span className="ml-2 font-semibold text-indigo-600">
                      ({scanStats.selectedDateTotal} tarama)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    📅 Tarih Seçin:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      max={new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white text-sm"
                    />
                    {selectedDate !== new Date().toISOString().split('T')[0] && (
                      <button
                        onClick={() => setSelectedDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }))}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Bugün
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-3xl">📈</span>
              </div>
            </div>
            <div className="w-full pb-4">
              <div className="grid grid-cols-12 sm:grid-cols-12 md:grid-cols-24 gap-1 sm:gap-2 items-end px-2" style={{ height: '300px' }}>
                {scanStats.hourlyScans.map((count, hour) => {
                  const maxCount = Math.max(...scanStats.hourlyScans, 1);
                  const heightPercent = (count / maxCount) * 100;
                  const barHeight = Math.max(heightPercent * 2.4, count > 0 ? 30 : 5);
                  
                  return (
                    <div key={hour} className="flex flex-col items-center justify-end group" style={{ height: '280px' }}>
                      <div className="flex flex-col items-center justify-end flex-1 w-full">
                        {count > 0 && (
                          <div className="text-xs font-bold text-gray-700 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-1 py-0.5 rounded whitespace-nowrap">
                            {count}
                          </div>
                        )}
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-300 hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-500 shadow-lg hover:shadow-xl relative group-hover:scale-105"
                          style={{ 
                            height: `${barHeight}px`,
                          }}
                          title={`${hour}:00 - ${count} tarama`}
                        >
                          {count > 0 && (
                            <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 rounded-t-lg"></div>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-gray-600 mt-2 whitespace-nowrap">{hour}:00</div>
                      <div className="text-[10px] sm:text-xs font-bold text-indigo-600 mt-1">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">💡 İpucu:</span> Her sütun o saatteki toplam tarama sayısını gösterir. En yüksek bar en yoğun saati temsil eder.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Son 7 Günlük Tarama Trendi</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Günlük performans karşılaştırması 
                  <span className="ml-2 text-indigo-600 font-medium">• Saatlik detay için tarihe tıklayın</span>
                </p>
              </div>
              <span className="text-3xl">📅</span>
            </div>
            {Object.keys(scanStats.dailyScans).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(scanStats.dailyScans)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([date, count], index) => {
                    const maxCount = Math.max(...Object.values(scanStats.dailyScans));
                    const percentage = (count / maxCount) * 100;
                    const isToday = date === new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
                    const isSelected = date === selectedDate;
                    
                    return (
                      <div 
                        key={date} 
                        className={`group cursor-pointer transition-all duration-200 rounded-xl p-3 -mx-3 ${
                          isSelected ? 'bg-indigo-50 border-2 border-indigo-300' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="flex items-center gap-2 sm:gap-4 mb-2">
                          <div className="w-24 sm:w-32 text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {isToday && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                            {isSelected && <span className="text-lg">👉</span>}
                            <span className={`truncate ${isSelected ? 'font-bold text-indigo-700' : ''}`}>
                              {new Date(date).toLocaleDateString('tr-TR', { 
                                day: 'numeric', 
                                month: 'short',
                                weekday: 'short'
                              })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-10 sm:h-12 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl overflow-hidden shadow-inner">
                              <div
                                className={`h-full bg-gradient-to-r flex items-center justify-between px-2 sm:px-4 text-white font-semibold transition-all duration-500 group-hover:shadow-lg relative overflow-hidden ${
                                  isSelected 
                                    ? 'from-indigo-600 via-indigo-500 to-blue-500 hover:from-indigo-700 hover:via-indigo-600 hover:to-blue-600' 
                                    : 'from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600'
                                }`}
                                style={{ 
                                  width: `${Math.max(percentage, 10)}%` 
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                                <span className="text-xs sm:text-sm relative z-10 truncate">{count} tarama</span>
                                {percentage === 100 && (
                                  <span className="text-base sm:text-lg relative z-10 ml-1">🏆</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-12 sm:w-16 text-right flex-shrink-0">
                            <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">💡 İpucu:</span> Herhangi bir tarihe tıklayarak o günün saatlik tarama dağılımını yukarıdaki grafikte görebilirsiniz.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <span className="text-6xl mb-4 block">📊</span>
                <p className="text-gray-600 font-medium">Henüz tarama verisi bulunmuyor</p>
                <p className="text-sm text-gray-500 mt-2">QR menünüz tarandığında veriler burada görünecek</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
