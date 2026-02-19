# DijitalMenu Frontend

QR Menü ve Restoran Yönetim Sistemi - Frontend Uygulaması

## Teknolojiler

- **Next.js 14** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client
- **React Hook Form** - Form Management
- **Zustand** - State Management
- **React Query** - Server State Management

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Environment değişkenlerini ayarlayın

`.env.local.example` dosyasını `.env.local` olarak kopyalayın:

```bash
cp .env.local.example .env.local
```

### 3. Development sunucusunu başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Proje Yapısı

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   ├── globals.css        # Global styles
│   │   ├── auth/              # Authentication pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # Restaurant owner dashboard
│   │   ├── waiter/            # Waiter terminal
│   │   ├── kitchen/           # Kitchen display
│   │   ├── cashier/           # Cashier terminal
│   │   └── [slug]/            # Dynamic routes
│   │       └── menu/          # Public QR menu
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilities
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Helper functions
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript types
├── public/                  # Static files
├── .env.local.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Sayfalar

### Public
- `/` - Ana sayfa
- `/auth/login` - Giriş
- `/auth/register` - Kayıt
- `/:slug/menu` - QR Menü (Public)

### Admin Panel
- `/admin` - Admin Dashboard
- `/admin/users` - Kullanıcı yönetimi
- `/admin/restaurants` - Restoran yönetimi
- `/admin/categories` - Global kategori yönetimi
- `/admin/products` - Global ürün yönetimi

### Restaurant Owner Dashboard
- `/dashboard` - Dashboard
- `/dashboard/restaurant` - Restoran ayarları
- `/dashboard/menu` - Menü yönetimi
- `/dashboard/categories` - Kategori yönetimi
- `/dashboard/products` - Ürün yönetimi
- `/dashboard/stock` - Stok yönetimi
- `/dashboard/staff` - Personel yönetimi
- `/dashboard/reports` - Raporlar

### Operational Terminals
- `/waiter` - Garson terminali
- `/kitchen` - Mutfak ekranı (KDS)
- `/cashier` - Kasa terminali

## Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## API Entegrasyonu

API istekleri için `src/lib/api.ts` dosyasındaki axios instance kullanılır:

```typescript
import api from '@/lib/api';

// GET request
const response = await api.get('/restaurants');

// POST request
const response = await api.post('/restaurants', data);
```

## Lisans

MIT
