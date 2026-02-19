# Contabo + Docker - Hızlı Başlangıç Kılavuzu

## 🚀 Defne Qr Deployment (Docker ile)

**Hedef:** Contabo Cloud VPS 20 üzerinde Docker ile Defne Qr'yi yayınlamak

**Süre:** ~1-2 saat

---

## 📋 Ön Hazırlık

### Satın Aldığınız Sunucu:
- ✅ Contabo Cloud VPS 20
- ✅ 6 vCPU, 12 GB RAM
- ✅ 100 GB NVMe (veya 200 GB SSD)
- ✅ Ubuntu 22.04
- ✅ 12 aylık kontrat (€5.60/ay)

### Gerekli Bilgiler:
- Sunucu IP adresi (Contabo email'den gelecek)
- Root şifresi (kurulumda belirlediğiniz)
- Domain adınız (örn: defneqr.com)

---

## 🔧 ADIM 1: İlk Bağlantı ve Güvenlik (15 dakika)

### 1.1. SSH Bağlantısı (Windows PowerShell)

```powershell
# SSH ile bağlan
ssh root@YOUR_SERVER_IP

# Evet yazın
yes

# Root şifrenizi girin
```

### 1.2. Sistem Güncelleme

```bash
# Sistem güncellemesi
apt update && apt upgrade -y

# Timezone ayarla (Türkiye)
timedatectl set-timezone Europe/Istanbul

# Hostname ayarla
hostnamectl set-hostname defneqr
```

### 1.3. Firewall Kurulumu

```bash
# UFW kurulumu
apt install ufw -y

# Port'ları aç
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Firewall aktif et
ufw --force enable

# Kontrol
ufw status
```

### 1.4. Swap Oluştur (Ekstra RAM)

```bash
# 4 GB swap oluştur
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Kalıcı yap
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Kontrol
free -h
```

---

## 🐳 ADIM 2: Docker Kurulumu (10 dakika)

### 2.1. Docker Kurulumu

```bash
# Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker başlat
systemctl start docker
systemctl enable docker

# Docker Compose plugin
apt install docker-compose-plugin -y

# Kontrol
docker --version
docker compose version
```

### 2.2. Docker Optimizasyonu

```bash
# Docker daemon.json oluştur
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF

# Docker restart
systemctl restart docker
```

---

## 📦 ADIM 3: Proje Deployment (30 dakika)

### 3.1. Proje Dosyalarını Upload Et

**Seçenek A: Git ile (Önerilen)**

```bash
# Git kurulumu
apt install git -y

# Proje dizini oluştur
mkdir -p /opt/defneqr
cd /opt/defneqr

# GitHub'dan clone (eğer GitHub'da ise)
git clone https://github.com/YOUR_USERNAME/defneqr.git .

# Veya manuel upload et (FileZilla/WinSCP ile)
```

**Seçenek B: Manuel Upload (WinSCP)**

1. WinSCP'yi aç
2. Host: YOUR_SERVER_IP
3. Username: root
4. Password: YOUR_PASSWORD
5. `/opt/defneqr` klasörüne dosyaları kopyala

### 3.2. Environment Dosyaları

```bash
# Backend .env oluştur
cd /opt/defneqr/backend
nano .env
```

**Backend `.env` içeriği:**

```env
# Server
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://defneqr:STRONG_PASSWORD_HERE@postgres:5432/defneqr

# JWT
JWT_SECRET=YOUR_VERY_LONG_RANDOM_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_ANOTHER_LONG_SECRET_HERE
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://defneqr.com

# Uploads
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880

# Sentry (opsiyonel)
SENTRY_DSN=

# Email (opsiyonel - daha sonra)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

```bash
# Frontend .env.production oluştur
cd /opt/defneqr/frontend
nano .env.production
```

**Frontend `.env.production` içeriği:**

```env
NEXT_PUBLIC_API_URL=https://api.defneqr.com
NODE_ENV=production
```

### 3.3. Docker Compose Dosyası

```bash
# Ana dizine dön
cd /opt/defneqr

# docker-compose.yml oluştur
nano docker-compose.yml
```

**`docker-compose.yml` içeriği:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: defneqr-postgres
    environment:
      POSTGRES_DB: defneqr
      POSTGRES_USER: defneqr
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/schema.prisma:/app/schema.prisma
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U defneqr"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: defneqr-backend
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    ports:
      - "127.0.0.1:5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: defneqr-frontend
    env_file:
      - ./frontend/.env.production
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: defneqr-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./backend/uploads:/var/www/uploads:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3.4. Dockerfile'lar Oluştur

**Backend Dockerfile:**

```bash
cd /opt/defneqr/backend
nano Dockerfile
```

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# App
COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
```

**Frontend Dockerfile:**

```bash
cd /opt/defneqr/frontend
nano Dockerfile
```

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🌐 ADIM 4: Nginx + SSL (30 dakika)

### 4.1. Nginx Konfigürasyonu

```bash
# Nginx dizini oluştur
mkdir -p /opt/defneqr/nginx/ssl
cd /opt/defneqr/nginx

# nginx.conf oluştur
nano nginx.conf
```

**`nginx.conf` içeriği:**

```nginx
events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Upstream
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name defneqr.com www.defneqr.com api.defneqr.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Main site (HTTPS)
    server {
        listen 443 ssl http2;
        server_name defneqr.com www.defneqr.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 10M;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API (HTTPS)
    server {
        listen 443 ssl http2;
        server_name api.defneqr.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        client_max_body_size 10M;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Uploads
        location /uploads/ {
            alias /var/www/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 4.2. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
apt install certbot -y

# SSL sertifikası al (manuel)
certbot certonly --standalone -d defneqr.com -d www.defneqr.com -d api.defneqr.com --email destek@defneqr.com --agree-tos

# Sertifikaları kopyala
cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/
cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/

# Otomatik yenileme
crontab -e

# Şunu ekle:
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/ && cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/ && docker restart defneqr-nginx
```

---

## 🚀 ADIM 5: Projeyi Başlat (10 dakika)

### 5.1. Build ve Start

```bash
# Ana dizine git
cd /opt/defneqr

# DB şifresi environment'a ekle
export DB_PASSWORD="STRONG_DB_PASSWORD_HERE"

# Docker Compose build
docker compose build --no-cache

# Container'ları başlat
docker compose up -d

# Log'ları izle
docker compose logs -f
```

### 5.2. Database Migration

```bash
# Backend container'a gir
docker exec -it defneqr-backend sh

# Prisma migrate
npx prisma migrate deploy

# İlk admin kullanıcı oluştur (opsiyonel)
npx prisma db seed

# Çık
exit
```

### 5.3. Kontrol

```bash
# Container durumları
docker ps

# Health check
curl http://localhost:5000/health
curl http://localhost:3000

# Website test
curl https://defneqr.com
```

---

## 📊 ADIM 6: Monitoring Kurulumu (20 dakika)

### 6.1. Prometheus + Grafana

```bash
# Monitoring dizini
mkdir -p /opt/monitoring
cd /opt/monitoring

# docker-compose.yml oluştur
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SERVER_ROOT_URL=https://monitoring.defneqr.com
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "127.0.0.1:3001:3000"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

**prometheus.yml:**

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'defneqr-backend'
    static_configs:
      - targets: ['YOUR_SERVER_IP:5000']
    metrics_path: '/metrics'
```

```bash
# Başlat
docker compose up -d

# Grafana'ya eriş: http://YOUR_SERVER_IP:3001
# Username: admin
# Password: admin
```

---

## ✅ Kurulum Tamamlandı! 🎉

### Kontrol Listesi:

- [x] Sunucu güvenliği yapılandırıldı
- [x] Docker kuruldu
- [x] Proje deploy edildi
- [x] SSL sertifikası alındı
- [x] Nginx konfigüre edildi
- [x] Database migrate edildi
- [x] Monitoring kuruldu

### Erişim URL'leri:

- **Ana Site:** https://defneqr.com
- **API:** https://api.defneqr.com
- **Admin Panel:** https://defneqr.com/admin
- **Grafana:** http://YOUR_SERVER_IP:3001

---

## 🛠️ Günlük Yönetim Komutları

```bash
# Container durumu
docker ps

# Log'lar
docker compose logs -f backend
docker compose logs -f postgres

# Restart
docker compose restart backend
docker compose restart nginx

# Stop/Start
docker compose down
docker compose up -d

# Backup
docker exec defneqr-postgres pg_dump -U defneqr defneqr > backup.sql

# Update (yeni kod)
cd /opt/defneqr
git pull
docker compose build
docker compose up -d
```

---

## 🆘 Sorun Giderme

### Backend başlamıyor?
```bash
docker compose logs backend
# Database connection kontrol et
```

### Database connection error?
```bash
docker exec -it defneqr-postgres psql -U defneqr
# Şifre kontrol et
```

### SSL hatası?
```bash
certbot renew --dry-run
# Sertifikaları yeniden kopyala
```

---

**Oluşturulma:** 2026-02-19  
**Proje:** Defne Qr  
**Sunucu:** Contabo Cloud VPS 20 (Docker)
