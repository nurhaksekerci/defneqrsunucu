# Plan Bazlı Limitler

Bu doküman, sistem içinde plan bazlı limitlerin nasıl çalıştığını açıklar.

## 📋 Özellikler

### 1. Otomatik Ücretsiz Plan Atama
- Kullanıcı ilk restoranını oluşturduğunda otomatik olarak **Ücretsiz** plana atanır
- Abonelik süresi: 365 gün (1 yıl)
- Manuel abonelik oluşturmaya gerek yok

### 2. Plan Limitleri
Her plan için şu limitler tanımlıdır:
- `maxRestaurants`: Maksimum işletme sayısı
- `maxCategories`: Maksimum kategori sayısı
- `maxProducts`: Maksimum ürün sayısı

### 3. Limit Kontrolleri
Kullanıcı şu işlemleri yaparken limitler kontrol edilir:
- ✅ Restoran oluşturma
- ✅ Kategori oluşturma
- ✅ Kategori kopyalama (global katalogdan)
- ✅ Ürün oluşturma
- ✅ Ürün kopyalama (global katalogdan)

## 🎯 Planlar

### Ücretsiz Plan
```json
{
  "name": "Ücretsiz",
  "type": "FREE",
  "price": 0,
  "duration": 365, // gün
  "maxRestaurants": 1,
  "maxCategories": 10,
  "maxProducts": 50,
  "features": [
    "1 İşletme",
    "10 Kategori",
    "50 Ürün",
    "QR Menü",
    "Global Katalog",
    "Temel Özelleştirme",
    "Mobil Uyumlu"
  ]
}
```

### Premium Plan
```json
{
  "name": "Premium",
  "type": "PREMIUM",
  "price": 299,
  "duration": 30, // gün
  "maxRestaurants": 5,
  "maxCategories": 50,
  "maxProducts": 500,
  "extraRestaurantPrice": 50, // Ek işletme başına ücret
  "features": [
    "5 İşletme",
    "50 Kategori",
    "500 Ürün",
    "QR Menü",
    "Global Katalog",
    "Gelişmiş Özelleştirme",
    "QR Tarama Analizi",
    "Markalama Kaldırma",
    "Öncelikli Destek"
  ]
}
```

### Kurumsal Plan
```json
{
  "name": "Kurumsal",
  "type": "CUSTOM",
  "price": 999,
  "duration": 30, // gün
  "maxRestaurants": 999999, // Sınırsız
  "maxCategories": 999999, // Sınırsız
  "maxProducts": 999999, // Sınırsız
  "extraRestaurantPrice": 75,
  "features": [
    "Sınırsız İşletme",
    "Sınırsız Kategori",
    "Sınırsız Ürün",
    "QR Menü",
    "Global Katalog",
    "Tam Özelleştirme",
    "Gelişmiş Analitik",
    "Markalama Kaldırma",
    "7/24 Destek",
    "Özel Eğitim",
    "API Erişimi"
  ]
}
```

## 🔧 API Endpoints

### Kullanıcının Abonelik Bilgisini Getir
```
GET /api/subscriptions/my
Authorization: Bearer <token>
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "subscription": {
      "id": "...",
      "startDate": "2026-02-20T...",
      "endDate": "2026-03-20T...",
      "status": "ACTIVE",
      "daysRemaining": 28
    },
    "plan": {
      "id": "...",
      "name": "Premium",
      "type": "PREMIUM",
      "maxRestaurants": 5,
      "maxCategories": 50,
      "maxProducts": 500
    },
    "usage": {
      "restaurants": 2,
      "categories": 15,
      "products": 120
    },
    "limits": {
      "restaurants": 5,
      "categories": 50,
      "products": 500
    }
  }
}
```

### Abonelik Oluştur (Admin)
```
POST /api/subscriptions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "planId": "plan-uuid",
  "amount": 299,
  "paymentDate": "2026-02-20T12:00:00Z",
  "customRestaurantCount": 10 // Opsiyonel (Kurumsal plan için)
}
```

### Abonelik İptal Et
```
PUT /api/subscriptions/:id/cancel
Authorization: Bearer <token>
```

## 🚨 Limit Aşıldığında

Kullanıcı limite ulaştığında API **403 Forbidden** hatası döndürür:

```json
{
  "success": false,
  "message": "Plan limitinize ulaştınız. Maksimum 50 ürün oluşturabilirsiniz. Daha fazla ürün için planınızı yükseltin.",
  "data": {
    "currentCount": 50,
    "maxCount": 50,
    "planName": "Ücretsiz",
    "planType": "FREE"
  }
}
```

## 🔄 Otomatik Süreçler

### 1. İlk Restoran Oluşturma
```javascript
// Kullanıcı ilk restoranını oluşturuyor
POST /api/restaurants

// Middleware otomatik olarak:
1. Kullanıcının aboneliği var mı kontrol eder
2. Yoksa, otomatik olarak Ücretsiz plana atar
3. Limit kontrolü yapar
4. İzin veriyorsa restoran oluşturulur
```

### 2. Limit Kontrolü
```javascript
// Her oluşturma/kopyalama işleminde:
1. Kullanıcının aktif planı bulunur
2. Mevcut kullanım sayılır
3. Limit ile karşılaştırılır
4. Aşılmışsa 403 hatası döner
5. Aşılmamışsa işlem devam eder
```

## 💾 Veritabanı Seed

Seed dosyası otomatik olarak 3 plan oluşturur:
- Ücretsiz
- Premium
- Kurumsal

```bash
# Seed çalıştırma
cd backend
npm run seed
```

## 🧪 Test

```bash
# Backend testleri
cd backend
npm test

# Plan limit testlerini çalıştır
npm test -- planLimit.middleware.test.js
```

## 📱 Frontend Entegrasyonu

Frontend'de kullanıcının plan bilgilerini göstermek için:

```typescript
// Plan bilgisini al
const response = await api.get('/subscriptions/my');
const { plan, usage, limits } = response.data.data;

// Kullanım oranını göster
const restaurantUsage = (usage.restaurants / limits.restaurants) * 100;
const categoryUsage = (usage.categories / limits.categories) * 100;
const productUsage = (usage.products / limits.products) * 100;

// Limit aşımı kontrolü
if (usage.restaurants >= limits.restaurants) {
  showUpgradeModal();
}
```

## 🔐 Güvenlik

- ✅ Tüm endpoints authenticate middleware kullanır
- ✅ Limit kontrolleri backend'de yapılır (frontend bypass edilemez)
- ✅ Admin-only endpoints authorize middleware ile korunur
- ✅ Kullanıcılar sadece kendi aboneliklerini görebilir/iptal edebilir

## 📊 Monitoring

Plan kullanımı için metrikler:
- Toplam aktif abonelikler
- Plan tipine göre dağılım
- Limit aşımı denemeleri
- Ortalama kullanım oranları

## 🚀 Deployment

```bash
# Sunucuda
cd /opt/defneqr
git pull
docker compose restart backend

# Seed çalıştır (ilk kez)
docker compose exec backend npm run seed

# Logları kontrol et
docker compose logs -f backend
```

## 📝 Notlar

- Admin kullanıcıları limitlere tabi değildir (gerekirse eklenebilir)
- Global kategoriler ve ürünler (isGlobal=true) limitlere dahil değildir
- Soft delete yapılan kayıtlar (isDeleted=true) limitlere dahil değildir
- Abonelik süresi dolduğunda otomatik olarak ücretsiz plana geçiş yapılmaz (manuel müdahale gerekir)
