# CHP İstanbul — chp.defneqr.com Yayınlama

Bu proje DefneQr altyapısına entegre edilmiştir ve **chp.defneqr.com** adresinde yayınlanır.

## Adresler

| Servis | URL |
|--------|-----|
| Frontend (CHP Etkinlik) | https://chp.defneqr.com |
| API (Django) | https://api-chp.defneqr.com |

## Gereksinimler

1. **DNS**: `chp.defneqr.com` ve `api-chp.defneqr.com` A kayıtları sunucu IP'sine yönlendirilmeli.
2. **SSL**: DefneQr nginx aynı sertifikayı kullanır (`*.defneqr.com` için wildcard veya her subdomain için ayrı).
3. **Ortam değişkenleri** (`.env` veya sunucu ortamı):

```env
# Zorunlu — DefneQr Postgres ile paylaşılıyor
DB_USER=defneqr
DB_PASSWORD=<güçlü-şifre>

# CHP İstanbul için
CHP_SECRET_KEY=<en az 40 karakter güvenli anahtar>
CHP_API_URL=https://api-chp.defneqr.com
```

## İlk Kurulum

```bash
# DefneQr root dizininde
cd C:\DEV\DefneQr

# Servisleri build ve başlat (CHP dahil)
docker compose up -d --build backend-chp frontend-chp

# İlk migration
docker compose exec backend-chp python manage.py migrate

# İsteğe bağlı: Superuser oluştur
docker compose exec backend-chp python manage.py createsuperuser
```

## Veritabanı

- **chpistanbul** veritabanı, Postgres **ilk kurulumda** (boş volume) `init-multiple-databases.sh` ile oluşturulur.
- **Mevcut sunucuda** (Postgres zaten çalışıyorsa) `chpistanbul` yoktur — aşağıdaki komutu **bir kez** çalıştırın:

```bash
cd /opt/defneqr   # proje kökü
docker compose exec postgres psql -U defneqr -d postgres -c "CREATE DATABASE chpistanbul;"
```

`defneqr` yerine `.env` içindeki `DB_USER` değerini kullanın. Şifre sormaz (konteyner içi bağlantı).

Ardından:

```bash
docker compose exec backend-chp python manage.py migrate
```

Veritabanı zaten varsa: `ERROR: database "chpistanbul" already exists` — bu durumda doğrudan `migrate` çalıştırın.

## Yapılan Değişiklikler

- `scripts/postgres/init-multiple-databases.sh` — `chpistanbul` DB eklendi
- `docker-compose.yml` — backend-chp, frontend-chp servisleri
- `nginx/nginx.conf` — chp.defneqr.com ve api-chp.defneqr.com sunucu blokları
- CHP frontend Dockerfile — varsayılan `NEXT_PUBLIC_API_URL` güncellendi
