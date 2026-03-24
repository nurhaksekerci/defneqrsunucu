"""
Django ayarları — CHP İstanbul etkinlik / rapor API.
"""

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

_DEFAULT_SECRET_FALLBACK = "django-insecure-dev-only-change-me"
SECRET_KEY = os.getenv("SECRET_KEY", _DEFAULT_SECRET_FALLBACK)

DEBUG = os.getenv("DEBUG", "True").lower() in ("1", "true", "yes")

# Yerel disk medyası (DEBUG=False): varsayılan olarak URL'de sunulmaz. Docker Compose / iç ağ
# için True yapılabilir. Gerçek üretimde nginx veya S3 tercih edin.
SERVE_MEDIA = os.getenv("SERVE_MEDIA", "").lower() in ("1", "true", "yes")

COLLECTSTATIC_FOR_PROD = os.getenv("COLLECTSTATIC_FOR_PROD", "").lower() in (
    "1",
    "true",
    "yes",
)


def _staticfiles_storage_backend() -> str:
    if COLLECTSTATIC_FOR_PROD or not DEBUG:
        return "whitenoise.storage.CompressedManifestStaticFilesStorage"
    return "django.contrib.staticfiles.storage.StaticFilesStorage"


if not DEBUG:
    if SECRET_KEY == _DEFAULT_SECRET_FALLBACK or "django-insecure" in SECRET_KEY.lower():
        raise ImproperlyConfigured(
            "Üretimde güvenli bir SECRET_KEY tanımlayın (en az 40 karakter, repoda saklamayın)."
        )
    if len(SECRET_KEY) < 40:
        raise ImproperlyConfigured("Üretimde SECRET_KEY en az 40 karakter olmalıdır.")

    if not os.getenv("DATABASE_ENGINE", "").strip():
        raise ImproperlyConfigured(
            "DEBUG=False iken PostgreSQL gerekir: DATABASE_ENGINE ve DATABASE_* değişkenlerini ayarlayın."
        )

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "simple_history",
    "safedelete",
    "org",
    "accounts.apps.AccountsConfig",
    "events",
]

USE_S3_MEDIA = bool(os.getenv("AWS_STORAGE_BUCKET_NAME", "").strip())
if USE_S3_MEDIA:
    INSTALLED_APPS.append("storages")

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Veritabanı: varsayılan SQLite; PostgreSQL için .env ile ENGINE/NAME/USER/PASSWORD/HOST/PORT
if os.getenv("DATABASE_ENGINE"):
    DATABASES = {
        "default": {
            "ENGINE": os.getenv(
                "DATABASE_ENGINE", "django.db.backends.postgresql"
            ),
            "NAME": os.getenv("DATABASE_NAME", "chpistanbul"),
            "USER": os.getenv("DATABASE_USER", "postgres"),
            "PASSWORD": os.getenv("DATABASE_PASSWORD", ""),
            "HOST": os.getenv("DATABASE_HOST", "localhost"),
            "PORT": os.getenv("DATABASE_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "tr"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Rapor: çoklu görsel + multipart (Docker’da varsayılan 2.5MB sınırı yetmez)
DATA_UPLOAD_MAX_MEMORY_SIZE = int(
    os.getenv("DATA_UPLOAD_MAX_MEMORY_SIZE", str(32 * 1024 * 1024))
)
FILE_UPLOAD_MAX_MEMORY_SIZE = int(
    os.getenv("FILE_UPLOAD_MAX_MEMORY_SIZE", str(32 * 1024 * 1024))
)
DATA_UPLOAD_MAX_NUMBER_FIELDS = int(os.getenv("DATA_UPLOAD_MAX_NUMBER_FIELDS", "4000"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS (Next.js varsayılan: localhost:3000)
_cors = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOWED_ORIGINS = [x.strip() for x in _cors.split(",") if x.strip()]

_csrf_origins = os.getenv("CSRF_TRUSTED_ORIGINS", "").strip()
if _csrf_origins:
    CSRF_TRUSTED_ORIGINS = [
        x.strip() for x in _csrf_origins.split(",") if x.strip()
    ]
elif not DEBUG:
    CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)
else:
    CSRF_TRUSTED_ORIGINS = []

if not DEBUG:
    if os.getenv("USE_TLS_BEHIND_PROXY", "").lower() in ("1", "true", "yes"):
        SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").lower() in (
        "1",
        "true",
        "yes",
    )
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"

if USE_S3_MEDIA:
    AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "")
    AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "eu-central-1")
    AWS_S3_CUSTOM_DOMAIN = os.getenv("AWS_S3_CUSTOM_DOMAIN", "").strip() or None
    AWS_DEFAULT_ACL = None
    AWS_S3_FILE_OVERWRITE = False
    _s3_options: dict = {}
    if os.getenv("AWS_S3_ENDPOINT_URL", "").strip():
        _s3_options["endpoint_url"] = os.getenv("AWS_S3_ENDPOINT_URL", "").strip()
    _default_storage: dict = {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    }
    if _s3_options:
        _default_storage["OPTIONS"] = _s3_options
    STORAGES = {
        "default": _default_storage,
        "staticfiles": {"BACKEND": _staticfiles_storage_backend()},
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {"BACKEND": _staticfiles_storage_backend()},
    }

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S%z",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("DRF_THROTTLE_ANON", "120/hour"),
        "user": os.getenv("DRF_THROTTLE_USER", "600/hour"),
        "token_obtain": os.getenv("DRF_THROTTLE_TOKEN_OBTAIN", "15/minute"),
        "token_refresh": os.getenv("DRF_THROTTLE_TOKEN_REFRESH", "60/minute"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(asctime)s [%(levelname)s] %(name)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
    },
}
