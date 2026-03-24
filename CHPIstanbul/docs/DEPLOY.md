# Üretim ve dağıtım notları

Bu belge [backend](../backend/) ve [frontend](../frontend/) için barındırma, ortamlar ve operasyon başlıklarını özetler.

## Mimari

- **API:** Django 5 + DRF + JWT, ayrı süreç (ör. Gunicorn).
- **Arayüz:** Next.js; tarayıcı `NEXT_PUBLIC_API_URL` ile API’ye gider (build zamanında gömülür).
- **Veri:** Üretimde `DEBUG=False` iken PostgreSQL zorunludur ([settings](../backend/config/settings.py)).

## Ortamlar (staging / production)

1. **Ayrı `.env` veya barındırıcı gizli değişkenleri:** staging ve production için farklı `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_*`.
2. **Frontend:** Staging ve production için ayrı build (veya aynı imaj, farklı `NEXT_PUBLIC_API_URL` build argümanı).
3. **CORS:** Wildcard yerine tam köken listesi; admin kullanımı için `CSRF_TRUSTED_ORIGINS` (HTTPS URL’leri).

## Barındırma seçenekleri

| Seçenek | API | Frontend |
|--------|-----|----------|
| **Docker Compose** | [docker-compose.yml](../docker-compose.yml) ile Postgres + API + **web** (Next.js) | İsteğe bağlı Vercel |
| **PaaS** | Render, Fly.io, Railway (Gunicorn komutu) | Vercel (Next.js) |
| **Tek VM** | nginx TLS → Gunicorn | `next build` + `next start` veya statik CDN |

API arkasında TLS sonlandıran bir proxy kullanıyorsanız `USE_TLS_BEHIND_PROXY=True` ayarlayın.

## Yayın öncesi kontrol listesi

**Backend**

- `DEBUG=False`, güçlü `SECRET_KEY` (≥40 karakter, repoda yok).
- PostgreSQL ve yedek politikası (`pg_dump`, yönetilen DB anlık görüntüleri).
- `python manage.py migrate` ve `collectstatic` (WhiteNoise ile statikler).
- Medya: tek sunucu dışında `AWS_STORAGE_BUCKET_NAME` ile S3 uyumlu depolama.
- `GET /health/` yük dengeleyici kontrolü için.

**Frontend**

- `NEXT_PUBLIC_API_URL` üretim API HTTPS adresi.
- JWT’nin `localStorage`’da tutulması XSS riski taşır; ileride httpOnly çerez veya BFF değerlendirin ([auth-storage](../frontend/src/lib/auth-storage.ts)).

## Yedekleme

- Veritabanı: günlük otomatik yedek ve geri yükleme testi.
- Medya: S3 kullanılıyorsa bucket yaşam döngüsü / çoğaltma; diskteyse dosya sistemi yedekleri.

## İzleme ve olay müdahalesi

- Sunucu logları: `LOG_LEVEL` / `DJANGO_LOG_LEVEL` ([settings](../backend/config/settings.py)).
- İsteğe bağlı: [Sentry](https://sentry.io) veya benzeri (Django + Next SDK).
- CI: [backend-tests.yml](../.github/workflows/backend-tests.yml) ile pytest.

## Docker örneği

```bash
cp backend/.env.example backend/.env
# .env içinde DEBUG=False, SECRET_KEY, CORS, ALLOWED_HOSTS düzenleyin
docker compose up --build
```

Servisler: **db** (Postgres, host’ta 5433), **api** (8000), **web** (3000). Frontend imajı [frontend/Dockerfile](../frontend/Dockerfile) ile üretilir; `NEXT_PUBLIC_API_URL` build argümanı olarak verilir — tarayıcıdaki istekler bu adrese gider, bu yüzden yerel kullanımda genelde `http://127.0.0.1:8000` (makinede yayınlanan API) uygundur. Farklı makineden veya ters proxy ile erişimde compose içinde `build.args.NEXT_PUBLIC_API_URL` değerini güncelleyin.

**CORS / preflight:** `DEBUG=False` iken Django varsayılan olarak `SECURE_SSL_REDIRECT=True` kullanır; tarayıcı `http://…` adresine `OPTIONS` gönderince sunucu `https://…` yönlendirmesi döner ve tarayıcı *“Redirect is not allowed for a preflight request”* hatası verir. Yerel HTTP için `SECURE_SSL_REDIRECT=False` (Compose’ta `api` servisi için zaten ekli) ve gerekirse `SECURE_HSTS_SECONDS=0` kullanın. Gerçek HTTPS veya TLS sonlandıran proxy ile üretimde bu yönlendirmeyi proxy veya uygun env ile yönetin.

**createsuperuser / UnicodeEncodeError (surrogate):** PowerShell’den etkileşimli `docker compose run … createsuperuser` bazen stdin’de geçersiz baytlar üretir; PostgreSQL’e yazarken `UnicodeEncodeError` oluşur. Çözüm: API imajını yeniden derleyin (`docker compose build api`), gerekirse etkileşimsiz oluşturun:

```bash
docker compose run --rm -e DJANGO_SUPERUSER_USERNAME=admin -e DJANGO_SUPERUSER_EMAIL=a@b.com -e DJANGO_SUPERUSER_PASSWORD=guclu-parola api python manage.py createsuperuser --noinput
```

**Rapor görsel yükleme (multipart):** Tarayıcı `FormData` ile gönderir; istemci `Content-Type` boundary’sini kendisi üretir (elle `application/json` vermeyin). Django’da `DATA_UPLOAD_MAX_MEMORY_SIZE` / `FILE_UPLOAD_MAX_MEMORY_SIZE` varsayılan 32MB; Gunicorn imajında `--limit-request-field_size` artırılmıştır.

**Medya (`/media/`):** `DEBUG=False` iken Django varsayılan olarak kullanıcı yüklemelerini sunmaz. Docker Compose’ta `SERVE_MEDIA=True` ve `api_media` volume ile `/app/media` kalıcıdır ve rapor görselleri `http://127.0.0.1:8000/media/...` üzerinden açılır. Canlı ortamda bunun yerine nginx veya `AWS_STORAGE_BUCKET_NAME` (S3) kullanın.

PostgreSQL konteyneri host’ta **5433** portuna map edilir (`localhost:5433`), böylece makinenizde zaten **5432** dinleyen bir Postgres varsa çakışma olmaz. API konteyneri veritabanına yine Docker ağı üzerinden `db:5432` ile bağlanır.

İlk çalıştırmada veritabanı şeması için (önce `db` sağlıklı olmalı; aşağıdaki komut bağımlılığı başlatır):

```bash
docker compose run --rm api python manage.py migrate
```

Yığın zaten ayaktaysa:

```bash
docker compose exec api python manage.py migrate
```

`could not translate host name "db"` görürseniz genelde `db` konteyneri hiç ayakta değildir (ör. 5432 port çakışması). `docker compose ps` ile kontrol edin; gerekirse yerel Postgres’i durdurun veya bu repodaki compose’ta kullanılan host portunu (`5433`) kullanın.

## JWT ve güvenlik

- Access / refresh süreleri `SIMPLE_JWT` ile ayarlanır; çıkış ve çalıntı token için blacklist / rotation stratejisi ayrıca planlanabilir.
- Giriş uçları `ScopedRateThrottle` ile sınırlıdır; genel API `Anon` / `User` limitlerine tabidir.
