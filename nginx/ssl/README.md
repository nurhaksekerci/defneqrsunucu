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

# Sertifika al
certbot certonly --standalone \
  -d defneqr.com \
  -d www.defneqr.com \
  -d api.defneqr.com \
  --email destek@defneqr.com \
  --agree-tos

# Sertifikaları kopyala
cp /etc/letsencrypt/live/defneqr.com/fullchain.pem /opt/defneqr/nginx/ssl/
cp /etc/letsencrypt/live/defneqr.com/privkey.pem /opt/defneqr/nginx/ssl/

# Nginx'i restart et
docker compose restart nginx
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
  docker compose restart nginx
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

**Oluşturulma:** 2026-02-19  
**Proje:** Defne Qr
