# Üretim API görüntüsü — collectstatic için geçici DEBUG ve COLLECTSTATIC_FOR_PROD kullanılır.
FROM python:3.12-slim

# Varsayılan C locale ile psycopg2/UTF-8 string bazen surrogate hatası verir (createsuperuser vb.).
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PYTHONUTF8=1
ENV PYTHONIOENCODING=utf-8

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=config.settings
RUN COLLECTSTATIC_FOR_PROD=1 DEBUG=True \
    SECRET_KEY=collectstatic-build-only-not-for-production-xxxxxxxx \
    python manage.py collectstatic --noinput

EXPOSE 8000
# Uzun multipart (rapor görselleri); header alanı sınırı UTF-8 dosya adları için gevşetildi
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "--graceful-timeout", "30", "--limit-request-field_size", "65536"]
