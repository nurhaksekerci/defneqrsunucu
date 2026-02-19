# DijitalMenu Backend API

QR Menü ve Restoran Yönetim Sistemi - Backend API

## Teknolojiler

- **Node.js** - Runtime
- **Express.js** - Web Framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Veritabanı
- **JWT** - Authentication
- **bcryptjs** - Password Hashing

## Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Environment değişkenlerini ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve değişkenleri düzenleyin:

```bash
cp .env.example .env
```

### 3. Veritabanı kurulumu

```bash
# Prisma client oluştur
npm run prisma:generate

# Database migration
npm run prisma:migrate

# (Opsiyonel) Seed data ekle
npm run prisma:seed
```

### 4. Sunucuyu başlatın

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş yapma
- `POST /api/auth/logout` - Çıkış yapma
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth Callback

### Restaurants
- `GET /api/restaurants` - Tüm restoranları listele
- `GET /api/restaurants/:slug` - Restoran detayı
- `POST /api/restaurants` - Yeni restoran oluştur
- `PUT /api/restaurants/:id` - Restoran güncelle
- `DELETE /api/restaurants/:id` - Restoran sil (soft delete)

### Categories
- `GET /api/categories` - Kategorileri listele
- `POST /api/categories` - Yeni kategori
- `PUT /api/categories/:id` - Kategori güncelle
- `DELETE /api/categories/:id` - Kategori sil

### Products
- `GET /api/products` - Ürünleri listele
- `POST /api/products` - Yeni ürün
- `PUT /api/products/:id` - Ürün güncelle
- `DELETE /api/products/:id` - Ürün sil

### Orders
- `GET /api/orders` - Siparişleri listele
- `POST /api/orders` - Yeni sipariş
- `PUT /api/orders/:id` - Sipariş güncelle
- `DELETE /api/orders/:id` - Sipariş iptal

### Stocks
- `GET /api/stocks` - Stok listele
- `POST /api/stocks` - Stok ekle
- `PUT /api/stocks/:id` - Stok güncelle

### Payments
- `GET /api/payments` - Ödeme listele
- `POST /api/payments` - Ödeme al

### Reports
- `GET /api/reports/sales` - Satış raporları
- `GET /api/reports/staff` - Personel raporları
- `GET /api/reports/stock` - Stok raporları

## Kullanıcı Rolleri

- `ADMIN` - Sistem yöneticisi
- `STAFF` - Sistem çalışanı
- `RESTAURANT_OWNER` - Restoran sahibi
- `CASHIER` - Kasiyer
- `WAITER` - Garson
- `BARISTA` - Barista
- `COOK` - Aşçı

## Prisma Commands

```bash
# Prisma Studio (Database GUI)
npm run prisma:studio

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npm run prisma:generate
```

## Proje Yapısı

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Seed data
├── src/
│   ├── config/
│   │   └── database.js    # Prisma client
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── routes/            # API routes
│   ├── controllers/       # Business logic (eklenecek)
│   ├── services/          # Database operations (eklenecek)
│   ├── utils/             # Helper functions
│   └── server.js          # Entry point
├── .env.example
├── .gitignore
└── package.json
```

## Lisans

MIT
