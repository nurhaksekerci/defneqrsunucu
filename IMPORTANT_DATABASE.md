# ⚠️ ÇOK ÖNEMLİ: VERİTABANI KORUMA TALİMATLARI

## 🚨 ASLA YAPMAYIN!

### ❌ Production'da Volume Silme
```bash
# ⛔ ASLA KULLANMAYIN - TÜM VERİLER SİLİNİR!
docker compose down -v

# ⛔ ASLA KULLANMAYIN - Volume'ları siler!
docker volume rm dijitalmenu_postgres_data
docker volume prune
```

## ✅ Güvenli Komutlar

### Servisleri Durdurma (Veriler Korunur)
```bash
# ✅ Güvenli: Sadece container'ları durdurur, veriler kalır
docker compose down

# ✅ Güvenli: Container'ları yeniden başlatır, veriler korunur
docker compose restart

# ✅ Güvenli: Sadece belirli servisi yeniden başlatır
docker compose restart backend
docker compose restart frontend
```

### Servisleri Başlatma
```bash
# ✅ Güvenli: Tüm servisleri başlatır
docker compose up -d

# ✅ Güvenli: Logları takip eder
docker compose logs -f
```

### Kod Güncellemesi Sonrası
```bash
# 1. Backend kodu değişti
docker compose build backend
docker compose up -d backend

# 2. Frontend kodu değişti
docker compose build frontend
docker compose up -d frontend

# 3. Her ikisi de değişti
docker compose build
docker compose up -d
```

## 📊 Veritabanı Yedekleme

### Manuel Yedekleme (Önerilen: Günlük)
```bash
# PostgreSQL backup al
docker exec defneqr-postgres pg_dump -U defneqr defneqr > backup_$(date +%Y%m%d_%H%M%S).sql

# Veya docker compose ile
docker compose exec postgres pg_dump -U defneqr defneqr > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Yedekten Geri Yükleme
```bash
# 1. Veritabanını temizle (SADECE geri yükleme için!)
docker compose exec postgres psql -U defneqr -c "DROP DATABASE IF EXISTS defneqr;"
docker compose exec postgres psql -U defneqr -c "CREATE DATABASE defneqr;"

# 2. Backup'ı geri yükle
cat backup_20260219_120000.sql | docker compose exec -T postgres psql -U defneqr defneqr
```

### Otomatik Yedekleme (Production için ÖNERİLİR)

#### Linux/Mac: Cron Job
```bash
# Crontab'a ekle (her gece saat 02:00'de)
0 2 * * * cd /path/to/DijitalMenu && docker compose exec postgres pg_dump -U defneqr defneqr > backups/backup_$(date +\%Y\%m\%d).sql && find backups/ -name "*.sql" -mtime +30 -delete
```

#### Windows: Task Scheduler
```powershell
# backup.ps1 oluştur
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "C:\DEV\DijitalMenu\backups\backup_$date.sql"
docker compose exec postgres pg_dump -U defneqr defneqr > $backupFile

# 30 günden eski yedekleri sil
Get-ChildItem "C:\DEV\DijitalMenu\backups\*.sql" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item
```

## 🔄 Development vs Production

### Development (Lokal)
```bash
# Geliştirme sırasında temiz baştan başlamak istiyorsanız
docker compose down -v  # ⚠️ Sadece development'ta!
docker compose up -d

# Admin hesabı otomatik oluşturulur:
# Email: admin@defneqr.com
# Şifre: Admin123!
```

### Production (Sunucu)
```bash
# ✅ ASLA -v flag'i kullanmayın!
docker compose down
docker compose up -d

# Kod güncellemesi
git pull origin main
docker compose build
docker compose up -d

# Logları kontrol et
docker compose logs -f backend
```

## 📋 İlk Kurulum Checklist

### 1. İlk Defa Başlatırken
```bash
# .env dosyasını oluştur
cp .env.example .env
# .env'i düzenle (gerçek şifreler, URL'ler vs.)

# Servisleri başlat
docker compose up -d

# Logları kontrol et
docker compose logs -f

# Admin hesabının oluşturulduğunu doğrula
docker compose logs backend | grep "Admin user created"
```

### 2. Admin Giriş Bilgileri
```
Email: admin@defneqr.com
Şifre: Admin123!

⚠️ İlk girişte mutlaka şifreyi değiştirin!
```

## 🔐 Güvenlik Kontrolleri

### Production'da Mutlaka Yapılmalı
1. ✅ `.env` dosyasındaki tüm şifreleri değiştir
2. ✅ JWT_SECRET ve JWT_REFRESH_SECRET'ı güçlü, rastgele değerler yap
3. ✅ DB_PASSWORD'ü güçlü bir şifre yap
4. ✅ Admin şifresini değiştir
5. ✅ Günlük otomatik yedekleme kur
6. ✅ SSL sertifikalarını kur
7. ✅ nginx.conf'ta HTTPS bloklarını aktifleştir

## 📞 Acil Durum

### Veritabanı Erişim Sorunları
```bash
# PostgreSQL konteynerine bağlan
docker compose exec postgres psql -U defneqr defneqr

# Tabloları listele
\dt

# Admin kullanıcıyı kontrol et
SELECT id, email, name, role FROM "User" WHERE role = 'SUPER_ADMIN';

# Çık
\q
```

### Container Sorunları
```bash
# Tüm container'ları kontrol et
docker compose ps

# Belirli bir servisin loglarına bak
docker compose logs backend --tail=100

# Container'ı yeniden başlat
docker compose restart backend
```

## 💾 Volume Bilgisi

### Volume'ları Listeleme
```bash
# Tüm volume'ları göster
docker volume ls

# Defne Qr volume'ları
docker volume ls | grep dijitalmenu
```

### Volume Boyutunu Kontrol Etme
```bash
# Volume bilgisi
docker volume inspect dijitalmenu_postgres_data

# Disk kullanımı
docker system df -v
```

## 🎯 En İyi Pratikler

1. **Her Zaman Yedek Al**: Production'a deploy etmeden önce
2. **Test Et**: Staging ortamında test et
3. **Volume'ları Koru**: ASLA `-v` flag'i kullanma (production'da)
4. **Monitoring Kur**: Veritabanı boyutunu ve performansını izle
5. **Yedekleme Stratejisi**: 
   - Günlük otomatik yedek
   - Haftalık tam yedek
   - Aylık arşiv yedek
   - Off-site yedekleme (başka sunucu/bulut)

## 🚀 Güncellemeler

### Backend Güncellemesi
```bash
git pull
docker compose build backend
docker compose up -d backend
docker compose logs -f backend
```

### Database Migration
```bash
# Migration'lar otomatik çalışır (Dockerfile'da tanımlı)
# Yine de yedek almayı unutma!

# Manuel migration gerekirse
docker compose exec backend npx prisma migrate deploy
```

---

**⚠️ HATIRLATMA**: Production'da `-v` flag'i kullanırsanız tüm müşteri verileri kaybolur! Mutlaka yedek alın ve güvenli komutları kullanın.
