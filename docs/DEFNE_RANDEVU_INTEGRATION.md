# DefneRandevu — DefneQr Entegrasyonu Teknik Rehber

Bu doküman, DefneRandevu'nun mevcut DefneQr altyapısına entegrasyonu için teknik adımları tanımlar.

## Özet

- **Randevu erişimi:** randevu.defneqr.com (geçici) → defnerandevu.com (gelecek)
- **Admin panel:** defnesoftware.com (gelecek)
- **defneqr.com değişmeyecek**

---

## 1. Veritabanı Değişiklikleri

### 1.1 Project Tablosu / Enum

```sql
-- Önce project enum oluştur
CREATE TYPE "Project" AS ENUM ('defneqr', 'defnerandevu');

-- support_tickets tablosuna project ekle
ALTER TABLE "support_tickets" ADD COLUMN "project" "Project" NOT NULL DEFAULT 'defneqr';
```

### 1.2 Prisma Schema Güncellemesi

```prisma
enum Project {
  defneqr
  defnerandevu
}

model SupportTicket {
  // ... mevcut alanlar ...
  project      Project   @default(defneqr)
  // ...
}
```

### 1.3 Yeni DefneRandevu Tabloları

Tüm randevu tabloları `appointment_` prefix’i ile oluşturulacak (veya ayrı schema kullanılabilir).

---

## 2. Backend Değişiklikleri

### 2.1 Middleware: Project Context

```javascript
// Request'ten project belirleme (Host veya X-Project header)
// randevu.defneqr.com → project = defnerandevu
// defneqr.com → project = defneqr
```

### 2.2 Route Yapısı

- `/api/appointments/*` — DefneRandevu API’leri
- `/api/auth/*` — Ortak (değişmez)
- `/api/support/*` — `project` filtresi eklenir

### 2.3 CORS

`api.defneqr.com` için izin verilen origin’ler:

- `https://defneqr.com`
- `https://www.defneqr.com`
- `https://randevu.defneqr.com`

---

## 3. Frontend Yapısı

### Seçenek A: Ayrı Next.js Uygulaması

```
/frontend          → DefneQr (defneqr.com)
/frontend-randevu  → DefneRandevu (randevu.defneqr.com)
```

### Seçenek B: Monorepo (Turborepo/Nx)

```
/apps/web-defneqr   → defneqr.com
/apps/web-randevu   → randevu.defneqr.com
/apps/admin         → Ortak admin (ileride defnesoftware.com)
/packages/ui        → Ortak UI bileşenleri
/packages/auth      → Ortak auth
```

---

## 4. Nginx Yapılandırması

```nginx
# randevu.defneqr.com için yeni server block
server {
    listen 443 ssl;
    http2 on;
    server_name randevu.defneqr.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... diğer ssl ayarları ...

    location / {
        proxy_pass http://frontend-randevu:3000;  # veya frontend:3001
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Docker Compose

```yaml
# frontend-randevu servisi (opsiyonel)
frontend-randevu:
  build:
    context: ./frontend-randevu
    dockerfile: Dockerfile
  environment:
    NEXT_PUBLIC_API_URL: https://api.defneqr.com/api
    NEXT_PUBLIC_SITE_URL: https://randevu.defneqr.com
  ports:
    - "127.0.0.1:3001:3000"
```

---

## 6. Migration Checklist

- [x] `Project` enum oluştur
- [x] `support_tickets.project` kolonu ekle (default: defneqr)
- [x] Mevcut destek kayıtları (migration default)
- [ ] Log tablolarına (varsa) `project` ekle
- [ ] Backend’e project middleware ekle
- [ ] Backend’e `/api/appointments/*` route’ları ekle
- [ ] CORS’a randevu.defneqr.com ekle
- [ ] Nginx’e randevu.defneqr.com server block ekle
- [ ] SSL sertifikası (Let’s Encrypt) randevu.defneqr.com için

---

## 7. Varsayılan Değerler

| Tablo / Kayıt | project Değeri |
| -------------- | -------------- |
| `support_tickets` (mevcut) | `defneqr` |
| `users` (mevcut) | — (proje-agnostik) |
| Tüm DefneQr tabloları | `defneqr` (implicit) |
| Yeni DefneRandevu tabloları | `defnerandevu` (implicit) |
