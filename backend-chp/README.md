# CHP İstanbul — Django API

Django 5 + Django REST Framework. Mobil uygulama (`../`) ile uyumlu JSON alan adları (camelCase).

## DefneQr sunucusu (Docker)

Kök `docker-compose.yml` içinde **`backend-chp`** servisi tanımlıdır; veritabanı **`defneqr_chp`** (aynı Postgres içinde ayrı DB).

- **Domain:** `https://api-chp.defneqr.com` → Nginx → `backend-chp:8000`
- **Kök:** `docker compose up -d --build backend-chp`
- İlk kurulum / güncelleme sonrası:

```bash
docker compose exec backend-chp python manage.py migrate
```

Üretimde kök `.env` içinde güvenli anahtarlar (ör. `CHP_DJANGO_SECRET_KEY`, `DB_PASSWORD`) kullanın.

Mevcut Postgres’te `defneqr_chp` yoksa (init script’i ilk kurulumda çalıştıysa):

```bash
docker compose exec postgres psql -U defneqr -d postgres -c "CREATE DATABASE defneqr_chp;"
```

## Kurulum (geliştirme)

```bash
cd backend-chp
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
python manage.py runserver
```

- Admin: http://127.0.0.1:8000/admin/  
- API kökü: http://127.0.0.1:8000/api/

**Örnek kullanıcı (seed):** `demo` / `demo12345`

## PostgreSQL (üretim)

Ortam değişkenleri:

- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`

Ayarlanmazsa SQLite (`db.sqlite3`) kullanılır.

## Uçlar (özet)

| Yöntem | Yol | Açıklama |
|--------|-----|----------|
| GET | `/api/feed/` | Akış; `?district=zeytinburnu&category=mahalle_saha` |
| GET | `/api/posts/<id>/` | Gönderi detayı |
| POST | `/api/posts/<id>/like/` | Beğeni (JSON: `{"liked": true}`) — Token gerekli |
| GET/POST | `/api/planned/` | Planlanan liste / yeni plan (POST: Token) |
| POST | `/api/planned/<id>/complete/` | Etkinliği tamamla (`multipart`: `images`, `caption`, `district_id`) — Token |
| GET | `/api/notifications/` | Bildirimler — Token |
| POST | `/api/auth/login/` | `username`, `password` → `{ "token": "..." }` |
| GET | `/api/meta/org-context/` | Örgüt bağlam etiketi |
| GET | `/api/meta/branches/` | Kol seçenekleri |

Yetkilendirme: `Authorization: Token <anahtar>`

Geliştirmede `DEBUG=True` iken CORS tüm origin’lere açıktır.

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DJANGO_SECRET_KEY` | Üretimde zorunlu |
| `DJANGO_DEBUG` | `false` üretimde |
| `DJANGO_ALLOWED_HOSTS` | Virgülle ayrılmış hostlar |
| `CORS_ALLOWED_ORIGINS` | `DEBUG=false` iken CORS listesi |

Medya dosyaları `media/` altında; geliştirmede `runserver` ile servis edilir.

## Expo / mobil istemci

Proje kökünde `.env` oluşturun (örnek: [`.env.example`](../.env.example)):

```env
EXPO_PUBLIC_API_URL=http://BILGISAYAR_LAN_IP:8000/api
```

Django’yu ağdan erişilebilir başlatın:

```bash
python manage.py runserver 0.0.0.0:8000
```

- **Android emülatör:** `http://10.0.2.2:8000/api`
- **iOS simülatör / aynı makine web:** `http://127.0.0.1:8000/api`
- **Fiziksel cihaz:** bilgisayarın yerel ağ IP’si (örn. `192.168.x.x`).
