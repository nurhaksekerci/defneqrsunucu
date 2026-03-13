# Defne Qr Frontend — Proje Detayı

## Genel Bakış

**Defne Qr Frontend**, restoranların QR menü oluşturması, yönetmesi ve müşterilere sunması için geliştirilmiş, Next.js tabanlı bir web uygulamasıdır. Ana site **defneqr.com** üzerinden yayınlanır ve mikroservis mimarisindeki backend API’leri ile haberleşir.



---

## Teknoloji Stack

| Kategori | Teknoloji |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Dil** | TypeScript |
| **Stil** | Tailwind CSS |
| **HTTP İstemcisi** | Axios |
| **Form Yönetimi** | React Hook Form |
| **State Yönetimi** | Zustand |
| **Sürükle-Bırak** | @dnd-kit/core, @dnd-kit/sortable |
| **Tarih** | date-fns |
| **Test** | Jest, React Testing Library |

---

## Proje Yapısı

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Kök layout (metadata, SEO, Analytics)
│   │   ├── page.tsx              # Ana sayfa (landing)
│   │   ├── globals.css           # Global stiller
│   │   ├── viewport.ts           # Viewport ayarları
│   │   ├── sitemap.ts            # Dinamik sitemap
│   │   ├── api/health/           # Health check endpoint
│   │   │
│   │   ├── auth/                 # Kimlik doğrulama
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── callback/         # OAuth callback
│   │   │
│   │   ├── admin/                # Admin paneli (ADMIN/STAFF)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── users/
│   │   │   ├── restaurants/
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   ├── plans/
│   │   │   ├── promo-codes/
│   │   │   ├── affiliates/
│   │   │   ├── affiliate-settings/
│   │   │   ├── referral-approvals/
│   │   │   ├── tickets/
│   │   │   ├── settings/         # Sistem ayarları
│   │   │   ├── finance/
│   │   │   └── activity/
│   │   │
│   │   ├── dashboard/            # Restoran sahibi paneli
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── restaurants/
│   │   │   ├── menu/
│   │   │   ├── menu-settings/    # Menü özelleştirme (renk, font, layout)
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── new-order/
│   │   │   ├── stock/
│   │   │   ├── tables/
│   │   │   ├── staff/
│   │   │   ├── reports/          # QR tarama istatistikleri
│   │   │   ├── subscription/
│   │   │   ├── affiliate/
│   │   │   ├── support/
│   │   │   ├── profile/
│   │   │   └── change-password/
│   │   │
│   │   ├── subscription/checkout/
│   │   │
│   │   └── [slug]/menu/          # Public QR menü (dinamik slug)
│   │
│   ├── components/
│   │   ├── ui/                   # Button, Card, Input, Modal, Toast
│   │   ├── layout/               # Navbar, Sidebar
│   │   ├── Analytics.tsx         # GA, GTM
│   │   └── LazyImage.tsx
│   │
│   └── lib/
│       ├── api.ts                # Axios instance (token, refresh)
│       ├── auth.ts               # authService
│       ├── imageHelper.ts        # getImageUrl
│       ├── planLimitHelper.ts
│       ├── ticketService.ts
│       └── utils.ts
│
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Kullanıcı Rolleri ve Erişim

| Rol | Erişim |
|-----|--------|
| **RESTAURANT_OWNER** | Dashboard, restoran/menü yönetimi, raporlar, affiliate |
| **ADMIN / STAFF** | Admin paneli, kullanıcı/restoran yönetimi, sistem ayarları |
---

## Sayfa ve Özellikler

### Public Sayfalar

- **`/`** — Landing: planlar, özellikler, fiyat hesaplama
- **`/auth/login`** — E-posta/şifre veya Google ile giriş
- **`/auth/register`** — Kayıt
- **`/auth/forgot-password`** — Şifre sıfırlama talebi
- **`/auth/reset-password`** — Şifre sıfırlama
- **`/[slug]/menu`** — Restoranın public QR menüsü (SEO, önizleme modu)

### Admin Paneli (`/admin`)

- Dashboard, kullanıcılar, restoranlar
- Global kategoriler ve ürünler
- Planlar, promosyon kodları
- Affiliate partnerlar ve ayarlar
- Destek talepleri (tickets)
- Sistem ayarları (Google OAuth, bakım modu vb.)
- Finans, aktivite

### Restoran Sahibi Dashboard (`/dashboard`)

- Restoran CRUD
- Menü yönetimi (kategori, ürün, sıralama)
- Menü özelleştirme: renk, font, layout, header/footer
- Sipariş, stok, masa yönetimi
- Personel yönetimi
- QR tarama raporları
- Abonelik, affiliate, destek


## API Entegrasyonu

- **Base URL:** `NEXT_PUBLIC_API_URL` (örn. `https://api.defneqr.com/api`)
- **Kimlik:** JWT (localStorage: `accessToken`, `refreshToken`)
- **Axios:** `withCredentials: true`, otomatik token ekleme, 401’de refresh
- **Proje uyumsuzluğu:** 403 `PROJECT_MISMATCH` → logout

---

## Kimlik Doğrulama Akışı

1. Login/Register → `accessToken`, `refreshToken` localStorage’a yazılır
2. Her istekte `Authorization: Bearer <token>` gönderilir
3. 401 alınırsa `/auth/refresh` ile yeni token alınır
4. Refresh başarısızsa logout ve `/auth/login` yönlendirmesi

---

## SEO ve Analytics

- **Metadata:** title, description, keywords, Open Graph, Twitter
- **JSON-LD:** SoftwareApplication schema
- **Sitemap:** Dinamik (`/sitemap`)
- **Google Analytics / GTM:** `Analytics.tsx` üzerinden
- **robots.txt:** Public klasörde

---

## Menü Özelleştirme

`/dashboard/menu-settings` sayfasında:

- Renkler: primary, header, kategori, kart, footer
- Font: aile, boyut
- Layout: card/list, itemsPerRow
- Header: template (classic, centered, modern, minimal), logo/başlık konumu
- Önizleme: Base64 ile URL parametresiyle canlı önizleme

---

## Tema ve Stil

- **Primary:** Kırmızı tonları (`#dc2626` vb.)
- **Tailwind:** Özel `primary-50` … `primary-900` paleti
- **Responsive:** Mobil öncelikli, sidebar hamburger menü

---

## Ortam Değişkenleri

```env
NEXT_PUBLIC_API_URL=https://api.defneqr.com/api
NEXT_PUBLIC_SITE_URL=https://defneqr.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

---

## Build ve Deployment

- **Docker:** Multi-stage build, Node 20 Alpine
- **Health check:** `/api/health`
- **Production:** `npm run build` → `npm start`

---

## Test

- **Jest** + **React Testing Library**
- UI bileşenleri: Card, Button, Input
- `imageHelper` unit testleri
- `npm run test`, `npm run test:ci`
