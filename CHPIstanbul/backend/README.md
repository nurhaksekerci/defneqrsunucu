# CHP İstanbul — Django API

Next.js arayüzü ile uyumlu **etkinlik** ve **rapor** REST API’si. Hat ve ilçe, kullanıcı profilinden otomatik atanır; etkinlik oluşturma isteğinde gönderilmez.

## Gereksinimler

- Python 3.12+
- (İsteğe bağlı) PostgreSQL — tanımlı değilse SQLite kullanılır

## Kurulum

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_org
.\.venv\Scripts\python.exe manage.py createsuperuser
```

### Örnek (fake) veri

Koordinasyon hatları, kol/hat türleri, demo kullanıcılar ve `[DEMO]` önekli etkinlik/raporlar eklemek için:

```powershell
.\.venv\Scripts\python.exe manage.py seed_demo
```

Yeniden yüklemek için: `seed_demo --force` (mevcut `[DEMO]` etkinliklerini siler, kullanıcıları günceller).

Mevcut **hat** kayıtlarınızı değiştirmeden her hat için `[FAKE]` önekli etkinlik ve (yarısı için) rapor eklemek:

```powershell
.\.venv\Scripts\python.exe manage.py seed_fake_events
.\.venv\Scripts\python.exe manage.py seed_fake_events --per-hat 3
.\.venv\Scripts\python.exe manage.py seed_fake_events --force
```

`--force`, tüm `[FAKE]` etkinliklerini silip yeniden oluşturur. Daha önce `[FAKE]` olan hatlar, `--force` olmadan atlanır.

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `demo_il` | `demo123` | İl yetkilisi (Ana Kademe il koordinasyon) |
| `demo_genclik` | `demo123` | Kadıköy · Gençlik Kolları |
| `demo_koord_sisli` | `demo123` | Şişli · ilçe koordinasyon |

Yönetim panelinde (`/admin/`) kendi kullanıcılarınız için profilde **hat** ve **ilçe** atayın; aksi halde `POST /api/events/` `400` döner.

## Testler (pytest)

```powershell
cd backend
.\.venv\Scripts\pip.exe install -r requirements.txt -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest
```

- Ayar: [pytest.ini](pytest.ini) (`DJANGO_SETTINGS_MODULE=config.settings`).
- Testler: `events/tests/`, `accounts/tests/`, `org/tests/`, `config/tests/`.
- Ortak fixture’lar: [conftest.py](conftest.py).

## Çalıştırma

```powershell
.\.venv\Scripts\python.exe manage.py runserver 8000
```

- API kökü: `http://127.0.0.1:8000/api/`
- Admin: `http://127.0.0.1:8000/admin/`

## Ortam değişkenleri (`.env`)

Ayrıntılı örnek: [.env.example](.env.example).

| Değişken | Açıklama |
|----------|----------|
| `SECRET_KEY` | Üretimde güçlü anahtar (≥40 karakter); varsayılan / `django-insecure` ile `DEBUG=False` çalışmaz |
| `DEBUG` | `True` / `False` — `False` iken PostgreSQL zorunlu, HTTPS ve çerez güvenliği ayarları açılır |
| `ALLOWED_HOSTS` | Virgülle ayrılmış hostlar |
| `CORS_ALLOWED_ORIGINS` | Tam köken listesi (wildcard yok) |
| `CSRF_TRUSTED_ORIGINS` | Admin için HTTPS kökleri; boş ve `DEBUG=False` ise `CORS_ALLOWED_ORIGINS` kopyalanır |
| `USE_TLS_BEHIND_PROXY` | `True` ise `X-Forwarded-Proto` ile TLS algılanır |
| `DATABASE_ENGINE` | Boş: SQLite. `DEBUG=False` iken boş bırakılamaz (PostgreSQL gerekir) |
| `AWS_*` | S3 uyumlu medya — `AWS_STORAGE_BUCKET_NAME` doluysa rapor görselleri nesne depoda |
| `LOG_LEVEL` / `DJANGO_LOG_LEVEL` | Kök ve Django log seviyesi (`INFO` vb.) |
| `DRF_THROTTLE_*` | Genel ve JWT uçları için hız limiti metinleri (`15/minute` vb.) |

## Üretimde çalıştırma

1. Ortam: `DEBUG=False`, güçlü `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, PostgreSQL `DATABASE_*`.
2. Statik dosyalar: `python manage.py collectstatic` (WhiteNoise `DEBUG=False` iken sıkıştırmalı manifest depolama kullanır).
3. WSGI: ör. `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120`
4. Sağlık: `GET /health/` → `{"status":"ok"}` (yük dengeleyici için).
5. Docker: [Dockerfile](Dockerfile) ve depo kökündeki [docker-compose.yml](../docker-compose.yml).

`COLLECTSTATIC_FOR_PROD=1` ile `DEBUG=True` ortamında bile manifest üreten `collectstatic` çalıştırılabilir (imaj derlemesi için).

## Kimlik doğrulama (JWT)

| Metot | Yol | Gövde |
|--------|-----|--------|
| `POST` | `/api/auth/token/` | `{"username":"...","password":"..."}` |
| `POST` | `/api/auth/token/refresh/` | `{"refresh":"..."}` |

İstek başlığı: `Authorization: Bearer <access_token>`

## Örgüt (salt okunur)

- `GET /api/org/hats/` — hatlar
- `GET /api/org/districts/` — ilçeler

**Hat `code`:** Admin’de boş bırakılabilir; kayıtta önce ad içindeki Türkçe harfler ASCII karşılıklarına çevrilir, ardından `slugify(..., allow_unicode=False)` ile üretilir (ör. `Kadın Kolları` → `kadin-kollari`). Çakışmada `-1`, `-2` eklenir. İsterseniz kodu elle de verebilirsiniz.

## Etkinlikler

| Metot | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `/api/events/` | `?status=planned\|completed`, `?date_from=YYYY-MM-DD`, `?date_to=YYYY-MM-DD` |
| `POST` | `/api/events/` | Oluştur (hat/ilçe profilden) |
| `GET` | `/api/events/{id}/` | Detay + varsa rapor |
| `POST` | `/api/events/{id}/complete/` | Tamamlandı işaretle |
| `POST` | `/api/events/{id}/report/` | `multipart` veya JSON: `body`, `status`, `images`, `remove_image_ids` — yalnızca etkinliği oluşturan veya staff (`created_by` yoksa kapsamdaki kullanıcılar) |

**Etkinlik oluşturma (JSON örnek)**

```json
{
  "title": "Mahalle buluşması",
  "description": "Kısa açıklama",
  "starts_at": "2026-03-26T10:00:00+03:00",
  "location_kind": "address",
  "address_text": "Kadıköy ...",
  "latitude": null,
  "longitude": null
}
```

`location_kind`: `address` (zorunlu `address_text`) veya `map` (zorunlu `latitude`, `longitude`).

## Raporlar (liste / detay)

| Metot | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `/api/reports/` | `?status=draft\|review\|published` |
| `GET` | `/api/reports/{id}/` | Tek rapor (`image_items` id+url, `can_edit`, `event_id`, `status_code`) |

## Medya

Yüklenen rapor görselleri varsayılan olarak `MEDIA_ROOT` altında saklanır. `DEBUG=True` iken `/media/...` ile sunulur. `DEBUG=False` iken yerel sunum için ortamda `SERVE_MEDIA=True` kullanın (Docker Compose’ta varsayılan açık; üretimde nginx veya S3 tercih edin). Birden fazla API süreci veya konteyner kullanıyorsanız `AWS_STORAGE_BUCKET_NAME` ile S3 uyumlu depolama açın (bkz. `.env.example`).

## Silme ve geçmiş

- **django-safedelete:** `Hat`, `District`, `Event`, `EventReport` yumuşak silinir (`deleted` zaman damgası). Varsayılan sorgular silinmiş kayıtları dışlar; admin’de **Deleted** filtresi ile görülebilir. `Event` politikası **SOFT_DELETE_CASCADE**: etkinlik silindiğinde ilişkili rapor da yumuşak silinir. Admin’de: **Seçilenleri sil** → yumuşak sil; **Seçilenleri geri yükle** → geri al; **Seçilen yumuşak silinmişleri kalıcı sil** → yalnızca çöptekileri DB’den siler; **Seçilenleri kalıcı sil (tamamen kaldır)** → seçilenleri (aktif veya silinmiş) veritabanından tamamen kaldırır — dikkatli kullanın.
- **django-simple-history:** Aynı modeller için `Historical*` tabloları tutulur; admin’de kayıt sayfasından **History** ile sürüm geçmişi. `HistoryRequestMiddleware` ile (giriş yapmış kullanıcıda) değişiklik yapan kullanıcı kaydedilir.

## Next.js ile bağlama

1. `.env.local`: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
2. `fetch` çağrılarında JWT ve `credentials` / CORS uyumu (`CORS_ALLOWED_ORIGINS`).

Harita araması şu an Next.js içinde `/api/geocode` proxy ile kalabilir; isterseniz aynı mantığı Django’ya taşıyabilirsiniz.
