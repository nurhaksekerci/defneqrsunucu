# Restoran Sahibi Referral Sistemi 🏪

## Özet
Restoran sahipleri için özel bir referral sistemi eklendi. Para komisyonu yerine, her referral için abonelik süresine **otomatik gün eklenir**.

---

## ✨ Yeni Özellikler

### 1. Otomatik Affiliate Partner Oluşturma
- İlk restoran oluşturulduğunda otomatik olarak **affiliate partner** kaydı oluşturulur
- Başvuru formu gerektirmez
- Durum direkt `ACTIVE` olarak ayarlanır
- Benzersiz referral code otomatik üretilir

### 2. Gün Kazanma Sistemi
- Her referral için restoran sahibinin **abonelik bitiş tarihi uzar**
- Kazanılan gün sayısı admin tarafından ayarlanabilir (default: 7 gün)
- Para komisyonu YOK, sadece abonelik uzatması

### 3. Admin Settings
- Yeni ayar: `daysPerReferral` (Her referral için kazanılan gün sayısı)
- Frontend'de ayrı bölümler:
  - 🏪 **Restoran Sahipleri İçin** (Gün Kazanma Sistemi)
  - 💰 **Ödenen Affiliate'ler İçin** (Para Komisyonu)

### 4. Kullanıcı Dashboard'u
- Restoran sahipleri:
  - Özel mesaj: "Ücretsiz Abonelik Kazanın"
  - Gün bazlı istatistikler (X gün kazanıldı)
  - Referral listesi
  - ❌ Banka bilgileri gösterilmez
  - ❌ Komisyon tablosu gösterilmez

- Diğer affiliate'ler:
  - Para komisyonu sistemi
  - Banka bilgileri
  - Komisyon takibi

---

## 📁 Değişiklik Yapılan Dosyalar

### Backend

#### 1. `backend/prisma/schema.prisma`
```prisma
model AffiliateSettings {
  // ...
  daysPerReferral       Int      @default(7)  // YENİ: Her referral için kazanılan gün sayısı
  // ...
}
```

#### 2. `backend/prisma/migrations/20260222_add_days_per_referral/migration.sql`
```sql
ALTER TABLE "affiliate_settings" ADD COLUMN "daysPerReferral" INTEGER NOT NULL DEFAULT 7;
```

#### 3. `backend/src/controllers/restaurant.controller.js`
**Yeni özellik:** İlk restoran oluşturulduğunda otomatik affiliate partner oluştur
```javascript
// İlk restoran ise otomatik affiliate partner oluştur
const restaurantCount = await prisma.restaurant.count({
  where: { ownerId, isDeleted: false }
});

if (restaurantCount === 1) {
  // Benzersiz referral code oluştur
  let referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  // Otomatik affiliate partner oluştur (ACTIVE durumda)
  await prisma.affiliatePartner.create({
    data: {
      userId: ownerId,
      referralCode,
      status: 'ACTIVE'
    }
  });
}
```

#### 4. `backend/src/middleware/referral.middleware.js`
**Yeni fonksiyon:** `extendSubscriptionForReferral()`
```javascript
// Referral için abonelik süresini uzat (Restoran sahipleri için)
exports.extendSubscriptionForReferral = async (referredUserId, affiliateId) => {
  const settings = await prisma.affiliateSettings.findFirst();
  const daysToAdd = settings.daysPerReferral;
  
  // Affiliate'in aktif aboneliğini bul
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      user: { affiliatePartner: { id: affiliateId } },
      status: 'ACTIVE'
    }
  });
  
  // Abonelik süresini uzat
  const newEndDate = new Date(activeSubscription.endDate);
  newEndDate.setDate(newEndDate.getDate() + daysToAdd);
  
  await prisma.subscription.update({
    where: { id: activeSubscription.id },
    data: { endDate: newEndDate }
  });
};
```

**Güncellenen fonksiyon:** `createCommission()`
```javascript
// Restoran sahibi ise abonelik süresini uzat, para komisyonu yok
if (referral.affiliate.user.role === 'RESTAURANT_OWNER') {
  await exports.extendSubscriptionForReferral(referredUserId, referral.affiliateId);
  
  // İstatistikleri güncelle
  await prisma.affiliatePartner.update({
    where: { id: referral.affiliateId },
    data: { totalReferrals: { increment: 1 } }
  });

  return { type: 'subscription_extension', daysAdded: settings.daysPerReferral };
}

// Diğer affiliate'ler için para komisyonu
// ... (mevcut komisyon mantığı)
```

### Frontend

#### 5. `frontend/src/app/admin/affiliate-settings/page.tsx`
- Yeni input alanı: `daysPerReferral`
- Görsel ayrım:
  - 🏪 Restoran Sahipleri bölümü (yeşil)
  - 💰 Ödenen Affiliate'ler bölümü (mavi)
- Güncellenmiş bilgilendirme kutusu

#### 6. `frontend/src/app/dashboard/affiliate/page.tsx`
**Yeni özellikler:**
- User role kontrolü (`RESTAURANT_OWNER` vs diğerleri)
- Koşullu rendering:
  - Başvuru yoksa → Restoran sahipleri için özel mesaj göster
  - Stats kartları → Restoran sahipleri için "gün" bazlı
  - Referral link mesajı → Farklı açıklamalar
  - Banka bilgileri → Sadece ödenen affiliate'ler için
  - Komisyon tablosu → Sadece ödenen affiliate'ler için

```typescript
// User role kontrolü
const [user, setUser] = useState<UserInfo | null>(null);

// Affiliate yoksa
if (user?.role === 'RESTAURANT_OWNER') {
  return (
    // "Ücretsiz Abonelik Kazanın" mesajı
    // "Her referral için X gün kazanın"
    // "Referral Linkimi Göster" butonu
  );
}

// Stats kartları
{user.role === 'RESTAURANT_OWNER' ? (
  <p>{affiliateInfo.stats.totalReferrals * 7} gün</p> // Gün bazlı
) : (
  <p>₺{affiliateInfo.stats.totalEarnings}</p> // Para bazlı
)}

// Banka bilgileri - Sadece ödenen affiliate'ler için
{user && user.role !== 'RESTAURANT_OWNER' && (
  <Card>...</Card>
)}
```

---

## 🚀 Deployment Adımları

### Sunucuda Yapılacaklar:

```bash
# 1. Yeni kodları çek
cd /opt/defneqr
git pull origin main

# 2. Migration'ı uygula
# (Prisma CLI ile migration uygulanamadığı için manuel SQL kullanmalısınız)
cd backend/prisma/migrations/20260222_add_days_per_referral

# Migration SQL'ini kopyala
docker cp migration.sql defneqr-postgres:/migration.sql

# PostgreSQL container'ına gir ve SQL'i çalıştır
docker exec -it defneqr-postgres psql -U postgres -d defneqr_db -f /migration.sql

# Migration dosyasını temizle (opsiyonel)
docker exec defneqr-postgres rm /migration.sql

# 3. Backend ve Frontend'i yeniden build et
docker compose build backend frontend

# 4. Servisleri yeniden başlat
docker compose up -d

# 5. Logları kontrol et
docker compose logs backend --tail 50
docker compose logs frontend --tail 50

# 6. Health check
docker compose ps
```

### Manuel Test Senaryoları:

#### Test 1: Yeni Restoran Oluşturma (Otomatik Affiliate)
1. Yeni bir kullanıcı oluştur (RESTAURANT_OWNER rolü)
2. İlk restoranını oluştur
3. `/dashboard/affiliate` sayfasına git
4. "Referral Linkimi Göster" butonuna tıkla
5. ✅ Referral linkin gösterilmeli
6. ✅ Banka bilgileri ve komisyon tablosu gösterilMEMELİ

#### Test 2: Referral Link ile Kayıt (Gün Kazanma)
1. Bir restoran sahibinin referral linkini kopyala
2. Yeni tarayıcıda bu link ile kayıt ol
3. Abonelik satın al
4. Restoran sahibinin dashboard'unu kontrol et:
   - ✅ "Toplam Referans" sayısı artmalı
   - ✅ "Toplam Kazanılan Süre" güncellenmeli
5. Veritabanında restoran sahibinin subscription `endDate` kontrol et:
   ```sql
   SELECT endDate FROM subscriptions 
   WHERE userId = 'restoran-sahibi-id' 
   ORDER BY endDate DESC LIMIT 1;
   ```
   - ✅ `endDate` admin ayarlarındaki `daysPerReferral` kadar ileri gitmeli

#### Test 3: Admin Settings Güncellemesi
1. `/admin/affiliate-settings` sayfasına git (Admin olarak)
2. "Her Referral Başına Kazanılan Gün" değerini 14 olarak güncelle
3. Yeni bir referral yap
4. ✅ Bu sefer 14 gün kazanılmalı

#### Test 4: Ödenen Affiliate (Karşılaştırma)
1. Normal bir kullanıcı ile affiliate başvurusu yap
2. Admin olarak başvuruyu onayla
3. Dashboard'unda:
   - ✅ Para bazlı istatistikler gösterilmeli
   - ✅ Banka bilgileri bölümü görünmeli
   - ✅ Komisyon tablosu görünmeli

---

## 🔧 Troubleshooting

### Sorun: Migration uygulanamadı
**Çözüm:**
```bash
# Manuel SQL çalıştır
docker exec -it defneqr-postgres psql -U postgres -d defneqr_db

# SQL komutunu direkt yapıştır
ALTER TABLE "affiliate_settings" ADD COLUMN "daysPerReferral" INTEGER NOT NULL DEFAULT 7;

\q
```

### Sorun: Mevcut restoran sahiplerinin affiliate kaydı yok
**Çözüm:** Manuel olarak oluşturmalısınız
```sql
-- Restoran sahibi affiliate partner'larını listele
SELECT u.id, u.fullName, u.email, COUNT(r.id) as restaurant_count
FROM users u
LEFT JOIN restaurants r ON r.ownerId = u.id AND r.isDeleted = false
WHERE u.role = 'RESTAURANT_OWNER'
  AND u.id NOT IN (SELECT userId FROM affiliate_partners)
GROUP BY u.id, u.fullName, u.email;

-- Otomatik affiliate partner oluştur (Node.js script ile veya manuel INSERT)
```

### Sorun: Abonelik uzatması çalışmıyor
**Kontrol edilecekler:**
1. `referral_code` cookie'si doğru ayarlanmış mı?
2. `Referral` kaydı veritabanında oluşturulmuş mu?
3. Affiliate'in aktif bir aboneliği var mı?
4. Backend loglarında hata var mı?

```bash
docker compose logs backend | grep "Subscription extended"
docker compose logs backend | grep "commission error"
```

---

## 📊 Veritabanı Kontrolleri

```sql
-- 1. Affiliate Settings kontrolü
SELECT * FROM affiliate_settings;

-- 2. Restoran sahibi affiliate partner'ları
SELECT ap.*, u.fullName, u.role
FROM affiliate_partners ap
JOIN users u ON u.id = ap.userId
WHERE u.role = 'RESTAURANT_OWNER';

-- 3. Referral istatistikleri
SELECT 
  ap.referralCode,
  u.fullName as affiliate_name,
  ap.totalReferrals,
  ap.totalEarnings,
  COUNT(r.id) as referral_count
FROM affiliate_partners ap
JOIN users u ON u.id = ap.userId
LEFT JOIN referrals r ON r.affiliateId = ap.id
WHERE u.role = 'RESTAURANT_OWNER'
GROUP BY ap.id, u.fullName;

-- 4. Abonelik uzatma kayıtları (log olmadığı için subscription history'den çıkarım)
SELECT 
  s.userId,
  u.fullName,
  s.endDate,
  s.updatedAt
FROM subscriptions s
JOIN users u ON u.id = s.userId
WHERE s.status = 'ACTIVE'
ORDER BY s.updatedAt DESC;
```

---

## ✅ Tamamlanan Özellikler

- ✅ Prisma schema güncellendi (`daysPerReferral`)
- ✅ Migration oluşturuldu
- ✅ Otomatik affiliate partner oluşturma (restaurant create)
- ✅ Abonelik süresini uzatma fonksiyonu (`extendSubscriptionForReferral`)
- ✅ Komisyon mantığı güncellendi (restoran sahipleri vs ödenen affiliate'ler)
- ✅ Admin settings UI güncellendi
- ✅ Dashboard affiliate sayfası güncellendi (koşullu rendering)
- ✅ Git commit ve push

## 🔄 Sonraki Adımlar

1. **Deployment:** Yukarıdaki deployment adımlarını takip ederek production'a deploy edin
2. **Test:** Manuel test senaryolarını çalıştırın
3. **Monitoring:** İlk hafta backend loglarını düzenli kontrol edin
4. **Kullanıcı Bildirimi:** Mevcut restoran sahiplerine yeni özelliği duyurun (email/duyuru)

---

## 📝 Notlar

- **Önemli:** Mevcut restoran sahiplerinin affiliate kayıtları otomatik OLUŞTURULMAZ. Sadece yeni restoran oluşturan kullanıcılar için otomatik oluşur.
- **Alternatif:** Mevcut kullanıcılar için bir migration script yazabilirsiniz
- **Para vs Gün:** Sistem iki farklı ödüllendirme mekanizmasını destekliyor (role bazlı)

---

**Son Güncelleme:** 2026-02-22  
**Commit:** `92818f4` - Add restaurant owner referral system with subscription extension rewards
