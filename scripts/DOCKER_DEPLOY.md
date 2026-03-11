# Docker Deployment — DefneQr + DefneRandevu

## Sunucuda Gerekli Docker Komutları

### 1. Projeyi Sunucuya Al

```bash
cd /opt/defneqr   # veya proje dizininiz
git pull origin main
```

**Önemli:** Migration dosyaları (`backend/prisma/migrations/**/migration.sql`) GitHub'a commit edilmeli. Yeni migration ekledikten sonra:

```bash
git add backend/prisma/migrations/
git commit -m "Add migrations"
git push
```

### 2. Ortam Değişkenleri (.env)

`.env` dosyasında şunlar tanımlı olmalı:

```env
DB_PASSWORD=...
DB_USER=defneqr
DB_NAME=defneqr
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. (Önerilen) Migration Öncesi Yedek

```bash
./scripts/docker-migrate.sh backup
```

### 4. Build ve Başlatma

```bash
# Tüm servisleri build edip başlat
docker compose up -d --build
```

Backend başlarken otomatik olarak `prisma migrate deploy` çalıştırır — veritabanı değişiklikleri uygulanır.

### 5. Migration'ı Manuel Çalıştırma

**Migration'lar GitHub'a commit edilmeli.** `.gitignore` içinde `*.sql` vardı; Prisma migration dosyaları için istisna eklendi: `!backend/prisma/migrations/**/migration.sql`

**Backend çalışıyorsa:**

```bash
./scripts/docker-migrate.sh deploy
# veya
./scripts/run-migrations.sh
```

**Backend çalışmıyorsa** (one-off container):

```bash
./scripts/docker-migrate.sh deploy-standalone
# veya
./scripts/run-migrations.sh standalone
```

**Lokal (Docker olmadan, DATABASE_URL ile):**

```bash
./scripts/run-migrations.sh local
```

**Başarısız migration'ı düzeltme** (sütun zaten varsa, P3018/P3009):

```bash
./scripts/docker-migrate.sh resolve 20260228_add_referral_discount
# veya doğrudan:
docker compose exec backend npx prisma migrate resolve --applied 20260228_add_referral_discount
```

Sonra backend yeniden başlatılır veya `deploy` tekrar çalıştırılır.

**DefneRandevu şema değişiklikleri** (Prisma migrate başarısız olursa):

```bash
./scripts/docker-migrate.sh defnerandevu
# veya
docker compose exec backend node scripts/add-defnerandevu-schema.js
```

### 6. Migration Durumu

```bash
./scripts/docker-migrate.sh status
```

### 7. Logları İzleme

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend-randevu
```

### 8. Servisleri Durdurma / Yeniden Başlatma

```bash
docker compose down
docker compose up -d
```

---

## Özet: Hızlı Deploy

```bash
cd /opt/defneqr
git pull origin main
./scripts/docker-migrate.sh backup    # İsteğe bağlı
docker compose up -d --build
```

---

## DefneRandevu Migration (20260311)

Bu migration şunları ekler:

- `Project` enum, `support_tickets.project`
- `UserRole`: BUSINESS_OWNER, APPOINTMENT_STAFF
- DefneRandevu tabloları: appointment_businesses, appointment_staff, vb.

`docker compose up -d --build` ile backend yeniden başladığında otomatik uygulanır.
