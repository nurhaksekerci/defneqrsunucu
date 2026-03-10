# Defne Qr - QR Menü ve Dijital Menü Sistemi

<div align="center">

![Defne Qr Logo](./frontend/public/logo/DefneQr.png)

**1000+ Hazır Katalog ile 5 Dakikada QR Menü Oluşturun!**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/next.js-15.5-black)](https://nextjs.org/)

[Website](https://defneqr.com) • [Dökümanlar](#-dökümanlar) • [Kurulum](#-kurulum)

</div>

---

## 🚀 Özellikler

### ⭐ Ana Özellikler

- **🎯 1000+ Hazır Katalog** - Pizza, kahve, bar menüleri tek tıkla kopyala
- **⚡ 5 Dakikada Kurulum** - Sıfırdan başlamayın, hızlıca yayınlayın
- **🎨 Sınırsız Özelleştirme** - Renk, font, layout tamamen özel
- **📊 Detaylı QR Tarama Analizi** - Saatlik, günlük, aylık raporlar
- **🌍 Çoklu Restoran Yönetimi** - Tek panel'den tüm işletmeler
- **👁️ Anlık Önizleme** - Değişiklikleri gerçek zamanlı görün
- **📱 Mobil Uyumlu** - Tüm cihazlarda mükemmel görüntüleme
- **🔒 Güvenli** - JWT, OAuth, XSS protection, rate limiting

---

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **DnD Kit** - Drag & drop

### Backend
- **Node.js 20** - Runtime
- **Express.js** - Web framework
- **Prisma ORM** - Database ORM
- **PostgreSQL 15** - Database

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy
- **PM2** - Process manager (alternative)
- **Let's Encrypt** - Free SSL

### Monitoring
- **Prometheus** - Metrics
- **Winston** - Logging
- **Sentry** - Error tracking (optional)

---

## 📋 Gereksinimler

### Development (Local):
- Node.js 20+
- PostgreSQL 15+
- npm veya yarn

### Production (Docker):
- Docker 20+
- Docker Compose 2+
- VPS (4GB+ RAM)

### Production (Manuel):
- Node.js 20+
- PostgreSQL 15+
- Nginx
- PM2

---

## 🚀 Kurulum

### 🐳 Docker ile Kurulum (ÖNERİLEN)

#### 1. Proje Dosyalarını İndir

```bash
git clone https://github.com/YOUR_USERNAME/defneqr.git
cd defneqr
```

#### 2. Environment Dosyalarını Ayarla

```bash
# .env dosyası oluştur
cp .env.example .env

# Şu değerleri düzenle:
# - DB_PASSWORD (güçlü şifre)
# - JWT_SECRET (64+ karakter random string)
# - JWT_REFRESH_SECRET (64+ karakter random string)
# - GOOGLE_CLIENT_ID (Google OAuth)
# - GOOGLE_CLIENT_SECRET (Google OAuth)
# - NEXT_PUBLIC_GA_ID (Google Analytics)
```

#### 3. Docker Compose ile Başlat

```bash
# Build ve başlat (ilk sefer 10-15 dakika sürer)
docker compose up -d

# Log'ları izle
docker compose logs -f

# Container durumunu kontrol et
docker ps
```

#### 4. Database Migration

```bash
# Migration'ları çalıştır
docker exec -it defneqr-backend npx prisma migrate deploy

# İlk admin kullanıcı oluştur (opsiyonel)
docker exec -it defneqr-backend npx prisma db seed
```

**Avatar sütunu (profil fotoğrafı):** Migration uygulanmazsa veya "No pending migrations" alırsanız:
```bash
docker compose exec backend node scripts/add-user-avatar-column.js
# veya proje kökünden:
./scripts/docker-add-avatar.sh
```

#### 5. Erişim

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

---

### 💻 Local Development (Docker Olmadan)

#### 1. Environment Dosyasını Ayarla (Root'ta - TEK .env)

```bash
# Root dizinde .env oluştur
cp .env.example .env

# .env dosyasını düzenle ve şunları değiştir:
# - DATABASE_URL: "postgres" yerine "localhost" yaz
# - NODE_ENV: "development" yap
# - FRONTEND_URL: http://localhost:3000
# - NEXT_PUBLIC_API_URL: http://localhost:5000/api
# - GOOGLE_CALLBACK_URL: http://localhost:5000/api/auth/google/callback
```

**Örnek lokal `.env`:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/defneqr?schema=public"
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 2. PostgreSQL Kurulumu

```bash
# PostgreSQL başlat
# Windows: services.msc → PostgreSQL → Start
# Linux: sudo systemctl start postgresql
# Mac: brew services start postgresql

# Database oluştur
createdb defneqr
```

#### 3. Backend Setup

```bash
cd backend

# Dependencies
npm install

# Prisma client oluştur
npx prisma generate

# Prisma migration çalıştır
npx prisma migrate dev

# Admin + Plans oluştur
npm run prisma:seed

# Backend'i başlat
npm run dev
```

#### 4. Frontend Setup

```bash
# Yeni terminal aç
cd frontend

# Dependencies
npm install

# Frontend'i başlat
npm run dev
```

#### 5. Erişim

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Admin Panel:** http://localhost:3000/admin
  - Email: `admin@defneqr.com`
  - Şifre: `Admin123!`

---

## 📦 Production Deployment

### Contabo VPS (Önerilen)

**Detaylı rehber:** [CONTABO_QUICK_START.md](./CONTABO_QUICK_START.md)

```bash
# 1. SSH ile sunucuya bağlan
ssh root@YOUR_SERVER_IP

# 2. Docker kur
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y

# 3. Proje dosyalarını yükle
git clone https://github.com/YOUR_USERNAME/defneqr.git /opt/defneqr
cd /opt/defneqr

# 4. Environment ayarla
nano .env

# 5. SSL sertifikası al
certbot certonly --standalone -d defneqr.com -d api.defneqr.com
cp /etc/letsencrypt/live/defneqr.com/*.pem nginx/ssl/

# 6. Başlat
docker compose up -d
```

**Diğer deployment seçenekleri:**
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Tüm seçenekler
- [SERVER_COMPARISON.md](./SERVER_COMPARISON.md) - Sunucu karşılaştırması

---

## 🐳 Docker Komutları

```bash
# Başlat
docker compose up -d

# Durdur
docker compose down

# Restart
docker compose restart backend

# Log'ları görüntüle
docker compose logs -f
docker compose logs -f backend
docker compose logs -f postgres

# Container durumu
docker ps

# Container'a gir
docker exec -it defneqr-backend sh

# Database backup
docker exec defneqr-postgres pg_dump -U defneqr defneqr > backup.sql

# Update (yeni kod)
git pull
docker compose build
docker compose up -d

# Temizlik
docker compose down -v  # Volume'leri de sil (DİKKAT!)
```

---

## 📊 Monitoring

### Health Checks

```bash
# Quick health check
curl http://localhost:5000/health

# Detailed health check
curl http://localhost:5000/health/detailed

# Prometheus metrics
curl http://localhost:5000/metrics
```

### System Status

- **Admin Dashboard:** http://localhost:3000/admin
- **Grafana:** (opsiyonel) http://localhost:3001

---

## 🧪 Testing

```bash
# Backend tests (henüz yok)
cd backend
npm test

# Frontend tests (henüz yok)
cd frontend
npm test

# Build test
npm run build
```

---

## 📚 Dökümanlar

### 🎯 Kurulum & Deployment
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Kapsamlı deployment rehberi
- [CONTABO_QUICK_START.md](./CONTABO_QUICK_START.md) - Contabo adım adım kurulum
- [CONTABO_ANALYSIS.md](./CONTABO_ANALYSIS.md) - Sunucu analizi
- [SERVER_COMPARISON.md](./SERVER_COMPARISON.md) - Sunucu karşılaştırması

### 🔒 Güvenlik & Performans
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Production kontrol listesi
- [INPUT_VALIDATION_IMPLEMENTATION.md](./INPUT_VALIDATION_IMPLEMENTATION.md) - Güvenlik
- [DATABASE_OPTIMIZATION_IMPLEMENTATION.md](./DATABASE_OPTIMIZATION_IMPLEMENTATION.md) - DB optimization
- [DATABASE_MIGRATION_STRATEGY.md](./DATABASE_MIGRATION_STRATEGY.md) - Migration stratejisi
- [IMAGE_OPTIMIZATION_IMPLEMENTATION.md](./IMAGE_OPTIMIZATION_IMPLEMENTATION.md) - Görsel optimization
- [ERROR_HANDLING_LOGGING_IMPLEMENTATION.md](./ERROR_HANDLING_LOGGING_IMPLEMENTATION.md) - Error handling
- [MONITORING_OBSERVABILITY_IMPLEMENTATION.md](./MONITORING_OBSERVABILITY_IMPLEMENTATION.md) - Monitoring

### 🎨 Frontend & SEO
- [FRONTEND_OPTIMIZATION.md](./FRONTEND_OPTIMIZATION.md) - Bundle size optimization
- [SEO_STRATEGY.md](./SEO_STRATEGY.md) - SEO stratejisi
- [SEO_IMPLEMENTATION.md](./SEO_IMPLEMENTATION.md) - SEO implementasyonu
- [GOOGLE_ANALYTICS_SETUP.md](./GOOGLE_ANALYTICS_SETUP.md) - Analytics kurulumu

### 📈 Marketing
- [USP_MARKETING_GUIDE.md](./USP_MARKETING_GUIDE.md) - Marketing stratejisi
- [ACTUAL_FEATURES.md](./ACTUAL_FEATURES.md) - Mevcut özellikler listesi

---

## 🔧 Troubleshooting

### Backend başlamıyor?
```bash
docker compose logs backend
# Database connection kontrol et
```

### Frontend build hatası?
```bash
docker compose logs frontend
# Node.js version kontrol et
```

### Database connection error?
```bash
docker exec -it defneqr-postgres psql -U defneqr
# Şifre ve database name kontrol et
```

### Port already in use?
```bash
# Port'u kullanan process'i bul
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz!

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📝 License

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 📧 İletişim

- **Website:** https://defneqr.com
- **Email:** destek@defneqr.com
- **Twitter:** [@defneqr](https://twitter.com/defneqr)
- **Instagram:** [@defneqr](https://instagram.com/defneqr)

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)

---

<div align="center">

**Made with ❤️ for Turkish Restaurants**

⭐ Star this repo if you find it useful!

</div>
