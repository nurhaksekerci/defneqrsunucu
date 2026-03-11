# DefneRandevu — Özellik Yol Haritası

## ✅ Tamamlanan Özellikler

### Online Randevu Sistemi
- Müşteriler `randevu.defneqr.com/b/{slug}` adresinden randevu oluşturabilir
- Hizmet, personel, tarih/saat ve iletişim bilgileri ile self-booking
- İşletme sahipleri dashboard'dan "Online Randevu Linki" ile paylaşım yapabilir

### Temel Randevu Yönetimi
- Personel CRUD (sınırsız)
- Hizmet CRUD
- Müşteri yönetimi (sınırsız)
- Takvim görünümü (haftalık)
- Randevu ekleme, silme
- Destek talepleri

### İşletme Yönetimi
- Hesap başına 1 işletme
- İşletme bilgileri (ad, adres, telefon)

---

## 📋 Planlanan Özellikler

### 1. Ürün Yönetimi ✅
- Satışa sunulan ürünlerin yönetimi (ad, SKU, fiyat, stok)
- Satış kaydı (miktar, müşteri, not)
- Ürün bazlı satış raporu (tarih aralığı, toplam tutar)

### 2. Randevu Hatırlatıcı (SMS/Email) ✅
- 24 saat ve 1 saat önce otomatik hatırlatma
- SMS (NetGSM) + E-posta gönderimi
- Konum (adres + Google Maps linki) mesajlara dahil
- Tüm gönderimler AppointmentSmsLog'da kayıt altında

### 3. Konum Gönderimi ✅
- Hatırlatma mesajlarında işletme konumu (Google Maps linki)
- SMS ve e-posta içinde adres bilgisi

### 4. Tekrar Eden Randevular ✅
- Haftalık, iki haftada bir veya aylık tekrar
- Randevu tamamlandığında otomatik sonraki oluşturma
- Bitiş tarihi ile sınır

### 5. İstatistik Paneli ✅
- Aylık randevu sayısı
- Büyüme eğrileri (bu ay / geçen ay karşılaştırması)
- Yoğun dönem analizi (gün ve saat bazlı)
- Durum dağılımı, hizmet bazlı randevular

### 6. Gelir, Gider ve Alacak Takibi ✅
- Gelir/gider kayıtları (kategori, tarih, tutar)
- Alacak takibi (müşteri bazlı, tahsilat kaydı)
- Özet kartları (toplam gelir, gider, net, bekleyen alacak)

### 7. Paket Takip Sistemi ✅
- Müşterilere paket tanımlama (örn: 10 seans, hizmet bazlı)
- Kalan hak takibi (remainingSessions)
- Randevu tamamlanırken paket seansı kullanma
- Paket bitiş uyarıları (7 gün kala SMS)

---

## Teknik Notlar

- **Online randevu URL:** `https://randevu.defneqr.com/b/{işletme-slug}`
- **API:** `POST /api/businesses/slug/:slug/book` (public, auth gerekmez)
- **Mevcut modeller:** AppointmentWorkingHours, AppointmentSmsLog (SMS için hazır)
