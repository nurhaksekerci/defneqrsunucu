# 🌐 Domain Bağlama Rehberi

## 📋 Gereksinimler

- ✅ Domain adı satın alınmış (örn: defneqr.com)
- ✅ Sunucu IP adresi (örn: 95.217.123.45)
- ✅ Sunucuya SSH erişimi
- ✅ Docker servisleri çalışıyor

---

## 🎯 Adım 1: DNS Ayarları (Domain Sağlayıcınızda)

### GoDaddy, Namecheap, NameSilo, vs.

1. Domain sağlayıcınızın paneline girin
2. **DNS Management** veya **DNS Ayarları** bölümüne gidin
3. Şu kayıtları ekleyin:

| Type | Host/Name | Value/Points to | TTL |
|------|-----------|-----------------|-----|
| A | @ | SUNUCU_IP_ADRESI | 1 Hour |
| A | www | SUNUCU_IP_ADRESI | 1 Hour |
| A | api | SUNUCU_IP_ADRESI | 1 Hour |

**Örnek (Sunucu IP: 95.217.123.45):**

```
A Record:  @    → 95.217.123.45  (defneqr.com)
A Record:  www  → 95.217.123.45  (www.defneqr.com)
A Record:  api  → 95.217.123.45  (api.defneqr.com)
```

### Cloudflare Kullanıyorsanız:

```
A Record:  @    → 95.217.123.45  (🧡 Proxy off - DNS only)
A Record:  www  → 95.217.123.45  (🧡 Proxy off - DNS only)
A Record:  api  → 95.217.123.45  (🧡 Proxy off - DNS only)
```

**⚠️ ÖNEMLİ:** SSL kurulumu için proxy'yi **KAPALI** tutun!

### DNS Propagation Kontrolü:

```bash
# DNS yayıldı mı kontrol et (lokal bilgisayarınızdan)
nslookup defneqr.com
nslookup api.defneqr.com

# Veya online tool:
# https://dnschecker.org
```

**Beklenen süre:** 5 dakika - 24 saat (genelde 15-30 dakika)

---

## 🎯 Adım 2: Firewall Ayarları (Sunucuda)

```bash
# SSH ile sunucuya bağlanın
ssh root@SUNUCU_IP

# UFW yükle ve ayarla
apt install -y ufw

# Gerekli portları aç
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Firewall'u aktifleştir
ufw enable

# Durumu kontrol et
ufw status
```

**Çıktı:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 🎯 Adım 3: SSL Sertifikası Kurulumu (Let's Encrypt)

### A. Certbot Yükle

```bash
# Sunucuda
apt update
apt install -y certbot
```

### B. Nginx'i Geçici Durdur

```bash
cd /opt/defneqr
docker compose stop nginx
```

### C. SSL Sertifikası Al

```bash
# Sertifika al (email adresinizi yazın)
certbot certonly --standalone \
  -d defneqr.com \
  -d www.defneqr.com \
  -d api.defneqr.com \
  --email destek@defneqr.com \
  --agree-tos \
  --no-eff-email

# Başarılı olursa:
# ✅ Certificate created: /etc/letsencrypt/live/defneqr.com/fullchain.pem
# ✅ Private key created: /etc/letsencrypt/live/defneqr.com/privkey.pem
```

### D. Sertifikaları Kopyala

```bash
# SSL klasörü oluştur
mkdir -p /opt/defneqr/nginx/ssl

# Sertifikaları kopyala
cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/
cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/

# İzinleri ayarla
chmod 644 /opt/defneqr/nginx/ssl/fullchain.pem
chmod 600 /opt/defneqr/nginx/ssl/privkey.pem
```

---

## 🎯 Adım 4: Nginx Konfigürasyonu (Production HTTPS)

```bash
cd /opt/defneqr
nano nginx/nginx.conf
```

**Tüm dosyayı şununla değiştirin:**

```nginx
events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Upstream
    upstream backend {
        server backend:5000;
        keepalive 32;
    }

    upstream frontend {
        server frontend:3000;
        keepalive 32;
    }

    # HTTP -> HTTPS Redirect
    server {
        listen 80;
        server_name defneqr.com www.defneqr.com api.defneqr.com;

        # Let's Encrypt verification
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirect to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Main Website (HTTPS)
    server {
        listen 443 ssl;
        http2 on;
        server_name defneqr.com www.defneqr.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        client_max_body_size 10M;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # API Subdomain (HTTPS)
    server {
        listen 443 ssl;
        http2 on;
        server_name api.defneqr.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Access-Control-Allow-Origin "https://defneqr.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        add_header Access-Control-Allow-Credentials "true" always;

        client_max_body_size 10M;

        # Backend API
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static uploads
        location /public/uploads/ {
            proxy_pass http://backend/public/uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Kaydet:** `Ctrl+X` → `Y` → `Enter`

---

## 🎯 Adım 5: .env Dosyasını Güncelle (Production URL'ler)

```bash
nano .env
```

**Şunları değiştirin:**

```env
# URLs (HTTPS - Production)
FRONTEND_URL=https://defneqr.com
NEXT_PUBLIC_API_URL=https://api.defneqr.com
NEXT_PUBLIC_SITE_URL=https://defneqr.com

# Google OAuth Callback (HTTPS)
GOOGLE_CALLBACK_URL=https://api.defneqr.com/api/auth/google/callback
```

**Kaydet**

---

## 🎯 Adım 6: Servisleri Yeniden Başlat

```bash
# Container'ları durdur
docker compose down

# Frontend'i yeniden build et (yeni URL'lerle)
docker compose build frontend

# Tüm servisleri başlat
docker compose up -d

# Logları izle
docker compose logs -f
```

---

## 🎯 Adım 7: Google OAuth Callback URL Güncelle

1. **Google Cloud Console'a gidin:** https://console.cloud.google.com/
2. **API & Services** → **Credentials**
3. OAuth 2.0 Client ID'nizi seçin
4. **Authorized redirect URIs** ekleyin:
   ```
   https://api.defneqr.com/api/auth/google/callback
   ```
5. **Save**

---

## ✅ Test Etme

### 1. DNS Kontrolü:
```bash
# Lokal bilgisayarınızdan
nslookup defneqr.com
nslookup api.defneqr.com

# Sunucu IP'nizi görmeli
```

### 2. SSL Kontrolü:
```bash
# Tarayıcıdan
https://defneqr.com
https://api.defneqr.com

# Yeşil kilit simgesi görünmeli
```

### 3. API Kontrolü:
```bash
# Sunucuda
curl https://api.defneqr.com/health
curl https://api.defneqr.com/api/settings

# 200 OK dönmeli
```

### 4. Frontend Kontrolü:
```bash
# Tarayıcıdan
https://defneqr.com

# Giriş sayfası görünmeli
```

---

## 🔄 SSL Otomatik Yenileme

Let's Encrypt sertifikaları 90 günde bir yenilenmeli:

```bash
# Yenileme komutu
certbot renew --quiet

# Otomatik yenileme için cron job ekle
crontab -e

# Şu satırı ekle (her ay 1'inde saat 02:00'de):
0 2 1 * * certbot renew --quiet --deploy-hook "cd /opt/defneqr && cp /etc/letsencrypt/live/defneqr.com/*.pem nginx/ssl/ && docker compose restart nginx"
```

---

## 🎨 Alternatif: Geçici Test (IP ile)

Domain henüz hazır değilse:

### 1. .env'de IP Kullan:
```env
FRONTEND_URL=http://SUNUCU_IP:3000
NEXT_PUBLIC_API_URL=http://SUNUCU_IP:5000/api
NEXT_PUBLIC_SITE_URL=http://SUNUCU_IP:3000
```

### 2. Nginx'i Basit HTTP Modda Kullan:

`nginx/nginx.conf`:
```nginx
events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Frontend
    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }

    # API (Port 5000'de direkt)
    server {
        listen 5000;
        server_name _;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### 3. Rebuild ve Restart:
```bash
docker compose down
docker compose build frontend
docker compose up -d
```

### 4. Erişim:
- Frontend: `http://SUNUCU_IP`
- Backend: `http://SUNUCU_IP:5000`

---

## 📊 Troubleshooting

### DNS Yayılmıyor:

```bash
# Farklı DNS serverlardan kontrol et
dig @8.8.8.8 defneqr.com
dig @1.1.1.1 defneqr.com

# Hosts dosyasıyla test et (geçici)
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts
SUNUCU_IP defneqr.com
SUNUCU_IP api.defneqr.com
```

### SSL Hatası - "Certificate not valid":

```bash
# Certbot yeniden çalıştır
certbot certonly --standalone -d defneqr.com -d api.defneqr.com --force-renewal

# Sertifikaları yeniden kopyala
cp /etc/letsencrypt/live/defneqr.com/*.pem /opt/defneqr/nginx/ssl/

# Nginx restart
docker compose restart nginx
```

### "Connection Refused":

```bash
# Firewall kontrol
ufw status

# Port 80 ve 443 açık mı?
netstat -tulpn | grep -E ':80|:443'

# Nginx çalışıyor mu?
docker compose ps nginx
```

### Frontend Backend'e Bağlanamıyor:

```bash
# .env kontrol
cat /opt/defneqr/.env | grep NEXT_PUBLIC_API_URL

# HTTPS kullanıyorsanız:
NEXT_PUBLIC_API_URL=https://api.defneqr.com/api

# HTTP kullanıyorsanız:
NEXT_PUBLIC_API_URL=http://api.defneqr.com/api

# Frontend'i rebuild et
docker compose build frontend
docker compose up -d frontend
```

---

## 🚀 Hızlı Kurulum (Özet)

### DNS Ayarları (Domain Sağlayıcı):
```
A: @   → SUNUCU_IP
A: www → SUNUCU_IP
A: api → SUNUCU_IP
```

### Sunucuda (15-20 dakika):
```bash
# 1. Firewall
ufw allow 80/tcp && ufw allow 443/tcp && ufw enable

# 2. SSL
docker compose stop nginx
certbot certonly --standalone -d defneqr.com -d www.defneqr.com -d api.defneqr.com --email destek@defneqr.com --agree-tos
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/defneqr.com/*.pem nginx/ssl/

# 3. .env güncelle
nano .env
# NEXT_PUBLIC_API_URL=https://api.defneqr.com/api
# NEXT_PUBLIC_SITE_URL=https://defneqr.com
# FRONTEND_URL=https://defneqr.com

# 4. Nginx config güncelle (yukarıdaki HTTPS config)
nano nginx/nginx.conf

# 5. Restart
docker compose down
docker compose build frontend
docker compose up -d

# 6. Test
curl https://defneqr.com
curl https://api.defneqr.com/health
```

---

## 🎯 Final Checklist

- [ ] DNS A record'ları eklendi (defneqr.com, www, api)
- [ ] DNS yayıldı (nslookup ile kontrol edildi)
- [ ] Firewall portları açıldı (80, 443)
- [ ] SSL sertifikası alındı (certbot)
- [ ] Sertifikalar nginx/ssl/ klasörüne kopyalandı
- [ ] nginx.conf HTTPS için güncellendi
- [ ] .env dosyasında HTTPS URL'leri güncellendi
- [ ] Frontend rebuild edildi
- [ ] Servisler restart edildi
- [ ] https://defneqr.com açılıyor ✅
- [ ] Admin girişi çalışıyor ✅
- [ ] Google OAuth callback güncellendi

---

## 📞 Hata Aldığınızda:

```bash
# Logları kontrol et
docker compose logs nginx
docker compose logs frontend
docker compose logs backend

# SSL test
openssl s_client -connect defneqr.com:443

# DNS test
dig defneqr.com
```

---

**💡 İpucu:** İlk kurulumda IP ile test edin, domain çalıştıktan sonra HTTPS'e geçin. Daha az hata!
