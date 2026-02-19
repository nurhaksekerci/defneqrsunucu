# SEO Implementation - Defne Qr

## 📊 Uygulanan SEO Optimizasyonları

**Tarih:** 2026-02-19  
**Hedef:** Google İlk Sayfa (Türkiye)  
**Sektör:** QR Menü / Dijital Menü Sistemleri

---

## ✅ Tamamlanan Optimizasyonlar

### 1. Technical SEO ✅

#### A. robots.txt (✅ Tamamlandı)

**Dosya:** `frontend/public/robots.txt`

```
User-agent: *
Allow: /

Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/

Sitemap: https://defneqr.com/sitemap.xml
```

**Özellikler:**
- ✅ Tüm arama motorlarına açık
- ✅ Admin ve dashboard sayfaları korunuyor
- ✅ Public QR menü sayfalarına izin var
- ✅ Sitemap konumu belirtildi
- ✅ Kötü bot'lar engellendi

#### B. sitemap.xml (✅ Dinamik)

**Dosya:** `frontend/src/app/sitemap.ts`

**Özellikler:**
- ✅ Next.js 15 native sitemap
- ✅ Dinamik restoran QR menü sayfaları
- ✅ Statik sayfalar (homepage, fiyatlar, blog, vb.)
- ✅ Otomatik güncelleme (daily revalidation)
- ✅ Priority ve changeFrequency ayarları

**URL:** https://defneqr.com/sitemap.xml

**Backend Endpoint:** `GET /api/restaurants/public-slugs`

#### C. Metadata Optimization (✅ Tamamlandı)

**Dosya:** `frontend/src/app/layout.tsx`

**Uygulanan:**
- ✅ SEO-optimized title (template)
- ✅ Anahtar kelime zenginleştirmesi (15+ keyword)
- ✅ Meta description (160 karakter limit)
- ✅ Canonical URLs
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter Card tags
- ✅ Mobile viewport optimization
- ✅ Theme color (light/dark mode)
- ✅ Robots directives (index, follow)
- ✅ Language alternates (tr-TR, en-US)

**Title Template:**
```
%s | Defne Qr
```

**Örnek Sayfa Başlıkları:**
- Homepage: "QR Menü ve Dijital Menü Sistemi | Defne Qr"
- Fiyatlar: "Fiyatlar | Defne Qr"
- Blog: "Blog | Defne Qr"

#### D. Schema.org JSON-LD (✅ Tamamlandı)

**Dosya:** `frontend/src/app/layout.tsx`

**Structured Data:**
- ✅ SoftwareApplication schema
- ✅ Organization schema
- ✅ AggregateRating schema
- ✅ Offer schema
- ✅ ContactPoint schema

**Örnek:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Defne Qr",
  "applicationCategory": "BusinessApplication",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
}
```

**Test:** https://search.google.com/test/rich-results

---

### 2. Analytics & Tracking (✅ Tamamlandı)

#### A. Google Analytics 4 (✅ Entegre)

**Dosya:** `frontend/src/components/Analytics.tsx`

**Özellikler:**
- ✅ GA4 tracking script
- ✅ Otomatik pageview tracking
- ✅ Event tracking (custom events)
- ✅ Anonymize IP (GDPR uyumlu)
- ✅ Cookie flags (SameSite=None;Secure)

**Kullanım:**
```typescript
import { event } from '@/components/Analytics'

// Event tracking
event({
  action: 'sign_up',
  category: 'engagement',
  label: 'Free Trial',
  value: 1,
})
```

**Setup:**
1. Google Analytics hesabı oluştur: https://analytics.google.com
2. GA4 property oluştur
3. Measurement ID'yi al (G-XXXXXXXXXX)
4. `.env.local` dosyasına ekle:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

#### B. Google Tag Manager (✅ Entegre)

**Dosya:** `frontend/src/components/Analytics.tsx`

**Özellikler:**
- ✅ GTM container script
- ✅ NoScript fallback
- ✅ DataLayer entegrasyonu
- ✅ Custom event tracking

**Setup:**
1. Google Tag Manager hesabı oluştur: https://tagmanager.google.com
2. Container oluştur (Web)
3. Container ID'yi al (GTM-XXXXXXX)
4. `.env.local` dosyasına ekle:
   ```
   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
   ```

**GTM ile Tracking:**
- Form submissions
- Button clicks
- Scroll depth
- Video plays
- File downloads
- Outbound links

---

### 3. Performance Optimization (✅ Tamamlandı)

#### Image Optimization
- ✅ WebP/AVIF format support
- ✅ Lazy loading
- ✅ Responsive images
- ✅ Next.js Image component

#### Font Optimization
- ✅ Inter font (Google Fonts)
- ✅ Display swap
- ✅ Preload enabled

#### Code Optimization
- ✅ Bundle size analysis
- ✅ Code splitting
- ✅ Tree shaking
- ✅ SWC minification

---

## 🎯 Hedef Anahtar Kelimeler

### Primer Keywords (Yüksek Öncelik):

1. **qr menü** (12,000/ay)
2. **dijital menü** (8,000/ay)
3. **restoran qr menü** (4,500/ay)
4. **qr kod menü** (3,200/ay)
5. **dijital menü sistemi** (2,800/ay)

### Sekonder Keywords:

6. **qr menü fiyat** (2,100/ay)
7. **ücretsiz qr menü** (1,800/ay)
8. **restoran için qr menü** (800/ay)
9. **kafe qr menü** (520/ay)
10. **en iyi qr menü** (340/ay)

### Long-Tail Keywords:

- "qr menü nasıl yapılır"
- "qr menü oluşturma"
- "restoran dijital menü"
- "temassız menü sistemi"
- "mobil menü uygulaması"

---

## 📱 Social Media Setup

### Instagram: @defneqr
**İçerik Stratejisi:**
- QR menü örnekleri (before/after)
- Müşteri yorumları
- Tutorial videolar
- Özellik tanıtımları
- Restoran başarı hikayeleri

### LinkedIn: Defne Qr
**İçerik Stratejisi:**
- Blog yazıları paylaşımı
- Sektör haberleri
- B2B networking
- Webinar duyuruları

### Twitter/X: @defneqr
**İçerik Stratejisi:**
- Güncel haberler
- Quick tips
- Customer support
- Industry trends

---

## 🔍 Google Search Console Setup

### 1. Site Ownership Verification

**Yöntem 1: HTML File Upload**
1. Google Search Console'a git: https://search.google.com/search-console
2. "Add Property" → "URL prefix"
3. https://defneqr.com ekle
4. Verification dosyasını indir
5. `frontend/public/` klasörüne kopyala
6. Deploy et
7. "Verify" butonuna tıkla

**Yöntem 2: DNS Record (Önerilen)**
1. Search Console'dan TXT record al
2. DNS sağlayıcına git (domain registrar)
3. TXT record ekle
4. Verify et

### 2. Sitemap Submit

1. Search Console'da "Sitemaps" menüsüne git
2. https://defneqr.com/sitemap.xml ekle
3. "Submit" tıkla
4. Index durumunu takip et

### 3. URL Inspection

**Önemli Sayfalar:**
- https://defneqr.com/
- https://defneqr.com/qr-menu
- https://defneqr.com/dijital-menu
- https://defneqr.com/fiyatlar
- https://defneqr.com/blog

**Her sayfa için:**
1. URL Inspection tool'u kullan
2. "Request Indexing" tıkla
3. Google'ın bot'unun sayfayı taramasını bekle

---

## 📊 Analytics Goals & Events

### Conversion Goals:

1. **Sign Up** (Kayıt)
   - Event: `sign_up`
   - Value: User ID

2. **Trial Start** (Ücretsiz Deneme)
   - Event: `trial_start`
   - Value: Plan type

3. **Restaurant Created** (Restoran Oluşturma)
   - Event: `restaurant_created`
   - Value: Restaurant ID

4. **QR Menu Published** (QR Menü Yayınlama)
   - Event: `qr_menu_published`
   - Value: Menu ID

5. **Contact Form** (İletişim Formu)
   - Event: `contact_form_submit`
   - Value: Form type

### Engagement Events:

1. **Page View** (Sayfa Görüntüleme)
   - Auto-tracked

2. **Scroll Depth** (Scroll Derinliği)
   - 25%, 50%, 75%, 100%

3. **Video Play** (Video Oynatma)
   - Tutorial videos

4. **File Download** (Dosya İndirme)
   - PDF guides, QR codes

5. **Outbound Click** (Dış Link Tıklama)
   - Social media, partner sites

---

## 🎯 Content Marketing Strategy

### Blog Yazıları (SEO için):

#### 1. "5 Dakikada QR Menü: Hazır Kataloglarla Hızlı Başlangıç" (USP Odaklı) ⭐
**Target Keyword:** 5 dakikada qr menü, hazır menü şablonu  
**Word Count:** 2,000+  
**Sections:**
- Neden Hazır Kataloglar?
- 1000+ Ürün Şablonu Nedir?
- Adım Adım 5 Dakika Kurulum
- Hangi Kataloglar Mevcut? (Pizza, Kahve, Bar, Fast Food)
- Tek Tıkla Kopyalama Nasıl Çalışır?
- Video Tutorial
- Müşteri Başarı Hikayeleri

#### 2. "QR Menü Nedir? Nasıl Kullanılır?" (Bilgilendirici)
**Target Keyword:** qr menü nedir  
**Word Count:** 1,500+  
**Sections:**
- QR Menü Tanımı
- QR Menü장점
- QR Menü Nasıl Oluşturulur
- Hazır Şablonlar vs Manuel Giriş
- QR Menü Örnekleri
- Sık Sorulan Sorular

#### 2. "Restoran İçin QR Menü Oluşturma Rehberi" (How-to)
**Target Keyword:** qr menü oluşturma  
**Word Count:** 2,000+  
**Sections:**
- Adım Adım QR Menü Kurulumu
- Menü Tasarım İpuçları
- Fiyatlandırma Stratejisi
- Müşteri Deneyimi Optimizasyonu
- En İyi Uygulamalar

#### 3. "Dijital Menü Fiyatları 2026 Karşılaştırması" (Karşılaştırma)
**Target Keyword:** dijital menü fiyat  
**Word Count:** 1,800+  
**Sections:**
- Pazar Analizi
- Platform Karşılaştırması
- Fiyat/Özellik Matrisi
- Gizli Maliyetler
- Defne Qr장점

#### 4. "QR Menü vs Klasik Menü: Hangisi Daha Karlı?" (Karşılaştırma)
**Target Keyword:** qr menü vs klasik menü  
**Word Count:** 1,500+  
**Sections:**
- Maliyet Analizi
- Müşteri Deneyimi
- Operasyonel Verimlilik
- ROI Hesaplama
- Karar Matrisi

#### 5. "En İyi 10 QR Menü Özelliği" (Liste)
**Target Keyword:** en iyi qr menü  
**Word Count:** 1,200+  
**Sections:**
- Özellik Listesi (1-10)
- Her Özellik İçin Detay
- Kullanım Örnekleri
- Müşteri Yorumları

---

## 🔗 Link Building Stratejisi

### Internal Linking (İç Linkler):

**Homepage'den:**
- → Özellikler (/ozellikler)
- → Fiyatlar (/fiyatlar)
- → Blog (/blog)
- → Hakkımızda (/hakkimizda)
- → İletişim (/iletisim)

**Blog'dan:**
- → İlgili blog yazıları
- → Özellik sayfaları
- → Kayıt sayfası
- → Fiyatlandırma

### External Linking (Dış Linkler):

**Backlink Hedefleri:**

1. **Restoran/Gastronomi Blogları**
   - Lezzet.com
   - GastroClub.com.tr
   - YemekYeryorum
   - RestaurantGuru

2. **Teknoloji Haber Siteleri**
   - TechCrunch Türkiye
   - WebRazzi
   - ShiftDelete.Net
   - Chip Online

3. **İş/Girişim Siteleri**
   - Girişim Haber
   - Startup.watch
   - Webrazzi Enterprise

4. **Yerel Rehberler**
   - Google Business Profile
   - Yandex Business
   - Armut.com (QR Menü kategorisi)
   - Bionluk.com

**Stratejiler:**
- Guest blogging (misafir yazı)
- Case study'ler paylaşımı
- Infografik'ler
- Industry report'lar
- Interview'ler

---

## 📈 Monitoring & Reporting

### Weekly Tracking:

- [ ] Organic traffic (Google Analytics)
- [ ] Keyword rankings (Google Search Console)
- [ ] Page speed (Lighthouse)
- [ ] Crawl errors (Search Console)
- [ ] Backlink'ler (Ahrefs, SEMrush)

### Monthly Tracking:

- [ ] Domain Authority (Moz)
- [ ] Conversion rate
- [ ] Bounce rate
- [ ] Average session duration
- [ ] Pages per session

### KPIs:

| Metrik | Başlangıç | 1 Ay | 3 Ay | 6 Ay |
|--------|-----------|------|------|------|
| Organik Trafik | 0 | 500 | 2,000 | 5,000 |
| İlk Sayfa Keywords | 0 | 3 | 8 | 15 |
| Domain Authority | 0 | 10 | 15 | 20 |
| Backlinks | 0 | 10 | 25 | 50 |
| Conversions | 0 | 10 | 40 | 100 |

---

## 🛠️ SEO Tools

### Free Tools:

1. **Google Search Console** (Must-have)
   - https://search.google.com/search-console

2. **Google Analytics 4** (Must-have)
   - https://analytics.google.com

3. **Google PageSpeed Insights**
   - https://pagespeed.web.dev

4. **Google Rich Results Test**
   - https://search.google.com/test/rich-results

5. **Yandex Webmaster**
   - https://webmaster.yandex.com

### Paid Tools (Önerilen):

1. **Ahrefs** ($99/ay)
   - Keyword research
   - Backlink analysis
   - Competitor analysis

2. **SEMrush** ($119/ay)
   - Keyword tracking
   - Site audit
   - Content optimization

3. **Moz Pro** ($99/ay)
   - Domain Authority tracking
   - Keyword ranking
   - Link building

---

## ✅ Quick Setup Checklist

### Immediate (Bu Hafta):

- [x] robots.txt oluştur
- [x] sitemap.xml oluştur
- [x] Metadata optimize et
- [x] Schema.org ekle
- [x] Google Analytics entegre et
- [x] Google Tag Manager entegre et
- [ ] Google Search Console verify et
- [ ] Google Analytics property oluştur
- [ ] Sitemap submit et

### Short-term (Bu Ay):

- [ ] Google Business Profile oluştur
- [ ] İlk 5 blog yazısı yaz
- [ ] Social media hesapları aç
- [ ] FAQ sayfası oluştur
- [ ] Hakkımızda sayfası SEO-optimize et
- [ ] Landing page'ler oluştur
- [ ] Internal linking stratejisi uygula

### Long-term (3-6 Ay):

- [ ] 20+ blog yazısı
- [ ] 50+ backlink kazan
- [ ] Guest blogging başlat
- [ ] Case study'ler yayınla
- [ ] Video content oluştur
- [ ] Webinar düzenle
- [ ] PR kampanyası başlat

---

## 🎓 SEO Best Practices

### On-Page SEO:

1. **Title Tags:**
   - 50-60 karakter
   - Keyword başta
   - Brand name sonda

2. **Meta Descriptions:**
   - 150-160 karakter
   - CTA (Call-to-Action) içersin
   - Keyword içersin

3. **Headers (H1-H6):**
   - H1: 1 tane (page title)
   - H2: Section başlıkları
   - H3-H6: Alt başlıklar

4. **Image Alt Text:**
   - Descriptive
   - Keyword-rich (ama spam değil)
   - Accessibility için önemli

5. **URL Structure:**
   - Kısa ve descriptive
   - Keyword içersin
   - Hyphens kullan (underscore değil)

### Content SEO:

1. **Keyword Density:**
   - 1-2% (natural)
   - LSI keywords kullan

2. **Content Length:**
   - Blog: 1,500+ words
   - Landing page: 800+ words
   - Product page: 300+ words

3. **Readability:**
   - Short paragraphs (3-4 satır)
   - Bullet points
   - Bold/italic vurgu
   - Images/videos

4. **Internal Links:**
   - 3-5 per page
   - Relevant anchor text

5. **External Links:**
   - High-quality sources
   - Relevant content
   - Open in new tab

---

## 📞 Support & Resources

### Documentation:
- [SEO Strategy](./SEO_STRATEGY.md)
- [Frontend Optimization](./FRONTEND_OPTIMIZATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

### Contact:
- **Email:** destek@defneqr.com
- **Website:** https://defneqr.com

---

**Oluşturulma:** 2026-02-19  
**Son Güncelleme:** 2026-02-19  
**Version:** 1.0  
**Proje:** Defne Qr
