# CHP İstanbul — Etkinlik yönetimi

- **frontend/** — Next.js arayüzü (`npm run dev`, varsayılan `http://localhost:3000`)
- **backend/** — Django REST API (`manage.py runserver 8000`, ayrıntılar için [backend/README.md](backend/README.md))

İki servisi birlikte çalıştırdığınızda backend `.env` içinde `CORS_ALLOWED_ORIGINS` değerine frontend adresini ekleyin.

Üretim, Docker ve yedek/izleme başlıkları için [docs/DEPLOY.md](docs/DEPLOY.md).
