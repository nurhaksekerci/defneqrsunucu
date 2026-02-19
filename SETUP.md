# DijitalMenu - Kurulum Rehberi

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

---

## 📦 1. Backend Kurulumu

### 1.1 Bağımlılıkları Yükleyin

```bash
cd backend
npm install
```

### 1.2 PostgreSQL Veritabanını Oluşturun

```sql
CREATE DATABASE dijitalmenu;
```

### 1.3 Environment Değişkenlerini Ayarlayın

`.env` dosyası zaten oluşturuldu, gerekirse düzenleyin:

```bash
# Database bağlantısını kontrol edin
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dijitalmenu?schema=public"
```

### 1.4 Prisma Migration'ları Çalıştırın

```bash
# Prisma client oluştur
npx prisma generate

# Veritabanı tablolarını oluştur
npx prisma migrate dev --name init
```

### 1.5 Test Verilerini Yükleyin

```bash
npm run prisma:seed
```

Bu komut şunları oluşturacak:
- ✅ Admin kullanıcısı (admin@dijitalmenu.com / admin123)
- ✅ Test restoran sahibi (owner@test.com / owner123)
- ✅ 5 Global kategori
- ✅ 10 Global ürün

### 1.6 Backend Sunucusunu Başlatın

```bash
npm run dev
```

Backend şimdi `http://localhost:5000` adresinde çalışıyor!

---

## 🎨 2. Frontend Kurulumu

### 2.1 Bağımlılıkları Yükleyin

```bash
cd frontend
npm install
```

### 2.2 Environment Değişkenlerini Kontrol Edin

`.env.local` dosyası zaten oluşturuldu:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2.3 Frontend Sunucusunu Başlatın

```bash
npm run dev
```

Frontend şimdi `http://localhost:3000` adresinde çalışıyor!

---

## 🔐 Test Kullanıcıları

### Admin
- **Email:** admin@dijitalmenu.com
- **Şifre:** admin123
- **Erişim:** `/admin` - Tüm sistem yönetimi

### Restoran Sahibi
- **Email:** owner@test.com
- **Şifre:** owner123
- **Erişim:** `/dashboard` - Restoran yönetimi

### Yeni Kullanıcı Kaydı
- Kayıt ol: `/auth/register`
- Varsayılan rol: `RESTAURANT_OWNER`
- İlk restoran oluşturma zorunludur

---

## 📱 Sayfalar ve Roller

### Public (Herkes)
- **Ana Sayfa:** `/`
- **QR Menü:** `/[restaurant-slug]/menu`
- **Giriş:** `/auth/login`
- **Kayıt:** `/auth/register`

### Admin / Staff
- **Dashboard:** `/admin`
- **Restoranlar:** `/admin/restaurants`
- **Kullanıcılar:** `/admin/users`
- **Global Kategoriler:** `/admin/categories`
- **Global Ürünler:** `/admin/products`

### Restaurant Owner
- **Dashboard:** `/dashboard`
- **Restoranlarım:** `/dashboard/restaurants`
- **Menü Yönetimi:** `/dashboard/menu`
- **Kategoriler:** `/dashboard/categories`
- **Ürünler:** `/dashboard/products`
- **Stok Yönetimi:** `/dashboard/stock`
- **Siparişler:** `/dashboard/orders`
- **Raporlar:** `/dashboard/reports`

### Waiter (Garson)
- **Garson Terminali:** `/waiter`
- Sipariş oluşturma ve takip

### Cook / Barista (Mutfak)
- **Mutfak Ekranı:** `/kitchen`
- Gerçek zamanlı sipariş akışı
- Durum güncelleme

### Cashier (Kasiyer)
- **Kasa Terminali:** `/cashier`
- Ödeme alma (Nakit/Kart/Parçalı)
- Z-Raporu

---

## 🗄️ Veritabanı Şeması

### Ana Tablolar
- ✅ `users` - Kullanıcılar (7 rol desteği)
- ✅ `restaurants` - Restoranlar
- ✅ `categories` - Kategoriler (Global/Yerel)
- ✅ `products` - Ürünler (Global/Yerel)
- ✅ `stocks` - Stok yönetimi
- ✅ `orders` - Siparişler
- ✅ `order_items` - Sipariş detayları
- ✅ `payments` - Ödemeler

### Özellikler
- ✅ Soft Delete (tüm tablolarda)
- ✅ Audit Trail (createdAt, updatedAt, deletedAt)
- ✅ Türkçe karakter destekli slug
- ✅ İlişkisel veri modelleme

---

## 🛠️ Geliştirme Araçları

### Prisma Studio (Database GUI)
```bash
cd backend
npm run prisma:studio
```
Tarayıcıda `http://localhost:5555` açılacak

### Veritabanını Sıfırlama
```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### Yeni Migration Oluşturma
```bash
cd backend
npx prisma migrate dev --name migration_name
```

---

## 🐛 Sorun Giderme

### Backend başlamıyor
1. PostgreSQL çalışıyor mu kontrol edin
2. `.env` dosyasındaki DATABASE_URL'i kontrol edin
3. `npm install` komutunu tekrar çalıştırın

### Frontend başlamıyor
1. Backend çalışıyor mu kontrol edin
2. `.env.local` dosyasını kontrol edin
3. `npm install` komutunu tekrar çalıştırın

### Prisma hataları
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

### CORS hataları
Backend `server.js` dosyasında CORS ayarlarını kontrol edin

---

## 📚 API Dokümantasyonu

Backend API endpoint'leri için:
- `backend/README.md` dosyasına bakın
- Postman collection: `docs/postman/` (yakında)

---

## 🎯 Sonraki Adımlar

1. ✅ Backend kurulumu tamamlandı
2. ✅ Frontend kurulumu tamamlandı
3. ✅ Test verileri yüklendi
4. ⏳ Kendi restoranınızı oluşturun
5. ⏳ Menünüzü özelleştirin
6. ⏳ QR kod oluşturun ve yazdırın

---

## 💡 İpuçları

### QR Kod Nasıl Oluşturulur?
1. Dashboard'a giriş yapın
2. Restoranınızın slug'ını kopyalayın
3. QR kod oluşturucu sitesinde: `http://localhost:3000/[restaurant-slug]/menu`
4. QR kodu yazdırıp masalara yerleştirin

### İlk Restoran Kurulumu
1. Kayıt olun → `/auth/register`
2. Restoran oluşturun
3. Global kategorileri kopyalayın
4. Global ürünleri kopyalayın veya yeni ürün ekleyin
5. Stok bilgilerini girin
6. QR menüyü test edin

---

## 📞 Destek

Sorunlarınız için:
- GitHub Issues
- Email: support@dijitalmenu.com

---

**Başarılar! 🎉**
