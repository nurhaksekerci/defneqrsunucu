# GitHub Actions Workflows

Bu klasör, Defne Qr projesi için CI/CD pipeline'larını içerir.

## 📄 Mevcut Workflow'lar

### `tests.yml` - Otomatik Test Pipeline

**Tetikleme:**
- `main` ve `develop` branch'lerine push
- Pull request oluşturulduğunda

**İşlemler:**
1. **Backend Tests**: Unit ve integration testler
2. **Frontend Tests**: Component ve utility testler
3. **E2E Tests**: Playwright ile end-to-end testler
4. **Test Summary**: Tüm test sonuçlarının özeti

**Gereksinimler:**
- PostgreSQL service (backend testler için)
- Node.js 20
- Playwright browsers (E2E testler için)

## 🔧 Kurulum

GitHub repository'nizde otomatik olarak çalışır. Ek kurulum gerekmez.

## 📊 Test Coverage

Coverage raporları Codecov'a yüklenir. Codecov entegrasyonu için:

1. [Codecov](https://codecov.io/) hesabı oluşturun
2. Repository'nizi ekleyin
3. `CODECOV_TOKEN` secret'ını GitHub'a ekleyin (Settings > Secrets)

## ⚙️ Environment Variables

GitHub Secrets olarak eklenmelidir:
- `DATABASE_URL` (test DB için - optional, default kullanılır)
- `CODECOV_TOKEN` (coverage upload için - optional)

## 🚨 Badge Ekleme

README.md'ye test status badge eklemek için:

```markdown
![Tests](https://github.com/YOUR_USERNAME/defneqr/workflows/Tests/badge.svg)
```

## 📝 Notlar

- E2E testler sadece Chromium'da çalışır (CI performansı için)
- Test sonuçları 7 gün saklanır
- Başarısız testler pipeline'ı durdurur
