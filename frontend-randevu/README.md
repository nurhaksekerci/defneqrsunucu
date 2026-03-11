# DefneRandevu Frontend

Randevu yönetim sistemi — randevu.defneqr.com (geçici) / defnerandevu.com (gelecek)

## Geliştirme

```bash
# Bağımlılıklar
npm install

# .env.local (opsiyonel - varsayılanlar api.defneqr.com kullanır)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Çalıştır (port 3001)
npm run dev
```

## Production (Docker)

`docker-compose.yml` ile birlikte build edilir. `randevu.defneqr.com` Nginx üzerinden frontend-randevu servisine yönlendirilir.

## Domain Geçişi

defnerandevu.com satın alındığında:

1. `.env` / docker-compose: `RANDEVU_SITE_URL=https://defnerandevu.com`
2. Nginx: `server_name` listesine `defnerandevu.com www.defnerandevu.com` ekle
3. DNS: defnerandevu.com → sunucu IP
4. SSL: certbot ile sertifika al
