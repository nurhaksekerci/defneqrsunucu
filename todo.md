# QR Menü ve Restoran Yönetim Sistemi - Master TODO

## 1. Veritabanı ve Şema Yapısı
- [x] **Temel Tablolar:**
  - [x] Kullanıcılar (Roller: admin(geliştiriciler için), staff (geliştiriciler için), restaurant_owner, cashier, waiter, barista, cook)
  - [x] Restoranlar (Türkçe karakter destekli slug yapısı, slug otomatik olacak. Daha önce kullanıldıysa sonuna rakam ekleyecek)
  - [x] Kategoriler (Global ve Restoran'a özel ayrımı. Restoran istersen Global kategorileri kopyalayabilir ve restorana göre özelleştirebilir.)
  - [x] Ürünler (Global ve Restoran'a özel ayrımı.  Restoran istersen Global Ürünleri kopyalayabilir ve restorana göre özelleştirebilir. Stok ve Fiyat bilgisi ile restorana özel olacak)
  - [x] Siparişler ve Sipariş Detayları
  - [x] Stok Takibi
  - [x] Ödemeler ve Ödeme Yöntemleri (Nakit, Kredi Kartı, Parçalı)
  - [x] Raporlama Özet Tabloları

## 2. Kimlik Doğrulama ve Güvenlik
- [x] **Giriş Sistemi:**
  - [x] Kullanıcı adı/parola ile giriş API'si (bcrypt şifreleme)
  - [ ] Kullanıcı google ile giriş API'si
  - [ ] OAuth entegrasyonu
  - [x] Session ve Token yönetimi

- [x] **Kayıt ve Yetkilendirme:**
  - [x] Kayıt olan kullanıcıyı varsayılan `restaurant_owner` olarak atama
  - [x] Kayıt sonrası zorunlu Restoran Oluşturma sayfasına yönlendirme
  - [x] Rol bazlı erişim kontrolü (RBAC) middleware'leri (Admin, Owner, Staff vb.)

## 3. Backend API Geliştirmesi

### A. Restoran Yönetimi
- [x] Restoran oluşturma, güncelleme, silme ve listeleme API'leri
- [x] Restoran detay API'si (Slug üzerinden)

### B. Katalog Yönetimi (Kategori & Ürün)
- [x] **Global (Admin):** Sistem geneli kategori/ürün CRUD işlemleri
- [x] **Yerel (Restoran):** Restorana özel kategori/ürün CRUD işlemleri

### C. Operasyonel API'ler (Sipariş & Stok)
- [x] **Sipariş:**
  - [x] Oluşturma (Masa/Garson bazlı)
  - [x] Güncelleme (Durum: Beklemede -> Hazırlanıyor -> Hazır -> Teslim)
  - [x] İptal etme ve Geçmiş görüntüleme

- [x] **Stok:**
  - [x] Manuel ekleme/çıkartma/güncelleme
  - [x] Sipariş satışında otomatik stok düşümü
  - [x] Düşük stok uyarı sistemi ve bildirimleri

### D. Finans ve Kasa
- [x] Ödeme alma API'si (Tam veya Parçalı ödeme)
- [x] Gün sonu kasa kapatma (Z-Raporu) işlemi
- [x] Ödeme geçmişi ve detayları

### E. Raporlama Servisleri
- [x] Satış Raporları (Günlük, Aylık, Ürün ve Kategori bazlı)
- [x] Çalışan Performans Raporları
- [x] Stok ve Envanter Raporları
- [ ] Raporları dışa aktarma (PDF/Excel)

## 4. Frontend: Yönetim Panelleri

### A. Süper Admin Paneli
- [x] **Dashboard:** Sistem geneli özet (/admin)
- [x] **Restoranlar:** Tüm restoranları listeleme ve yönetim (/admin/restaurants)
- [x] **Kullanıcılar:** Tüm kullanıcıları listeleme ve yönetim (/admin/users)
- [x] **Global Kategoriler:** Sistem geneli kategori yönetimi (/admin/categories)
- [x] **Global Ürünler:** Sistem geneli ürün yönetimi (/admin/products)
- [x] **Ayarlar:** Sistem ayarları (/admin/settings)

### B. Restoran Sahibi Paneli (Dashboard)
- [x] **Dashboard:** Günlük özet ve istatistikler (/dashboard)
- [x] **Restoranlarım:** Restoran listesi ve yönetimi (/dashboard/restaurants)
- [x] **Kategoriler:** Kategori ekleme/düzenleme (/dashboard/categories)
- [x] **Ürünler:** Ürün ekleme/düzenleme (/dashboard/products)
- [x] **Stok Yönetimi:** Envanter takibi ve uyarılar (/dashboard/stock)
- [x] **Personel:** Çalışan hesapları yönetimi (/dashboard/staff)
- [x] **Siparişler:** Sipariş geçmişi ve yönetimi (/dashboard/orders)
- [x] **Raporlar:** Satış grafikleri ve rapor ekranları (/dashboard/reports)

## 5. Frontend: Operasyonel Ekranlar

### A. Garson Terminali (Mobil/Tablet)
- [x] Masa seçimi ve Sipariş oluşturma arayüzü
- [x] Anlık sipariş durumu takibi

### B. Mutfak Ekranı (KDS)
- [x] Gerçek zamanlı sipariş akışı
- [x] Kategori/Durum filtreleme
- [x] "Hazır" durumuna getirme butonu ve sesli bildirimler

### C. Kasa Terminali
- [x] Ödeme alma ekranı (Nakit/Kart/Parçalı seçimli)
- [x] Geçmiş siparişler ve Kasa kapatma ekranı

### D. Müşteri QR Menü
- [x] `/restoran-slug/menu` yapısında public sayfa
- [x] Sadece görüntüleme (Kategori, Ürün listesi, Ürün detayı)
- [x] Responsive tasarım (Mobil öncelikli)

## 6. Tasarım ve UX
- [x] Kafe/Restoran konseptine uygun tema ve renk paleti
- [x] Tüm cihazlar için responsive (uyumlu) yapı
- [x] Kullanıcı dostu tipografi ve buton yerleşimleri

## 7. Test, Hata Düzeltmeleri ve Deployment

### Hata Düzeltmeleri (Bug Fixes)
- [x] `Home` bileşeninde `setLocation()` render döngüsü hatası (Hata tespit edilmedi)
- [x] `/admin` route 404 hatası (Admin route'u mevcut ve çalışıyor)
- [ ] OAuth giriş sonrası rol atama sorunları (OAuth henüz implement edilmedi)
- [x] Admin panelindeki buton işlevsellik hataları (Düzeltildi)
- [x] Kayıt sonrası yönlendirme sorunları (Restoran oluşturma sayfasına yönlendirme eklendi)

### Test ve Canlıya Alma
- [x] **Test Verisi:** Global Kategoriler (5 adet) ve Ürünler (10 adet) oluşturma
- [ ] **Test Senaryoları:** Restoran sahibi hesabı ile tam tur (Kayıt -> Menü -> Sipariş -> Ödeme)
- [ ] **Kod Testleri:** Birim, Entegrasyon, E2E ve Performans testleri
- [ ] **Deployment:** Checkpoint oluşturma ve sunucu kurulumu

### Teknolojiler
- [x] **Backend:** ExpressJS
- [x] **Frontend:** NextJs
- [x] **Veritabanı:** Prisma ORM (PostgreSQL)
- [x] **SoftDelete:**
- [x] **History audit:**