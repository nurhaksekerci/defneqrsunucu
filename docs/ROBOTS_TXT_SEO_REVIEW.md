# robots.txt İnceleme ve Google SEO Önerileri

## 🔍 Tespit Edilen Hatalar (Düzeltildi)

1. **Geçersiz Pattern Syntax**
   - `Allow: /[a-z0-9-]*/menu$` → Google robots.txt'de `[` ve `]` **literal** karakter olarak yorumlanır, regex değil.
   - `Disallow: /[slug]/menu/*?` → Aynı şekilde literal; robots.txt path'te query string kullanılmaz.

2. **Gereksiz Tekrarlar**
   - `Disallow: /admin/*` → `/admin/` zaten alt path'leri kapsar.

3. **Crawl-delay**
   - Google ve Bing bu direktifi yok sayar. Kaldırıldı.

4. **User-agent Grupları**
   - Ayrı Googlebot/Bingbot blokları Disallow kurallarını override ediyordu. Kaldırıldı.

---

## ✅ Uygulanan Düzeltmeler

- `Allow: /*/menu` → Dinamik restoran menüleri için doğru wildcard
- `Disallow: /[slug]/menu/*?` → Kaldırıldı
- `/hakkimizda`, `/iletisim`, `/sss` → Explicit Allow eklendi
- Gereksiz User-agent blokları kaldırıldı

---

## 📋 Ek SEO Önerileri (Uygulandı ✅)

1. **Preview URL'leri için noindex** ✅
   - `/[slug]/menu?preview=...` sayfalarına `robots: { index: false, follow: false }` eklendi (generateMetadata).

2. **Canonical URL** ✅
   - Restoran menü sayfalarında `alternates.canonical: https://defneqr.com/{slug}/menu` eklendi.

3. **Structured Data (JSON-LD)** ✅
   - Restoran menü sayfalarına `Restaurant` schema eklendi (MenuClient.tsx).

4. **Sitemap** ✅
   - Auth sayfaları (`/auth/login`, `/auth/register`) sitemap'ten çıkarıldı.
