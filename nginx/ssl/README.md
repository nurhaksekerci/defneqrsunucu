# SSL Certificates Directory

## 📁 Bu Klasör Ne İçin?

SSL sertifikalarınızı buraya yerleştirin.

---

## 🔐 Gerekli Dosyalar

Production'da bu klasörde olması gerekenler:

```
nginx/ssl/
├── fullchain.pem      (SSL sertifikası)
└── privkey.pem        (Private key)
```

---

## 🚀 SSL Sertifikası Nasıl Alınır?

### Let's Encrypt ile (ÜCRETSİZ):

```bash
# Contabo sunucunuzda
apt install certbot -y

# Sertifika al (tüm domainler dahil)
certbot certonly --standalone \
  -d defneqr.com \
  -d www.defneqr.com \
  -d api.defneqr.com \
  -d randevu.defneqr.com \
  -d admin.defneqr.com \
  --email destek@defneqr.com \
  --agree-tos

# Sertifikaları kopyala
cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/
cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/

# Nginx'i restart et
cd /opt/defneqr && docker compose restart nginx
```

---

## 🔒 admin.defneqr.com için SSL Aktif Etme

Mevcut sertifikanız varsa ve sadece **admin.defneqr.com** eklemek istiyorsanız:

### Adım 1: DNS Kaydı

Domain sağlayıcınızda (Contabo, Cloudflare vb.) **admin.defneqr.com** için A kaydı oluşturun:

| Tip | İsim | Değer        | TTL  |
|-----|------|--------------|------|
| A   | admin| SUNUCU_IP    | 3600 |

Örnek: Sunucu IP `123.45.67.89` ise → `admin` → `123.45.67.89`

DNS yayılımı 5–30 dakika sürebilir. Kontrol:

```bash
dig admin.defneqr.com +short
# veya
nslookup admin.defneqr.com
```

### Adım 2: Nginx'i Geçici Durdur (Port 80 Boş Olmalı)

Certbot `--standalone` kullanırken 80 portu boş olmalı:

```bash
cd /opt/defneqr
docker compose stop nginx
```

### Adım 3: Sertifikaya admin.defneqr.com Ekle

**Yeni sertifika alıyorsanız** (ilk kurulum):

```bash
certbot certonly --standalone \
  -d defneqr.com \
  -d www.defneqr.com \
  -d api.defneqr.com \
  -d randevu.defneqr.com \
  -d admin.defneqr.com \
  --email destek@defneqr.com \
  --agree-tos
```

**Mevcut sertifikanız varsa** (domain ekleme):

```bash
certbot certonly --standalone --expand \
  -d defneqr.com \
  -d www.defneqr.com \
  -d api.defneqr.com \
  -d randevu.defneqr.com \
  -d admin.defneqr.com \
  --email destek@defneqr.com \
  --agree-tos
```

### Adım 4: Sertifikaları Proje Klasörüne Kopyala

```bash
cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/
cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/
chmod 644 /opt/defneqr/nginx/ssl/fullchain.pem
chmod 600 /opt/defneqr/nginx/ssl/privkey.pem
```

### Adım 5: Nginx'i Başlat

```bash
cd /opt/defneqr
docker compose up -d nginx
```

### Adım 6: Test

```bash
curl -I https://admin.defneqr.com
# veya tarayıcıda: https://admin.defneqr.com
```

---

## 🔄 Otomatik Yenileme

Let's Encrypt sertifikaları 90 günde bir yenilenmeli:

```bash
# Crontab düzenle
crontab -e

# Şunu ekle (her gün 3:00'da kontrol et):
0 3 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/ && \
  cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/ && \
  cd /opt/defneqr && docker compose restart nginx
```

---

## ⚠️ GÜVENLİK UYARISI

**Bu klasördeki .pem dosyaları GIT'e COMMIT EDİLMEMELİ!**

`.gitignore` dosyasında zaten tanımlı:
```
nginx/ssl/*.pem
nginx/ssl/*.key
```

---

## 📋 Hızlı Özet: admin.defneqr.com SSL

```bash
# 1. DNS: admin.defneqr.com → sunucu IP
# 2. Nginx durdur
docker compose -f /opt/defneqr/docker-compose.yml stop nginx

# 3. Sertifika al/güncelle
certbot certonly --standalone --expand \
  -d defneqr.com -d www.defneqr.com -d api.defneqr.com \
  -d randevu.defneqr.com -d admin.defneqr.com \
  --email destek@defneqr.com --agree-tos

# 4. Kopyala
cp /etc/letsencrypt/live/defneqr.com/{fullchain,privkey}.pem /opt/defneqr/nginx/ssl/

# 5. Nginx başlat
cd /opt/defneqr && docker compose up -d nginx
```

---

**Oluşturulma:** 2026-02-19  
**Güncelleme:** 2026-03-12 (admin.defneqr.com eklendi)  
**Proje:** Defne Qr
