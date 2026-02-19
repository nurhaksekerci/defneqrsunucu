# 💻 Lokal Development Kurulumu

## ⚙️ Önkoşullar

- Node.js 20+
- PostgreSQL 15+
- npm veya yarn

## 🚀 Hızlı Başlangıç

### 1. Repository'yi Clone'layın
```bash
git clone https://github.com/KULLANICI_ADINIZ/defneqr.git
cd defneqr
```

### 2. Tek `.env` Dosyası Oluşturun (Root'ta)
```bash
# .env.example'dan kopyala
cp .env.example .env

# .env dosyasını düzenle
code .env  # veya notepad .env
```

### 3. `.env` Dosyasında Lokal Development İçin Değişiklikler:

```env
# Database Configuration (LOKAL POSTGRESQL)
DB_NAME=defneqr
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/defneqr?schema=public"
#                                         ^^^^^^^ Docker için "postgres", Lokal için "localhost"

# Server Configuration
PORT=5000
NODE_ENV=development  # <-- development olarak değiştir

# URLs (LOKAL)
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google OAuth Callback (LOKAL)
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Diğer ayarlar aynı kalabilir...
```

### 4. Backend Kurulumu

```bash
cd backend

# Dependencies yükle
npm install

# Prisma client oluştur
npx prisma generate

# Veritabanı oluştur (PostgreSQL çalışıyor olmalı)
npx prisma migrate dev

# Seed çalıştır (Admin + Plans oluşturur)
npm run prisma:seed

# Backend'i başlat
npm run dev
```

Backend çalışacak: `http://localhost:5000`

### 5. Frontend Kurulumu

```bash
# Yeni terminal aç
cd frontend

# Dependencies yükle
npm install

# Frontend'i başlat
npm run dev
```

Frontend çalışacak: `http://localhost:3000`

## 📁 .env Dosyası Yapısı

### ✅ DOĞRU (Tek .env - Root'ta)
```
DijitalMenu/
├── .env                    ← TEK .env DOSYASI (GİT'E EKLENMEMELİ!)
├── .env.example            ← Template
├── docker-compose.yml
├── backend/
│   ├── src/server.js       ← Root .env'i okur
│   └── package.json
└── frontend/
    └── package.json
```

### ❌ YANLIŞ (Eskiden böyleydi)
```
DijitalMenu/
├── .env                    ← Docker için
├── backend/
│   └── .env                ← Backend için (KARIŞIKLIK!)
└── frontend/
    └── .env.local          ← Frontend için (KARIŞIKLIK!)
```

## 🔍 Nasıl Çalışır?

### Backend'de:
```javascript
// backend/src/server.js
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
// Root .env dosyasını okur
```

### Frontend'de:
```javascript
// Next.js otomatik olarak root .env dosyasını okur
// NEXT_PUBLIC_* değişkenler browser'da kullanılabilir
```

### Docker'da:
```yaml
# docker-compose.yml
services:
  backend:
    env_file: .env  # Root .env dosyasını kullanır
  frontend:
    env_file: .env  # Root .env dosyasını kullanır
```

## 🎯 Avantajlar:

1. ✅ **Tek Kaynak**: Tüm environment değişkenleri tek yerde
2. ✅ **Tutarlılık**: Docker ve lokal aynı ayarları kullanır
3. ✅ **Basitlik**: Karmaşıklık yok, tek dosya
4. ✅ **Güvenlik**: Tek dosya ignore edilir
5. ✅ **Kolaylık**: Bir yerde değiştir, her yerde geçerli olur

## 🔄 Docker vs Lokal Farkları

### Docker İçin:
```env
DATABASE_URL="postgresql://defneqr:password@postgres:5432/defneqr?schema=public"
#                                           ^^^^^^^^ Container adı
FRONTEND_URL=http://frontend:3000
```

### Lokal Development İçin:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/defneqr?schema=public"
#                                             ^^^^^^^^^ Lokal PostgreSQL
FRONTEND_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# PostgreSQL çalışıyor mu kontrol et
# Windows:
Get-Service postgresql*

# Mac/Linux:
ps aux | grep postgres

# Docker kullanıyorsanız:
docker compose ps postgres
```

### "Module not found"
```bash
# Dependencies eksik
cd backend && npm install
cd frontend && npm install
```

### "Port already in use"
```bash
# Port'u kullanan process'i bul ve öldür
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

## 📊 Development vs Docker

| Özellik | Lokal Development | Docker |
|---------|-------------------|--------|
| Setup | PostgreSQL + Node kurulu olmalı | Sadece Docker yeterli |
| Hız | Daha hızlı (native) |約raz yavaş (containerized) |
| İzolasyon | Sistem ile karışabilir | Tamamen izole |
| Production Uyumluluk | Farklı olabilir | %100 aynı |
| Hot Reload | ✅ Çok hızlı | ⚠️約raz yavaş |
| Önerilen | Development sırasında | Testing & Production |

## 🎓 Önerilen Workflow

### Günlük Development:
1. Lokal PostgreSQL kullan
2. `npm run dev` ile backend'i çalıştır
3. `npm run dev` ile frontend'i çalıştır
4. Kod değiştir, hot-reload ile test et

### Push Öncesi Test:
1. Docker ile test et
2. `docker compose up --build`
3. Production gibi çalıştığını doğrula
4. Commit + Push yap

### Production Deploy:
1. Git'e push et
2. Sunucuda `git pull`
3. `.env` dosyasını güncelle (production URL'leri)
4. `docker compose up -d --build`

## 🔐 Güvenlik Notları

- `.env` dosyası **ASLA** git'e eklenmemeli
- Lokal development için bile gerçek production şifreleri kullanmayın
- Lokal development için basit şifreler yeterli:
  - DB: `postgres/postgres`
  - JWT: Kısa random string'ler
  - Google OAuth: Test credential'lar

---

**💡 İpucu:** Docker kullanıyorsanız lokal PostgreSQL kurmanıza gerek yok! Sadece `docker compose up -d` yeterli.
