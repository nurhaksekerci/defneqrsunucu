# Google Analytics & Tag Manager Setup Guide

## 🎯 Hızlı Kurulum Kılavuzu

Bu rehber, Defne Qr için Google Analytics 4 ve Google Tag Manager kurulumunu adım adım anlatır.

**Tahmini Süre:** 20 dakika

---

## 📊 Google Analytics 4 Setup (10 dakika)

### Adım 1: Google Analytics Hesabı Oluştur

1. **Google Analytics'e Git:**
   - https://analytics.google.com
   - Gmail hesabınızla giriş yapın

2. **Admin Panel:**
   - Sol alt köşede "⚙️ Admin" butonuna tıklayın

3. **Property Oluştur:**
   - "Create Property" butonuna tıklayın
   - **Property name:** Defne Qr
   - **Reporting time zone:** (GMT+03:00) Turkey Time
   - **Currency:** Turkish Lira (TRY)
   - "Next" tıklayın

4. **Business Details:**
   - **Industry:** Software / Technology
   - **Business size:** Small (1-10 employees)
   - "Next" tıklayın

5. **Business Objectives:**
   - ☑️ Generate leads
   - ☑️ Examine user behavior
   - "Create" tıklayın

### Adım 2: Data Stream Oluştur

1. **Web Stream:**
   - "Web" seçeneğini tıklayın

2. **Stream Details:**
   - **Website URL:** https://defneqr.com
   - **Stream name:** Defne Qr Website
   - "Create stream" tıklayın

### Adım 3: Measurement ID'yi Al

1. **Stream Details Sayfası:**
   - `G-XXXXXXXXXX` formatında bir kod göreceksiniz
   - Bu sizin **Measurement ID**'niz

2. **Kopyala:**
   ```
   G-XXXXXXXXXX
   ```

### Adım 4: Frontend'e Ekle

1. **`.env.local` Dosyası:**
   
   Frontend dizininde `.env.local` oluşturun:
   ```bash
   cd frontend
   echo "NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX" > .env.local
   ```

   veya manuel olarak:
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_SITE_URL=https://defneqr.com
   ```

2. **Kaydet ve Restart:**
   ```bash
   # Frontend'i restart et
   npm run dev
   ```

### Adım 5: Test Et

1. **Tarayıcıda Aç:**
   - http://localhost:3000

2. **Google Analytics Realtime:**
   - Analytics paneline dön
   - "Reports" → "Realtime"
   - 30 saniye içinde ziyaretçi görmelisiniz!

3. **Başarılı! ✅**

---

## 🏷️ Google Tag Manager Setup (10 dakika)

### Adım 1: GTM Hesabı Oluştur

1. **Google Tag Manager'a Git:**
   - https://tagmanager.google.com
   - Gmail hesabınızla giriş yapın

2. **Create Account:**
   - "Create Account" butonuna tıklayın

3. **Account Setup:**
   - **Account Name:** Defne Qr
   - **Country:** Turkey
   - ☑️ Share data anonymously with Google
   - "Continue" tıklayın

4. **Container Setup:**
   - **Container name:** defneqr.com
   - **Target platform:** ☑️ Web
   - "Create" tıklayın

5. **Terms of Service:**
   - Kabul edin ("Yes")

### Adım 2: Container ID'yi Al

1. **Workspace Sayfası:**
   - Sağ üstte `GTM-XXXXXXX` formatında bir kod göreceksiniz
   - Bu sizin **Container ID**'niz

2. **Kopyala:**
   ```
   GTM-XXXXXXX
   ```

### Adım 3: Frontend'e Ekle

1. **`.env.local` Dosyasına Ekle:**
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   NEXT_PUBLIC_SITE_URL=https://defneqr.com
   ```

2. **Kaydet ve Restart:**
   ```bash
   npm run dev
   ```

### Adım 4: GA4'ü GTM'e Bağla (Önerilen)

1. **GTM Workspace:**
   - "Add a new tag" tıklayın

2. **Tag Configuration:**
   - "Google Analytics: GA4 Configuration"
   - **Measurement ID:** G-XXXXXXXXXX (GA4 ID'niz)

3. **Triggering:**
   - "All Pages" seçin

4. **Save:**
   - Tag name: "GA4 - All Pages"
   - "Save" tıklayın

5. **Submit:**
   - Sağ üstte "Submit" butonuna tıklayın
   - **Version name:** "Initial GA4 Setup"
   - "Publish" tıklayın

### Adım 5: Test Et

1. **Preview Mode:**
   - GTM'de "Preview" butonuna tıklayın
   - Website URL: http://localhost:3000
   - "Connect" tıklayın

2. **Debug Panel:**
   - Tarayıcıda debug panel açılır
   - Tag'lerin çalıştığını göreceksiniz

3. **Başarılı! ✅**

---

## 🎯 Custom Events Setup (GTM)

### Event 1: Sign Up (Kayıt)

1. **GTM'de New Tag:**
   - Tag type: "Google Analytics: GA4 Event"
   - **Configuration Tag:** GA4 Configuration
   - **Event Name:** sign_up

2. **Trigger:**
   - Trigger type: "Custom Event"
   - **Event name:** sign_up
   - "Save"

3. **Frontend'de Trigger Et:**
   ```typescript
   import { event } from '@/components/Analytics'
   
   // Kayıt başarılı olduğunda
   event({
     action: 'sign_up',
     category: 'engagement',
     label: 'Free Trial',
     value: 1,
   })
   ```

### Event 2: Restaurant Created

1. **GTM'de New Tag:**
   - Event Name: restaurant_created

2. **Trigger:**
   - Custom Event: restaurant_created

3. **Frontend'de:**
   ```typescript
   event({
     action: 'restaurant_created',
     category: 'conversion',
     label: restaurant.name,
     value: 1,
   })
   ```

### Event 3: Button Clicks

1. **GTM'de New Tag:**
   - Event Name: button_click

2. **Trigger:**
   - Trigger type: "Click - All Elements"
   - **Fire on:** Some Clicks
   - **Click Element matches CSS selector:** .btn-primary

3. **Auto-tracked!**

---

## 📊 Conversion Tracking

### Goal 1: Free Trial Started

1. **GA4'te:**
   - "Configure" → "Events"
   - "Create event" tıklayın

2. **Custom Event:**
   - **Event name:** trial_started
   - **Matching conditions:**
     - event_name = sign_up
     - user_properties.plan = "free"

3. **Mark as Conversion:**
   - "Mark as conversion" toggle'ı aç

### Goal 2: Restaurant Published

1. **Custom Event:**
   - **Event name:** restaurant_published
   - Mark as conversion

---

## 🔍 Debugging & Troubleshooting

### Analytics Çalışmıyor?

**Kontrol Listesi:**
- [ ] `.env.local` dosyası var mı?
- [ ] GA_ID doğru formatta mı? (G-XXXXXXXXXX)
- [ ] Frontend restart edildi mi?
- [ ] Tarayıcıda console error'u var mı?
- [ ] Ad blocker kapalı mı?

**Chrome DevTools:**
```javascript
// Console'da test et
console.log(window.gtag)
console.log(window.dataLayer)

// dataLayer'daki event'leri gör
window.dataLayer
```

### GTM Çalışmıyor?

**Kontrol Listesi:**
- [ ] GTM_ID doğru formatta mı? (GTM-XXXXXXX)
- [ ] Tag'ler publish edildi mi?
- [ ] Preview mode'da test edildi mi?

**Chrome Extension:**
- "Tag Assistant" extension'ı kur
- GTM tag'lerini görüntüle

---

## 📈 Monitoring Dashboard

### Google Analytics 4 Dashboard:

**Ana Metrikler:**
1. **Users:** Toplam kullanıcı
2. **Sessions:** Oturum sayısı
3. **Bounce Rate:** Hemen çıkma oranı
4. **Average Session Duration:** Ortalama oturum süresi

**Conversion Metrikler:**
1. **sign_up:** Kayıt sayısı
2. **trial_started:** Deneme başlatma
3. **restaurant_created:** Restoran oluşturma
4. **qr_menu_published:** QR menü yayınlama

### Custom Reports:

1. **Acquisition Report:**
   - Traffic sources
   - Landing pages
   - Campaign performance

2. **Engagement Report:**
   - Top pages
   - Event count
   - User engagement

3. **Monetization Report:**
   - Conversion funnel
   - Revenue (gelecekte)

---

## 🎓 Best Practices

### Privacy & GDPR:

1. **Cookie Consent:**
   ```typescript
   // Cookie consent banner ekle (gelecek)
   // Kullanıcı izni olmadan tracking yapma
   ```

2. **Anonymize IP:**
   ```javascript
   // Zaten implementedevice:
   gtag('config', 'G-XXXXXXXXXX', {
     anonymize_ip: true
   });
   ```

3. **Data Retention:**
   - GA4'te "Data Settings" → "Data Retention"
   - 14 ay olarak ayarla (GDPR uyumlu)

### Performance:

1. **Async Loading:**
   - ✅ Already implemented (async scripts)

2. **Cookie Flags:**
   - ✅ SameSite=None;Secure already set

3. **Minimize Tracking:**
   - Sadece önemli event'leri track et
   - Gereksiz event'lerden kaçın

---

## ✅ Kurulum Tamamlandı!

### Sonraki Adımlar:

1. **24 Saat Bekle:**
   - GA4'te ilk data görünmesi 24-48 saat sürebilir

2. **Alerts Kur:**
   - Anomaly detection
   - Traffic drop alerts

3. **Custom Dimensions:**
   - User role (admin, restaurant_owner)
   - Plan type (free, premium, enterprise)
   - Restaurant count

4. **E-commerce Tracking (Gelecek):**
   - Purchase events
   - Revenue tracking
   - Product performance

---

## 📞 Destek

**Sorun mu var?**
- Google Analytics Help: https://support.google.com/analytics
- GTM Help: https://support.google.com/tagmanager
- Defne Qr Destek: destek@defneqr.com

---

**Oluşturulma:** 2026-02-19  
**Proje:** Defne Qr  
**Version:** 1.0
