# 🔐 DijitalMenu - Giriş Bilgileri

## Varsayılan Kullanıcılar

Veritabanı seed edildikten sonra aşağıdaki kullanıcılar ile giriş yapabilirsiniz:

### 👨‍💼 Admin (Sistem Yöneticisi)
- **Email:** `admin@dijitalmenu.com`
- **Şifre:** `admin123`
- **Rol:** ADMIN
- **Yetkiler:** 
  - Tüm sistem ayarları
  - Global kategori/ürün yönetimi
  - Tüm restoranları görüntüleme
  - Kullanıcı yönetimi

### 🍽️ Restoran Sahibi
- **Email:** `owner@test.com`
- **Şifre:** `owner123`
- **Rol:** RESTAURANT_OWNER
- **Yetkiler:**
  - Kendi restoranlarını yönetme
  - Kategori/ürün yönetimi
  - Personel yönetimi
  - Stok yönetimi
  - Sipariş takibi
  - Raporlar

---

## 🚀 İlk Kurulum

### 1. Veritabanını Seed Et (İlk Kez)
```bash
cd backend
node prisma/seed.js
```

### 2. Giriş Yap
- Frontend'e git: `http://localhost:3000`
- Login sayfasına git: `http://localhost:3000/auth/login`
- Yukarıdaki bilgilerden birini kullan

---

## 📝 Yeni Kullanıcı Oluşturma

### Admin Olarak:
1. Admin hesabı ile giriş yap
2. **Kullanıcılar** menüsüne git
3. **+ Yeni Kullanıcı Ekle** butonuna tıkla
4. Kullanıcı bilgilerini doldur

### Restoran Sahibi Olarak:
1. Restoran sahibi hesabı ile giriş yap
2. **Personel** menüsüne git
3. **+ Personel Ekle** butonuna tıkla
4. Personel bilgilerini doldur

---

## 🔄 Şifre Sıfırlama (Development)

Eğer şifrenizi unuttuyysanız:

```bash
cd backend
node prisma/seed.js
```

Bu komut mevcut admin ve owner kullanıcılarının şifrelerini sıfırlar.

---

## ⚠️ Güvenlik Notları

**PRODUCTION ORTAMINDA:**
- Varsayılan şifreleri mutlaka değiştirin!
- Güçlü şifreler kullanın
- JWT_SECRET'i güvenli bir değerle değiştirin
- Rate limiting ayarlarını sıkılaştırın
- CORS ayarlarını production domain'e göre yapılandırın

---

## 🎯 QR Menü Test

1. Restoran oluşturduktan sonra slug'ı alın (örn: `test-restorani`)
2. QR menüye şu adresten erişin: `http://localhost:3000/test-restorani/menu`
3. Müşteri görünümünü test edin

---

## 📱 Test Akışı

1. **Admin olarak giriş yap** (`admin@dijitalmenu.com`)
   - Global kategoriler ekle
   - Global ürünler ekle (görselli)

2. **Restoran Sahibi olarak giriş yap** (`owner@test.com`)
   - Yeni restoran oluştur
   - Global katalogdan kategori ekle
   - Ürünlere fiyat belirle
   - Ürün görselleri yükle
   - Ürünleri aktif/pasif yap

3. **QR Menü Testi**
   - `http://localhost:3000/[restaurant-slug]/menu` adresine git
   - Müşteri görünümünü test et

---

## 🐛 Sorun Giderme

### "Invalid credentials" hatası alıyorum
- Email'in doğru olduğundan emin ol
- Şifrenin doğru olduğundan emin ol (büyük/küçük harf duyarlı)
- Seed işleminin başarılı olduğunu kontrol et

### "Too many requests" hatası
- Backend'deki rate limiting ayarları gevşetildi
- 1 dakikada 1000 istek limiti var
- Eğer sorun devam ediyorsa backend'i yeniden başlat

### Resimler gözükmüyor
- Backend'in çalıştığından emin ol (`http://localhost:5000`)
- `/public/uploads` klasörünün olduğundan emin ol
- Dosya yükleme izinlerini kontrol et

---

**Son Güncelleme:** 15 Şubat 2026
