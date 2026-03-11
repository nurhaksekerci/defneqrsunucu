# DefneRandevu — SaaS Randevu Yönetim Sistemi

---

## Entegrasyon Mimarisi (DefneQr ile Ortak Altyapı)

DefneRandevu, mevcut DefneQr altyapısı üzerine entegre edilecektir. **defneqr.com çalışmaları bozulmayacaktır.**

### Ortak Bileşenler

| Bileşen | Açıklama |
| ------- | -------- |
| **Admin Panel** | Tek admin paneli, her iki proje için ortak |
| **Authentication** | Aynı JWT, login, register, OAuth |
| **Destek Kayıtları** | SupportTicket tablosu ortak, `project` ile ayrım |
| **Loglar** | Ortak log sistemi, `project` ile filtrelenebilir |
| **Veritabanı** | Tek PostgreSQL instance |
| **Sunucu** | Tek sunucu, tek Docker Compose |

### Proje Tanımlayıcı (project)

Tablolarda hangi projeye ait olduğunu belirtmek için `project` alanı kullanılır:

- `defneqr` — Mevcut QR Menü sistemi (varsayılan)
- `defnerandevu` — Randevu sistemi

**Mevcut kayıtlar:** Migration ile `project = 'defneqr'` olarak işaretlenir.

### Adres Yapısı

| Aşama | DefneQr | DefneRandevu | Admin |
| ----- | ------- | ------------ | ----- |
| **Şu an (geçici)** | defneqr.com | randevu.defneqr.com | admin.defneqr.com (veya mevcut) |
| **Gelecek** | defneqr.com | defnerandevu.com | defnesoftware.com |

### Subdomain Yapılandırması (randevu.defneqr.com)

```
randevu.defneqr.com  →  Frontend (Next.js randevu uygulaması)
api.defneqr.com      →  Backend (ortak API, X-Project header ile routing)
```

Backend, `Host` veya `X-Project: defnerandevu` header'ına göre randevu route'larına yönlendirir.

### Veritabanı Değişiklikleri

**project alanı eklenecek tablolar:**

- `support_tickets` → `project` (default: 'defneqr')
- `ticket_messages` → (ticket üzerinden inherit)
- Log tabloları (varsa) → `project`

**Yeni DefneRandevu tabloları** (ayrı, randevuya özel):

- `appointment_business` (Business)
- `appointment_staff`
- `appointment_service`
- `appointment_staff_service`
- `appointment_working_hours`
- `appointment_customer`
- `appointment_appointment`
- `appointment_sms_log`

Önek `appointment_` ile DefneQr tablolarından ayrılır.

### API Yapısı

```
/api/auth/*           → Ortak (mevcut)
/api/admin/*          → Ortak (project filtresi ile)
/api/support/*       → Ortak (project filtresi ile)
/api/restaurants/*    → DefneQr only
/api/appointments/*   → DefneRandevu only (yeni)
/api/businesses/*    → DefneRandevu only (yeni)
```

### Frontend Yapısı

```
/frontend                 → DefneQr (defneqr.com)
/frontend-randevu         → DefneRandevu (randevu.defneqr.com) — yeni Next.js app
```

veya **monorepo** ile:

```
/apps/defneqr             → defneqr.com
/apps/randevu             → randevu.defneqr.com
/apps/admin               → Ortak admin (ileride defnesoftware.com)
```

### Nginx (randevu.defneqr.com)

```nginx
server {
    listen 443 ssl;
    server_name randevu.defneqr.com;
    # ... ssl config ...
    location / {
        proxy_pass http://frontend-randevu:3000;  # veya aynı frontend, path-based
        # ...
    }
}
```

### Önemli Kurallar

1. **DefneQr kodu değiştirilmez** — Yeni özellikler izole modüller olarak eklenir.
2. **Mevcut tablolara sadece `project` kolonu** — Default `'defneqr'`.
3. **Ortak User tablosu** — DefneRandevu kullanıcıları da `users` tablosunda. `UserRole` enum'a `BUSINESS_OWNER`, `APPOINTMENT_STAFF` eklenebilir veya mevcut roller kullanılır.
4. **CORS / Origin** — api.defneqr.com, randevu.defneqr.com origin'lerini kabul eder.

---

## Proje Tanımı

DefneRandevu, küçük ve orta ölçekli işletmeler için geliştirilmiş çok kiracılı (multi-tenant) SaaS randevu yönetim platformudur.

Sistem sayesinde işletmeler:

- personellerini tanımlayabilir
- çalışma saatlerini belirleyebilir
- hizmet / seans sürelerini ayarlayabilir
- takvim üzerinden randevuları yönetebilir
- müşterileri randevu takvimine kaydedebilir
- müşterilere SMS hatırlatmaları gönderebilir

Bu sistem özellikle aşağıdaki sektörler için uygundur:

- Kuaför
- Berber
- Güzellik merkezleri
- Nail studio
- Cilt bakım merkezleri
- Diş klinikleri
- Psikolog / danışmanlık hizmetleri
- Masaj salonları
- Spor eğitmenleri
- Özel ders veren işletmeler

---

## Temel Özellikler

### Personel Yönetimi

İşletmeler sistem üzerinde personel tanımlayabilir.

**Personel için tutulacak bilgiler:**

- ad soyad
- telefon
- uzmanlık alanı
- aktif / pasif durumu
- takvim rengi
- notlar

### Çalışma Saatleri

Her personel için ayrı çalışma saatleri tanımlanabilir.

**Örnek:**

| Gün       | Saat          |
| --------- | ------------- |
| Pazartesi | 09:00 - 18:00 |
| Salı      | 10:00 - 19:00 |
| Çarşamba  | 09:00 - 18:00 |
| Pazar     | Kapalı        |

**Ek özellikler:**

- mola saatleri
- izin günleri
- özel gün kapatma
- manuel takvim bloklama

### Hizmet / Seans Yönetimi

İşletme sunduğu hizmetleri tanımlayabilir.

**Örnek:**

- saç kesimi
- sakal tıraşı
- manikür
- cilt bakımı
- psikolojik danışmanlık

**Her hizmet için:**

- hizmet adı
- süre (dakika)
- fiyat
- açıklama

tanımlanabilir.

### Personel Hizmet İlişkisi

Her personel yalnızca belirli hizmetleri verebilir.

**Örnek:**

- Ali → saç kesimi, sakal
- Ayşe → manikür, pedikür

Ayrıca hizmet süreleri personel bazında değiştirilebilir.

### Takvim Sistemi

Sistemin merkezi modülü takvimdir.

**Desteklenen görünümler:**

- günlük takvim
- haftalık takvim
- personel bazlı takvim
- tüm personellerin paralel görünümü

**Takvim üzerinde görülebilecek bilgiler:**

- dolu randevular
- boş slotlar
- mola saatleri
- izin günleri
- iptal edilen randevular

### Randevu Yönetimi

Kullanıcı takvim üzerinden hızlı randevu oluşturabilir.

**Randevu oluştururken:**

- personel seçilir
- tarih ve saat seçilir
- müşteri seçilir veya oluşturulur
- hizmet seçilir

**Sistem otomatik olarak:**

- hizmet süresini hesaplar
- çakışma kontrolü yapar
- slotu bloke eder

#### Randevu Durumları

Her randevu aşağıdaki durumlardan birine sahip olabilir:

- Bekliyor
- Onaylandı
- Tamamlandı
- İptal edildi
- Gelmedi (No-show)
- Ertelendi

> Geçmiş randevular sistemden silinmez.

### Müşteri Yönetimi

Sistem müşteri verilerini saklar.

**Müşteri bilgileri:**

- ad soyad
- telefon numarası
- e-posta (opsiyonel)
- notlar
- son randevu tarihi
- toplam randevu sayısı

Müşteri geçmiş randevuları görüntülenebilir.

---

## SMS Bildirim Sistemi

Sistem müşterilere SMS ile bilgilendirme ve hatırlatma mesajları gönderir.

**SMS gönderimi aşağıdaki durumlarda yapılabilir:**

- randevu oluşturulduğunda
- randevu hatırlatma
- randevu güncellendiğinde
- randevu iptal edildiğinde

### Varsayılan SMS Gönderimi

Sistem SMS mesajlarını varsayılan olarak SaaS başlığı ile gönderir.

**Örnek mesaj:**

```
DEFNERANDEVU

Sayın Ayşe Yılmaz,

Defne Kuaför işletmesinde
12 Mart saat 14:30 için randevunuz bulunmaktadır.
```

### Kendi Şirket Adıyla SMS Gönderme

İşletmeler isterlerse SMS mesajlarını kendi şirket adlarıyla gönderebilirler.

Bu işlem NetGSM entegrasyonu ile yapılır.

#### NetGSM Başlıklı SMS Kurulumu

Kullanıcının kendi SMS başlığıyla mesaj gönderebilmesi için aşağıdaki adımları tamamlaması gerekir.

**1. NetGSM Hesabı Açmak**

Kullanıcı NetGSM'e kayıt olur ve gerekli belgeleri yükler.

Genellikle istenen belgeler:

- vergi levhası
- imza sirküleri
- yetkili kimlik bilgileri

Belgeler yüklendikten sonra başlıklı SMS onay süreci başlar.

**2. SMS Başlık Onayı**

NetGSM işletmenin SMS başlığını onaylar.

Örnek başlıklar:

- `DEFNEKUAFOR`
- `AYSECLINIC`
- `DRALIBAYAR`

**3. SMS Paketi Satın Alma**

Başlık onaylandıktan sonra kullanıcı NetGSM panelinden SMS paketi satın alır.

Örnek paketler:

- 1000 SMS
- 5000 SMS
- 10000 SMS

**4. API Bilgilerini Sisteme Tanımlama**

Kullanıcı aşağıdaki bilgileri destek ekibine iletir:

- NetGSM kullanıcı adı
- NetGSM API şifresi
- SMS başlığı

Bu bilgiler doğrulandıktan sonra entegrasyon aktif edilir.

### Plan Bağımsız SMS Entegrasyonu

Kendi SMS başlığıyla gönderim yapmak için premium plan zorunlu değildir.

Bu işlemler:

- Free plan
- Basic plan
- Premium plan

kullanan tüm işletmeler tarafından yapılabilir.

### SMS Hatırlatma Ayarları

İşletmeler randevu hatırlatma zamanını belirleyebilir.

**Desteklenen seçenekler:**

- 24 saat önce
- 3 saat önce
- 1 saat önce

### SMS Log Sistemi

Tüm SMS gönderimleri sistemde kayıt altına alınır.

**Tutulan bilgiler:**

- telefon numarası
- mesaj içeriği
- SMS başlığı
- gönderim zamanı
- gönderim durumu
- sağlayıcı yanıtı

---

## Sistem Rolleri

### Süper Admin

Platform yönetimi.

**Yetkiler:**

- işletmeleri görüntüleme
- plan yönetimi
- SMS ayarları
- sistem logları

### İşletme Admin

İşletmenin tüm operasyonlarını yönetir.

**Yetkiler:**

- personel yönetimi
- hizmet yönetimi
- takvim yönetimi
- randevu yönetimi
- müşteri yönetimi

### Personel

Kendi randevularını görüntüler.

---

## Teknik Mimari

### Backend

- Node.js
- Express.js
- REST API
- JWT Authentication

### Frontend

- Next.js
- Admin Dashboard
- Responsive UI

### Veritabanı

- PostgreSQL

### Yardımcı Servisler

- Redis (cache / job queue)
- SMS Provider (NetGSM)
- Docker deployment

---

## Temel Veri Modelleri

Ana veri yapıları:

- **Business**
- **User**
- **Staff**
- **Service**
- **StaffService**
- **WorkingHours**
- **Customer**
- **Appointment**
- **SmsLog**

---

## İş Kuralları

- Aynı personel aynı anda iki randevu alamaz
- Çalışma saati dışında randevu oluşturulamaz
- Mola saatinde randevu oluşturulamaz
- İzin gününde randevu oluşturulamaz
- Randevu iptal edilirse slot tekrar açılır
- Geçmiş randevular silinmez

---

## MVP Kapsamı

İlk sürümde yer alacak özellikler:

- işletme kaydı
- personel oluşturma
- çalışma saatleri
- hizmet yönetimi
- takvim görünümü
- randevu oluşturma
- müşteri yönetimi
- SMS hatırlatma

---

## Gelecek Geliştirmeler

Planlanan özellikler:

- online randevu alma sayfası
- müşteri paneli
- ödeme sistemi
- sadakat sistemi
- kampanya yönetimi
- çoklu şube
- gelişmiş raporlama
- mobil uygulama

---

## Sonuç

DefneRandevu, küçük işletmelerin randevu operasyonlarını dijitalleştiren ve aşağıdaki sorunları çözen bir platformdur:

- çakışan randevular
- unutulan randevular
- manuel ajanda kullanımı
- müşteri hatırlatma eksikliği
- personel planlama sorunları

Sistem, basit kullanım, güçlü takvim yönetimi ve SMS hatırlatma özellikleri ile işletmelerin operasyonel verimliliğini artırmayı hedefler.
