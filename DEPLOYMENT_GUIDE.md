# Defne Qr - Deployment Guide

## 📋 Genel Bakış

Defne Qr, **Node.js (Backend)** ve **Next.js (Frontend)** ile geliştirilmiş bir full-stack web uygulamasıdır. PostgreSQL veritabanı kullanır.

---

## 🖥️ Minimum Sunucu Gereksinimleri

### Küçük/Orta Ölçekli Deployment (100-1000 kullanıcı)

**VPS/Cloud Server:**
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Disk:** 40 GB SSD
- **Bandwidth:** 2 TB/ay
- **OS:** Ubuntu 22.04 LTS (önerilen)

### Orta/Büyük Ölçekli Deployment (1000+ kullanıcı)

**VPS/Cloud Server:**
- **CPU:** 4-8 vCPU
- **RAM:** 8-16 GB
- **Disk:** 100 GB SSD
- **Bandwidth:** 5 TB/ay
- **OS:** Ubuntu 22.04 LTS

---

## 🌐 Önerilen Hosting Platformları

### 1. **VPS (Virtual Private Server) - Tavsiye Edilen**

#### A. DigitalOcean (En Popüler) ⭐ TAVSİYE EDİLEN

**Droplet Seçenekleri:**

**🏆 Premium AMD 4GB - $24/ay (~₺800)**
- **CPU:** 2 vCPU (AMD Premium)
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Transfer:** 4 TB
- **Datacenter:** Frankfurt (Almanya) - Türkiye'ye yakın
- ✅ **Defne Qr için MÜKEMMEL**

**Premium AMD 8GB - $48/ay (~₺1,600)**
- **CPU:** 4 vCPU (AMD Premium)
- **RAM:** 8 GB
- **Disk:** 160 GB SSD
- **Transfer:** 5 TB
- ✅ **Büyük ölçek için**

**Kurulum:**
```bash
# 1. DigitalOcean'da hesap oluştur: https://www.digitalocean.com
# 2. Droplet oluştur:
#    - Image: Ubuntu 22.04 LTS
#    - Plan: Premium AMD 4GB ($24)
#    - Region: Frankfurt (FRA1)
#    - Authentication: SSH Keys (önerilen)

# 3. SSH ile bağlan
ssh root@your-droplet-ip

# 4. Initial setup
apt update && apt upgrade -y
apt install -y postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# 5. Node.js 20.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 6. PM2 kurulumu (process manager)
npm install -g pm2
```

**장점:**
- ✅ En kolay kullanım (beginner-friendly)
- ✅ Mükemmel dokümantasyon ve tutorial'lar
- ✅ Frankfurt datacenter (Türkiye'ye 50-80ms ping)
- ✅ 1-Click Apps (otomatik kurulum seçenekleri)
- ✅ Snapshot ve backup desteği (ücretsiz)
- ✅ Droplet Console (browser üzerinden erişim)
- ✅ Managed PostgreSQL seçeneği (+$15/ay)
- ✅ Load Balancer desteği
- ✅ Türkçe ödeme kartı kabul eder

**단점:**
- ⚠️ Hetzner'den biraz daha pahalı
- ⚠️ Traffic limit (4TB, ama Defne Qr için yeterli)

**İlk Üyelik Bonusu:**
- 🎁 $200 kredi (ilk 60 gün) - Referral link ile

**Website:** https://www.digitalocean.com

**Önerilen DigitalOcean Datacenter:**
- **Frankfurt (FRA1)** - Türkiye'den en yakın
- **Amsterdam (AMS3)** - Alternatif
- **London (LON1)** - Brexit sonrası iyi

---

#### B. Hetzner (En Uygun Fiyat)

**Cloud Server (€4.90/ay):**
- 4 GB RAM, 2 vCPU
- 40 GB SSD
- 20 TB Transfer
- ✅ En iyi fiyat/performans oranı

**장점:**
- ✅ Çok uygun fiyat
- ✅ Almanya datacenter (düşük gecikme)
- ✅ Yüksek performans
- ✅ Unlimited traffic (pratik olarak)

**Website:** https://www.hetzner.com

---

#### C. Linode (Akamai) - Kurumsal Güvenilirlik

**🏆 Dedicated 4GB - $36/ay (~₺1,200)**
- **CPU:** 2 vCPU (Dedicated)
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Transfer:** 4 TB
- **Datacenter:** Frankfurt (Almanya)

**Shared 4GB - $24/ay (~₺800)**
- **CPU:** 2 vCPU (Shared)
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Transfer:** 4 TB

**Kurulum:**
```bash
# 1. Linode hesabı: https://www.linode.com
# 2. Create Linode:
#    - Distribution: Ubuntu 22.04 LTS
#    - Region: Frankfurt (eu-central)
#    - Linode Plan: Dedicated 4GB ($36)

# 3. SSH bağlantısı
ssh root@your-linode-ip
```

**장점:**
- ✅ Akamai altyapısı (çok güvenilir)
- ✅ %99.9 uptime garantisi
- ✅ 24/7 teknik destek
- ✅ Managed Database seçeneği
- ✅ Object Storage entegrasyonu
- ✅ Backup otomasyonu

**단점:**
- ⚠️ Biraz daha pahalı
- ⚠️ Türkiye datacenter yok

**Website:** https://www.linode.com

---

#### D. Vultr (Türkiye Datacenter) 🇹🇷

**🏆 High Performance 4GB - $18/ay (~₺600)**
- **CPU:** 2 vCPU (AMD)
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Transfer:** 3 TB
- **Datacenter:** İSTANBUL (TUR) ⭐
- ✅ **Türkiye'de sunucu!**

**High Performance 8GB - $36/ay (~₺1,200)**
- **CPU:** 4 vCPU (AMD)
- **RAM:** 8 GB
- **Disk:** 160 GB SSD
- **Transfer:** 4 TB
- **Datacenter:** İSTANBUL (TUR)

**Kurulum:**
```bash
# 1. Vultr hesabı: https://www.vultr.com
# 2. Deploy New Instance:
#    - Choose Server: Cloud Compute - High Performance
#    - Location: Istanbul (TUR)
#    - Server Size: 4GB RAM ($18/mo)
#    - OS: Ubuntu 22.04 LTS

# 3. SSH bağlantısı
ssh root@your-server-ip

# 4. Setup (DigitalOcean ile aynı adımlar)
```

**장점:**
- ✅ **İSTANBUL DATACENTER** (en düşük gecikme!)
- ✅ 25+ global lokasyon
- ✅ Hızlı deployment (55 saniye)
- ✅ DDoS protection (ücretsiz)
- ✅ Snapshot desteği
- ✅ One-Click Apps
- ✅ Türk kartı kabul eder

**단점:**
- ⚠️ Dokümantasyon DigitalOcean kadar iyi değil

**İstanbul Datacenter장점:**
- 🚀 **1-5ms ping** (Türkiye içi)
- 🚀 Çok hızlı QR menü yükleme
- 🚀 Kullanıcı deneyimi mükemmel

**Website:** https://www.vultr.com

**Vultr İstanbul'u Seçme Nedenleri:**
1. Türkiye'deki kullanıcılar için **en hızlı**
2. Data sovereignty (veri Türkiye'de)
3. Düşük gecikme süresi

---

#### E. Contabo - En Uygun Fiyat (Almanya)

**🏆 VPS S - €5.99/ay (~₺220)**
- **CPU:** 4 vCPU
- **RAM:** 8 GB
- **Disk:** 200 GB SSD
- **Transfer:** 32 TB
- **Datacenter:** Nürnberg (Almanya)
- ✅ **En iyi fiyat/kaynak oranı**

**VPS M - €11.99/ay (~₺450)**
- **CPU:** 6 vCPU
- **RAM:** 16 GB
- **Disk:** 400 GB SSD
- **Transfer:** 32 TB

**Kurulum:**
```bash
# 1. Contabo hesabı: https://contabo.com
# 2. VPS S seç (€5.99/ay)
# 3. Setup fee: €4.99 (bir kerelik)
```

**장점:**
- ✅ En uygun fiyat (8GB RAM sadece €6)
- ✅ Yüksek traffic limiti (32TB)
- ✅ 200 GB disk (çok bol)
- ✅ DDoS protection

**단점:**
- ⚠️ Shared resources (komşu etkisi olabilir)
- ⚠️ Destek yavaş olabilir
- ⚠️ Setup fee var (€4.99)

**Website:** https://contabo.com

---

#### F. OVHcloud - Avrupa Lideri

**🏆 VPS Comfort - €13/ay (~₺480)**
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Transfer:** Unlimited
- **Datacenter:** Almanya/Fransa
- **Anti-DDoS:** Dahil

**Kurulum:**
```bash
# 1. OVH hesabı: https://www.ovhcloud.com
# 2. VPS seç
# 3. Datacenter: Frankfurt (Almanya)
```

**장점:**
- ✅ Unlimited traffic
- ✅ Anti-DDoS (Game+)
- ✅ Avrupa'nın en büyüğü
- ✅ GDPR compliant

**단점:**
- ⚠️ Arayüz karmaşık
- ⚠️ Dokümantasyon karışık

**Website:** https://www.ovhcloud.com

---

#### G. AWS Lightsail - Amazon Altyapısı

**🏆 4GB Plan - $24/ay (~₺800)**
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Transfer:** 4 TB
- **Datacenter:** Frankfurt (eu-central-1)

**장점:**
- ✅ Amazon AWS altyapısı
- ✅ Çok güvenilir
- ✅ Kolay scale
- ✅ AWS servislerine entegrasyon

**단점:**
- ⚠️ Tam AWS'den daha basit ama yine karmaşık
- ⚠️ Fiyat artışları sık

**Website:** https://aws.amazon.com/lightsail

---

#### H. Türkiye'deki Hosting Firmaları 🇹🇷

**Natro Hosting:**
- VPS planları: ₺500-2,000/ay
- Datacenter: İstanbul
- Destek: Türkçe

**Turhost:**
- Cloud VPS: ₺800-3,000/ay
- Datacenter: İstanbul
- Destek: Türkçe

**Hostinger Türkiye:**
- VPS KVM 2: $12/ay (~₺400)
- 2 vCPU, 4 GB RAM, 80 GB

**⚠️ Not:** Türk hosting firmaları genelde daha pahalı ve daha az teknik özellik sunuyor.

---

### 2. **PaaS (Platform as a Service) - Kolay Ama Pahalı**

#### A. Railway (En Kolay)

**Pricing:**
- **Free Trial:** $5 kredi
- **Developer Plan:** $5/ay (kullanım başına)
- **Team Plan:** $20/ay

**장점:**
- ✅ Çok kolay deployment (Git push)
- ✅ Otomatik HTTPS
- ✅ PostgreSQL dahil
- ✅ Sıfır konfigürasyon

**단점:**
- ❌ Pahalı (kullanım arttıkça)
- ❌ Türkiye'de datacenter yok

**Website:** https://railway.app

---

#### B. Render

**Pricing:**
- **Free Tier:** Sınırlı (30 gün sonra uyur)
- **Starter:** $7/ay (web service)
- **PostgreSQL:** $7/ay
- **Toplam:** ~$14/ay

**장점:**
- ✅ Kolay deployment
- ✅ Otomatik SSL
- ✅ GitHub entegrasyonu

**Website:** https://render.com

---

#### C. Vercel (Frontend) + Backend başka yerde

**Vercel (Sadece Frontend için):**
- **Free:** Hobby projeler
- **Pro:** $20/ay

**⚠️ Not:** Vercel Next.js için mükemmel ama backend için ayrı sunucu gerekir.

**Website:** https://vercel.com

---

### 3. **Managed Kubernetes - Enterprise**

#### A. DigitalOcean Kubernetes (DOKS)

**Pricing:** ~$36/ay (2 node cluster)

**Ne Zaman Kullanılmalı:**
- Yüksek trafik (10,000+ kullanıcı)
- Auto-scaling gerekli
- Microservices mimari
- DevOps ekibi var

---

## 📦 Deployment Mimarisi

### Seçenek 1: Tek Sunucu (Basit - Önerilen Başlangıç)

```
┌─────────────────────────────────────┐
│         Ubuntu Server               │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Frontend │  │ Backend  │       │
│  │ Next.js  │  │ Express  │       │
│  │  :3000   │  │  :5000   │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌─────────────────────────┐       │
│  │    PostgreSQL :5432     │       │
│  └─────────────────────────┘       │
│                                     │
│  ┌─────────────────────────┐       │
│  │  Nginx (Reverse Proxy)  │       │
│  │         :80, :443       │       │
│  └─────────────────────────┘       │
└─────────────────────────────────────┘
```

**Uygun:** 1000'e kadar kullanıcı

---

#### 🏆 Önerilen Sunucular (Öncelik Sırasına Göre):

### 1. Vultr İstanbul - High Performance 4GB ($18/ay) ⭐ İLK TAVSİYE 🇹🇷

**Spesifikasyonlar:**
- **CPU:** 2 vCPU (AMD)
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Traffic:** 3 TB/ay
- **Fiyat:** $18/ay (~₺600)
- **Datacenter:** İSTANBUL 🇹🇷

**Kaynak Dağılımı:**
```
CPU Dağılımı (2 vCPU):
├─ PostgreSQL:     0.75 vCPU (37%)
├─ Backend API:    0.75 vCPU (38%)
├─ Frontend:       0.25 vCPU (12%)
└─ Nginx + OS:     0.25 vCPU (13%)

RAM Dağılımı (4 GB):
├─ PostgreSQL:     1.5 GB (37%)
├─ Backend:        1.0 GB (25%)
├─ Frontend:       0.8 GB (20%)
├─ Nginx:          0.2 GB (5%)
└─ OS + Buffer:    0.5 GB (13%)

Disk Dağılımı (80 GB):
├─ OS + Software:  15 GB (19%)
├─ Database:       20 GB (25%)
├─ Uploads:        30 GB (38%)
├─ Logs + Backups: 10 GB (12%)
└─ Free Space:     5 GB (6%)
```

**Performans Tahmini:**
- ✅ **500-1,000 eşzamanlı kullanıcı**
- ✅ **5,000-10,000 günlük QR tarama**
- ✅ **50-100 restoran**
- ✅ **Response time: <100ms** (Türkiye içi!)
- ✅ **Database queries: <30ms** (ortalama)

**장점:**
- ✅ **İSTANBUL DATACENTER** (Türkiye'de!)
- ✅ 1-5ms ping (ultra hızlı)
- ✅ QR menü anında açılır
- ✅ En iyi kullanıcı deneyimi
- ✅ DDoS protection (ücretsiz)

**Website:** https://www.vultr.com

---

### 2. DigitalOcean - Premium AMD 4GB ($24/ay) 🥈

**Spesifikasyonlar:**
- **CPU:** 2 vCPU (AMD Premium)
- **RAM:** 4 GB
- **Disk:** 80 GB SSD
- **Traffic:** 4 TB/ay
- **Fiyat:** $24/ay (~₺800)
- **Datacenter:** Frankfurt 🇩🇪

**Performans:** Vultr ile aynı (ama Türkiye için ping ~50-80ms)

**장점:**
- ✅ En kolay kullanım
- ✅ $200 başlangıç kredisi
- ✅ Mükemmel dokümantasyon
- ✅ 1-Click backup

**Website:** https://www.digitalocean.com

---

### 3. Contabo - VPS S (€5.99/ay) 🥉 BÜTÇE DOSTU

**Spesifikasyonlar:**
- **CPU:** 4 vCPU
- **RAM:** 8 GB
- **Disk:** 200 GB SSD
- **Traffic:** 32 TB/ay
- **Fiyat:** €5.99/ay (~₺220) + €4.99 setup fee
- **Datacenter:** Nürnberg 🇩🇪

**Kaynak Dağılımı:**
```
RAM Dağılımı (8 GB):
├─ PostgreSQL:     2.5 GB (31%)
├─ Backend:        2.5 GB (31%)
├─ Frontend:       1.5 GB (19%)
├─ Nginx:          0.5 GB (6%)
└─ OS + Buffer:    1.0 GB (13%)
```

**Performans Tahmini:**
- ✅ **1,000-2,000 kullanıcı** (kaynak çok ama shared)
- ✅ **10,000-20,000 günlük QR tarama**
- ✅ **100-200 restoran**

**장점:**
- ✅ **En ucuz** (8GB RAM sadece €6!)
- ✅ Çok fazla kaynak
- ✅ 200 GB disk

**단점:**
- ⚠️ Shared resources (performans değişken olabilir)
- ⚠️ Setup fee €4.99

**Website:** https://contabo.com

---

### Ne Zaman Upgrade Gerekir?
- CPU kullanımı sürekli >75%
- RAM kullanımı >85%
- Disk kullanımı >70 GB
- Response time >500ms arttı

### Upgrade Path (Vultr/DigitalOcean):
```
4GB ($18-24) → 8GB ($36-48) → 16GB ($72-96)
     ↓              ↓              ↓
   1K users      2K users      5K users
```

---

### Seçenek 2: İki Sunucu (Orta Ölçek)

```
┌─────────────────┐        ┌─────────────────┐
│  Web Server     │        │  Database       │
│                 │        │                 │
│  Frontend       │  HTTP  │  PostgreSQL     │
│  Backend        │◄──────►│                 │
│  Nginx          │        │  Backups        │
└─────────────────┘        └─────────────────┘
```

**Uygun:** 1000-5000 kullanıcı

---

### Seçenek 3: Mikroservis (Büyük Ölçek)

```
┌────────────┐    ┌────────────┐    ┌────────────┐
│  Frontend  │    │  Backend   │    │  Database  │
│  (Vercel)  │───►│ (Railway/  │───►│ (Managed)  │
│            │    │  DO/AWS)   │    │            │
└────────────┘    └────────────┘    └────────────┘
        │
        ▼
   ┌─────────┐
   │   CDN   │
   │(Cloudflare)│
   └─────────┘
```

**Uygun:** 10,000+ kullanıcı

---

## 🚀 Deployment Adımları (VPS - DigitalOcean)

### 1. Sunucu Hazırlığı

```bash
# 1. Sunucu güncellemesi
apt update && apt upgrade -y

# 2. Firewall kurulumu
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# 3. Swap oluşturma (RAM az ise)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2. Node.js ve PostgreSQL Kurulumu

```bash
# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# PostgreSQL kullanıcı oluşturma
sudo -u postgres psql
CREATE DATABASE dijitalmenu;
CREATE USER defneqr WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE dijitalmenu TO defneqr;
\q
```

### 3. Proje Kurulumu

```bash
# 1. Git repository clone
cd /var/www
git clone https://github.com/yourusername/defneqr.git
cd defneqr

# 2. Backend kurulumu
cd backend
npm install --production
cp .env.example .env
nano .env  # .env dosyasını düzenle

# 3. Database migration
npx prisma migrate deploy
npx prisma generate

# 4. Frontend kurulumu
cd ../frontend
npm install
npm run build

# 5. PM2 ile servisleri başlat
pm2 start npm --name "defneqr-backend" -- run start --prefix /var/www/defneqr/backend
pm2 start npm --name "defneqr-frontend" -- run start --prefix /var/www/defneqr/frontend

# 6. PM2 startup script
pm2 startup systemd
pm2 save
```

### 4. Nginx Konfigürasyonu

```nginx
# /etc/nginx/sites-available/defneqr.com
server {
    listen 80;
    server_name defneqr.com www.defneqr.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000;
    }

    # Health checks
    location /health {
        proxy_pass http://localhost:5000;
    }

    location /metrics {
        proxy_pass http://localhost:5000;
        # Sadece yerel ağdan erişim
        allow 127.0.0.1;
        deny all;
    }
}
```

```bash
# Nginx konfigürasyonu etkinleştir
ln -s /etc/nginx/sites-available/defneqr.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 5. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot ile SSL
certbot --nginx -d defneqr.com -d www.defneqr.com

# Otomatik yenileme testi
certbot renew --dry-run
```

### 6. Monitoring Kurulumu

```bash
# 1. Prometheus
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /var/www/defneqr/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# 2. Grafana
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana

# 3. Uptime Kuma
docker run -d \
  --name uptime-kuma \
  -p 3002:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

---

## 💰 Detaylı Maliyet Karşılaştırması

### Tek Sunucu Mimarisi için Öneriler:

| Platform | Plan | CPU | RAM | Disk | Fiyat/Ay | Toplam/Yıl | Kapasite |
|----------|------|-----|-----|------|----------|------------|----------|
| **🥇 DigitalOcean** ⭐ | Premium (4GB) | 2 vCPU | 4 GB | 80 GB | $24 (~₺800) | $288 (~₺9,500) | 500-1K kullanıcı |
| **🥈 Vultr** | Regular | 2 vCPU | 4 GB | 80 GB | $18 (~₺600) | $216 (~₺7,100) | 500-1K kullanıcı |
| **🥉 Linode (Akamai)** | 4GB Plan | 2 vCPU | 4 GB | 80 GB | $24 (~₺800) | $288 (~₺9,500) | 500-1K kullanıcı |
| **Contabo** | VPS S | 4 vCPU | 8 GB | 200 GB | €5.99 (~₺220) | €72 (~₺2,600) | 1-2K kullanıcı |
| **OVHcloud** | VPS Comfort | 2 vCPU | 4 GB | 80 GB | €13 (~₺480) | €156 (~₺5,700) | 500-1K kullanıcı |
| **AWS Lightsail** | 4GB | 2 vCPU | 4 GB | 80 GB | $24 (~₺800) | $288 (~₺9,500) | 500-1K kullanıcı |

### Güçlü Sunucu Seçenekleri (Daha Fazla Kaynak):

| Platform | Plan | CPU | RAM | Disk | Fiyat/Ay | Kapasite |
|----------|------|-----|-----|------|----------|----------|
| **DigitalOcean** | Premium (8GB) | 4 vCPU | 8 GB | 160 GB | $48 (~₺1,600) | 1-2K kullanıcı |
| **Vultr** | High Frequency | 4 vCPU | 8 GB | 128 GB | $48 (~₺1,600) | 1-2K kullanıcı |
| **Linode** | 8GB Plan | 4 vCPU | 8 GB | 160 GB | $48 (~₺1,600) | 1-2K kullanıcı |
| **Contabo** | VPS M | 6 vCPU | 16 GB | 400 GB | €11.99 (~₺450) | 2-3K kullanıcı |

**Tavsiye:** Başlangıç için **DigitalOcean** (en kolay) veya **Vultr** (İstanbul datacenter)

---

## 🔧 Production .env Örneği

```env
# Database
DATABASE_URL="postgresql://defneqr:secure-password@localhost:5432/dijitalmenu?schema=public"

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=your-very-long-random-secret-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=https://defneqr.com

# Session
SESSION_SECRET=another-very-long-random-secret-key-change-this-in-production

# OAuth (if enabled)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://defneqr.com/api/auth/google/callback

# File Upload
MAX_FILE_SIZE=5242880
ENABLE_VIRUS_SCAN=false

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true

# Sentry (Error Tracking)
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/123456
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_RELEASE=defneqr@1.0.0

# Email Alerts
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_TO=admin@defneqr.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Metrics
METRICS_PUBLIC=false
METRICS_TOKEN=your-prometheus-scraping-token
```

---

## 📊 Performans Optimizasyonları

### 1. Database Connection Pooling

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  connection_limit = 10
  pool_timeout = 20
}
```

### 2. PM2 Cluster Mode

```bash
# pm2.config.js
module.exports = {
  apps: [{
    name: 'defneqr-backend',
    script: './src/server.js',
    instances: 'max',  // CPU sayısı kadar instance
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};

# Başlatma
pm2 start pm2.config.js --env production
```

### 3. Nginx Caching

```nginx
# Static dosyalar için cache
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 4. CDN (Cloudflare)

- Domain'i Cloudflare'e ekle
- DNS kayıtlarını güncelle
- Proxy aktif et (turuncu bulut)
- SSL/TLS: Full (strict)
- Auto Minify: JS, CSS, HTML

---

## 🔒 Güvenlik Checklist

- [ ] Firewall aktif (ufw)
- [ ] SSH key-based authentication
- [ ] PostgreSQL external connection kapalı
- [ ] .env dosyası git'te yok
- [ ] SSL/HTTPS aktif
- [ ] Rate limiting aktif
- [ ] Helmet.js aktif
- [ ] CORS doğru yapılandırılmış
- [ ] Regular backups ayarlandı
- [ ] Monitoring kurulu
- [ ] Error tracking (Sentry) aktif

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Tüm testler geçiyor
- [ ] Production .env hazır
- [ ] Database migration planı hazır
- [ ] Backup stratejisi dokümante edildi
- [ ] Rollback planı hazır
- [ ] Domain ve DNS yapılandırıldı

### Deployment
- [ ] Sunucu hazırlandı
- [ ] Dependencies kuruldu
- [ ] Database migrate edildi
- [ ] PM2 ile servisler başlatıldı
- [ ] Nginx yapılandırıldı
- [ ] SSL kuruldu
- [ ] Monitoring kuruldu

### Post-Deployment
- [ ] Health check testleri yapıldı
- [ ] Smoke testler geçti
- [ ] Logs kontrol edildi
- [ ] Performance metrikleri normal
- [ ] Uptime monitoring aktif
- [ ] Backup testi yapıldı

---

## 🆘 Troubleshooting

### Sunucu Yavaş
```bash
# CPU kullanımı kontrol
top

# Memory kullanımı
free -h

# Disk kullanımı
df -h

# PM2 logs
pm2 logs
pm2 monit
```

### Database Bağlantı Sorunları
```bash
# PostgreSQL durumu
systemctl status postgresql

# Connection sayısı
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Sorunları
```bash
# Config test
nginx -t

# Logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 📚 Ek Kaynaklar

- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)
- [Node.js Production Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## 📞 Destek

Deployment sırasında sorun yaşarsanız:
- Email: destek@defneqr.com
- Documentation: `/docs`
- Issues: GitHub Issues

---

**Son Güncelleme:** 2026-02-19  
**Version:** 1.0  
**Status:** ✅ Production Ready
