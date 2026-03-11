'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService, User } from '@/lib/auth';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService.getCurrentUser().then(setUser).catch(() => setUser(null));
    }
  }, []);

  const features = [
    { icon: '📅', title: 'Takvim Yönetimi', desc: 'Günlük ve haftalık takvim görünümü' },
    { icon: '👥', title: 'Personel Yönetimi', desc: 'Personel ve çalışma saatleri' },
    { icon: '✂️', title: 'Hizmet Yönetimi', desc: 'Hizmet, süre ve fiyat tanımlama' },
    { icon: '📱', title: 'SMS Hatırlatma', desc: 'Randevu hatırlatmaları' },
    { icon: '👤', title: 'Müşteri Takibi', desc: 'Müşteri geçmişi ve notlar' },
  ];

  const useCases = [
    { icon: '✂️', title: 'Kuaför', desc: 'Saç kesimi, boya' },
    { icon: '💇', title: 'Berber', desc: 'Sakal, tıraş' },
    { icon: '💅', title: 'Güzellik', desc: 'Manikür, cilt bakımı' },
    { icon: '🦷', title: 'Diş Kliniği', desc: 'Kontrol, tedavi' },
    { icon: '🧘', title: 'Danışmanlık', desc: 'Psikolog, koçluk' },
    { icon: '💆', title: 'Masaj', desc: 'Spa, masaj salonu' },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary-600">DefneRandevu</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-700 text-sm hidden sm:inline">Hoş geldiniz, {user.fullName}</span>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Panel
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="px-3 py-2 text-gray-700 hover:text-gray-900 transition text-sm">
                    Giriş Yap
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Kayıt Ol
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Randevu Yönetim Sistemi
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Randevu Yönetim Sisteminiz
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Kuaför, berber, klinik ve daha fazlası için. Personel, hizmet ve takvim yönetimi ile randevularınızı kolayca organize edin.
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Panel&apos;e Git
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 w-full sm:w-auto text-center"
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
                  className="px-8 py-4 bg-white text-gray-900 text-lg rounded-xl hover:bg-gray-50 transition-all shadow-lg border-2 border-gray-200 hover:border-gray-300 w-full sm:w-auto text-center"
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
                <span>Kolay Kurulum</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>SMS Hatırlatma</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Mobil Uyumlu</span>
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
            {useCases.map((uc, i) => (
              <div key={i} className="bg-white p-4 rounded-xl text-center hover:shadow-lg transition-all border border-gray-200 hover:border-primary-300">
                <div className="text-3xl mb-2">{uc.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{uc.title}</div>
                <div className="text-xs text-gray-600 mt-1">{uc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Randevu Yönetimi İçin Her Şey</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Personel, hizmet ve takvim yönetimi ile randevularınızı kolayca organize edin
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <div
                key={i}
                className="group bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300"
              >
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Hemen Randevu Sistemine Başlayın
          </h2>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Ücretsiz hesap oluşturun, işletmenizi ekleyin ve randevularınızı yönetmeye başlayın.
          </p>
          {!user && (
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-2xl"
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
              <div className="font-bold text-primary-400 mb-4">DefneRandevu</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Randevu yönetim sisteminiz. Kuaför, berber, klinik ve daha fazlası için.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hızlı Bağlantılar</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/auth/register" className="hover:text-white transition">Kayıt Ol</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition">Giriş Yap</Link></li>
                {user && <li><Link href="/dashboard" className="hover:text-white transition">Panel</Link></li>}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Özellikler</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Takvim Yönetimi</li>
                <li>Personel & Hizmet</li>
                <li>SMS Hatırlatma</li>
                <li>Müşteri Takibi</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} DefneRandevu. Geçici adres: randevu.defneqr.com — Yakında defnerandevu.com
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
