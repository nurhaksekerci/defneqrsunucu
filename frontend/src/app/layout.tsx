import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { GoogleAnalytics, GoogleTagManager, GoogleTagManagerNoScript, Analytics } from '@/components/Analytics'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://defneqr.com'),
  title: {
    default: 'QR Menü ve Dijital Menü Sistemi | Defne Qr - 5 Dakikada Hazır!',
    template: '%s | Defne Qr',
  },
  description: '1000+ Hazır Katalog! 🚀 QR menü ile 5 dakikada restoranınızı dijitalleştirin. Hazır ürün şablonları, tek tıkla kopyala, anında yayına al. ⚡ Hızlı kurulum ✨ Sınırsız özelleştirme 📊 Detaylı QR tarama analizi. Ücretsiz deneyin!',
  keywords: [
    'qr menü',
    'dijital menü',
    'hazır menü şablonu',
    'qr kod menü',
    'restoran qr menü',
    'dijital menü sistemi',
    'hızlı qr menü',
    'qr menü şablon',
    'temassız menü',
    'mobil menü',
    'restoran dijitalleşme',
    'qr menü fiyat',
    '5 dakikada qr menü',
    'hazır qr menü',
    'en iyi qr menü',
    'kafe qr menü',
    'otel qr menü',
    'qr menü oluşturma',
    'ücretsiz qr menü',
    'dijital menü hazır',
    'restoran yönetim sistemi'
  ],
  authors: [{ name: 'Defne Qr', url: 'https://defneqr.com' }],
  creator: 'Defne Qr',
  publisher: 'Defne Qr',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://defneqr.com',
    siteName: 'Defne Qr',
    title: 'QR Menü - 1000+ Hazır Katalog! 5 Dakikada Restoranınızı Dijitalleştirin',
    description: '1000+ hazır ürün şablonu! Tek tıkla kopyala, anında yayına al. QR menü ile 5 dakikada restoranınızı dijitalleştirin. Hazır kataloglar, sınırsız özelleştirme, detaylı analitik. Ücretsiz deneyin!',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Defne Qr - 1000+ Hazır Katalog ile 5 Dakikada QR Menü',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@defneqr',
    creator: '@defneqr',
    title: 'QR Menü - 1000+ Hazır Katalog! 5 Dakikada Restoranınızı Dijitalleştirin',
    description: '1000+ hazır ürün şablonu! Tek tıkla kopyala, 5 dakikada restoranınızı dijitalleştirin. Hazır kataloglar, sınırsız özelleştirme, detaylı analitik.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://defneqr.com',
    languages: {
      'tr-TR': 'https://defneqr.com',
      'en-US': 'https://defneqr.com/en',
    },
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Defne Qr',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      description: 'Ücretsiz deneme - Hazır kataloglarla 5 dakikada kurulum',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
    description: '1000+ hazır katalog ile 5 dakikada QR menü oluşturun. Tek tıkla kopyala, anında yayına al. Restoranınızı dijitalleştirmenin en hızlı yolu!',
    featureList: [
      '1000+ Hazır Ürün Katalogları',
      '5 Dakikada Kurulum',
      'Tek Tıkla Ürün Kopyalama',
      'Sınırsız Özelleştirme (Renk, Font, Layout)',
      'Detaylı QR Tarama Analizi',
      'Çoklu Restoran Yönetimi',
      'Anlık Önizleme',
      'Mobil Uyumlu QR Menü',
      'Kategori ve Ürün Yönetimi',
    ],
    url: 'https://defneqr.com',
    image: 'https://defneqr.com/og-image.jpg',
    author: {
      '@type': 'Organization',
      name: 'Defne Qr',
      url: 'https://defneqr.com',
      logo: 'https://defneqr.com/logo/DefneQr.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'destek@defneqr.com',
        contactType: 'customer support',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English'],
      },
    },
  }

  return (
    <html lang="tr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GoogleAnalytics />
        <GoogleTagManager />
      </head>
      <body className={inter.className}>
        <GoogleTagManagerNoScript />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
