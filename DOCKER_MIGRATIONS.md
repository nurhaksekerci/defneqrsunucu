# 🐳 Docker ile Prisma Migration İşlemleri

Bu doküman, Defne Qr projesinde Docker ortamında veritabanı migration işlemlerini açıklar.

---

## 📋 Ön Koşullar

- Docker ve Docker Compose kurulu olmalı
- `.env` dosyası yapılandırılmış olmalı
- Servisler çalışıyor olmalı: `docker compose up -d`

---

## ✅ Migration Deploy (Production)

Bekleyen migration'ları veritabanına uygular. Backend container başlarken otomatik çalışır; manuel çalıştırmak için:

```bash
# Migration'ları uygula
docker compose exec backend npx prisma migrate deploy
```

**Alternatif (container adı ile):**
```bash
docker exec defneqr-backend npx prisma migrate deploy
```

---

## 📊 Migration Durumu Kontrol

Hangi migration'ların uygulandığını ve bekleyen migration'ları gösterir:

```bash
docker compose exec backend npx prisma migrate status
```

---

## 🔄 Migration Sonrası Seed (İlk Kurulum)

Admin kullanıcı ve planlar gibi başlangıç verilerini oluşturur:

```bash
docker compose exec backend npx prisma db seed
```

**Not:** Backend Dockerfile'da `prisma migrate deploy` sonrası seed otomatik çalışır. Sadece manuel seed gerektiğinde kullanın.

---

## ⚠️ Migration Öncesi Yedekleme (ÖNERİLİR)

Production'da migration öncesi mutlaka yedek alın:

```bash
# Yedek al
docker compose exec postgres pg_dump -U ${DB_USER:-defneqr} ${DB_NAME:-defneqr} > backup_pre_migrate_$(date +%Y%m%d_%H%M%S).sql

# Veya .env'deki değişkenlerle
docker compose exec postgres pg_dump -U defneqr defneqr > backup_pre_migrate_$(date +%Y%m%d_%H%M%S).sql
```

**Windows PowerShell:**
```powershell
$date = Get-Date -Format "yyyyMMdd_HHmmss"
docker compose exec postgres pg_dump -U defneqr defneqr > "backup_pre_migrate_$date.sql"
```

---

## 🔙 Migration Rollback (Hata Durumunda)

Bir migration'ı "rolled back" olarak işaretler (Prisma migration geçmişinden çıkarır):

```bash
# MIGRATION_NAME: migration klasör adı (örn: 20260228_add_referral_rejection_reason)
docker compose exec backend npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

**Örnek:**
```bash
docker compose exec backend npx prisma migrate resolve --rolled-back 20260228_add_referral_rejection_reason
```

**Manuel SQL ile geri alma:**
```bash
# 1. Yedekten geri yükle (en güvenli)
cat backup_pre_migrate_20260228_120000.sql | docker compose exec -T postgres psql -U defneqr defneqr

# 2. Veya sadece ilgili migration'ın rollback SQL'ini çalıştır
# (prisma/migrations/rollback/ altında varsa)
```

---

## 🆕 Yeni Migration Oluşturma (Development)

**Önemli:** Yeni migration sadece development ortamında, schema değişikliği yaptıktan sonra oluşturulur. Docker'da çalışan backend container'ı `prisma` CLI ile migration oluşturamaz; bunun için lokal ortam kullanılır.

### Lokal Geliştirme (Docker dışında)

```bash
cd backend

# Schema değişikliği yaptıktan sonra
npx prisma migrate dev --name migration_adi

# Örnek
npx prisma migrate dev --name add_referral_rejection_reason
```

### Docker ile Development Database

Eğer sadece PostgreSQL Docker'da çalışıyorsa:

```bash
cd backend

# DATABASE_URL Docker postgres'e işaret etmeli (localhost:5432)
npx prisma migrate dev --name migration_adi
```

---

## 📁 Migration Dosya Yapısı

```
backend/prisma/
├── schema.prisma
└── migrations/
    ├── 20260215174415_init/
    │   └── migration.sql
    ├── 20260228_add_referral_rejection_reason/
    │   └── migration.sql
    └── ...
```

---

## 🚀 Tam Güncelleme Akışı (Kod + Migration)

```bash
# 1. Yedek al
docker compose exec postgres pg_dump -U defneqr defneqr > backup_$(date +%Y%m%d).sql

# 2. Kodu çek
git pull origin main

# 3. Backend'i yeniden build et (yeni migration'lar image'a dahil olur)
docker compose build backend

# 4. Backend'i yeniden başlat (migrate deploy otomatik çalışır)
docker compose up -d backend

# 5. Logları kontrol et
docker compose logs -f backend
```

---

## 🐛 Sorun Giderme

### "Migration failed" hatası

```bash
# Migration durumunu kontrol et
docker compose exec backend npx prisma migrate status

# Veritabanına doğrudan bağlan
docker compose exec postgres psql -U defneqr defneqr -c "\dt"

# _prisma_migrations tablosunu kontrol et
docker compose exec postgres psql -U defneqr defneqr -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### Backend container çalışmıyor

```bash
# Container'ı başlat
docker compose up -d backend

# Logları incele
docker compose logs backend

# Sadece migration çalıştır (geçici bir container ile)
docker compose run --rm backend npx prisma migrate deploy
```

### Prisma Client güncel değil

```bash
# Backend'i yeniden build et
docker compose build --no-cache backend
docker compose up -d backend
```

---

## 📜 Kolay Kullanım Scriptleri

Proje kök dizininde:

**Linux/Mac:**
```bash
chmod +x scripts/docker-migrate.sh
./scripts/docker-migrate.sh deploy    # Migration uygula
./scripts/docker-migrate.sh status    # Durum kontrol
./scripts/docker-migrate.sh seed      # Seed çalıştır
./scripts/docker-migrate.sh backup    # Yedek al
```

**Windows PowerShell:**
```powershell
.\scripts\docker-migrate.ps1 deploy
.\scripts\docker-migrate.ps1 status
.\scripts\docker-migrate.ps1 seed
.\scripts\docker-migrate.ps1 backup
```

---

## 📌 Özet Komutlar

| İşlem | Komut |
|-------|-------|
| Migration uygula | `docker compose exec backend npx prisma migrate deploy` |
| Durum kontrol | `docker compose exec backend npx prisma migrate status` |
| Seed çalıştır | `docker compose exec backend npx prisma db seed` |
| Yedek al | `docker compose exec postgres pg_dump -U defneqr defneqr > backup.sql` |
| Rollback işaretle | `docker compose exec backend npx prisma migrate resolve --rolled-back MIGRATION_NAME` |
