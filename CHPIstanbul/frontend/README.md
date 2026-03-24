# CHP İstanbul — Ön yüz (CRM önizleme)

Next.js 16 (App Router) + Tailwind CSS v4. Veri şu an **statik örnek**; backend bağlantısı sonraki adımda.

## Çalıştırma

```bash
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL ile Django API kökünü ayarlayın
npm run dev
```

Üretim derlemesi: `npm run build` sonra `npm start`. `NEXT_PUBLIC_API_URL` build zamanında gömülür; staging ve canlı için ayrı ortam değişkeniyle ayrı build alın. Güvenlik başlıkları `next.config.ts` içindedir; JWT’nin `localStorage` ile tutulması ve CSP seçenekleri için [docs/DEPLOY.md](../docs/DEPLOY.md).

Docker: depo kökünde `docker compose up --build` ile **web** servisi [Dockerfile](Dockerfile) üzerinden ayağa kalkar (port 3000).

[http://localhost:3000](http://localhost:3000) — Pano  
[http://localhost:3000/giris](http://localhost:3000/giris) — Giriş ekranı önizlemesi

## Sayfalar

| Rota | Açıklama |
|------|----------|
| `/` | Pano (KPI kartları, son hareketler tablosu) |
| `/etkinlikler` | Planlanan / Tamamlanan sekmeleri |
| `/raporlar` | Rapor listesi |
| `/ayarlar` | Profil alanları (placeholder) |
| `/giris` | Kurumsal giriş düzeni |

## Kurumsal renkler ve tipografi

`src/app/globals.css` içinde nötr yüzeyler, `--chp-red` aksanı ve `--chp-navy` (sidebar) tanımlı. Yazı tipi: **IBM Plex Sans** (kurumsal veri arayüzleri için).
