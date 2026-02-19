# Docker ile Test Çalıştırma Kılavuzu

Bu döküman, Defne Qr projesinde Docker kullanarak testlerin nasıl çalıştırılacağını açıklar.

---

## 🚀 Hızlı Başlangıç

### Yöntem 1: Container Dışında (Önerilen - Sunucuda)

```bash
# Backend testleri
cd /opt/defneqr/backend
npm install
npm test

# Frontend testleri
cd /opt/defneqr/frontend
npm install
npm test
```

**Avantajlar:**
- Hızlı ve basit
- Docker rebuild gerektirmez
- Development ve production arasında izolasyon

---

## 🐳 Yöntem 2: Docker ile Test Container'ları

### Kurulum

```bash
cd /opt/defneqr

# Test container'larını build et
docker compose -f docker-compose.test.yml build

# Test database'i başlat
docker compose -f docker-compose.test.yml up -d postgres-test
```

### Testleri Çalıştırma

#### Otomatik Test Script (Önerilen)

```bash
# Tüm testleri çalıştır
chmod +x test.sh
./test.sh all

# Sadece backend testleri
./test.sh backend

# Sadece frontend testleri
./test.sh frontend
```

#### Manuel Docker Compose Komutları

```bash
# Backend testleri
docker compose -f docker-compose.test.yml run --rm backend-test

# Frontend testleri
docker compose -f docker-compose.test.yml run --rm frontend-test

# Belirli bir test dosyası
docker compose -f docker-compose.test.yml run --rm backend-test npm test -- auth.unit.test.js

# Watch mode
docker compose -f docker-compose.test.yml run --rm backend-test npm run test:watch

# Coverage raporu
docker compose -f docker-compose.test.yml run --rm backend-test npm test -- --coverage
```

### Temizlik

```bash
# Test container'larını durdur ve sil
docker compose -f docker-compose.test.yml down -v

# Test volumes'lerini de sil
docker compose -f docker-compose.test.yml down -v --remove-orphans
```

---

## 🔧 Yöntem 3: Mevcut Container'da Test (Önerilmez)

⚠️ **Dikkat**: Production container'ları `devDependencies` içermez!

```bash
# Container'a gir
docker compose exec backend sh

# devDependencies'i yükle (sadece test için)
npm install --include=dev

# Testleri çalıştır
npm test

# Çık ve container'ı restart et (devDependencies'i temizler)
exit
docker compose restart backend
```

---

## 📊 CI/CD ile Test (GitHub Actions)

En iyi yaklaşım: **Testleri CI/CD pipeline'da çalıştırın**

`.github/workflows/tests.yml` otomatik olarak çalışır:
- Her push'ta
- Her pull request'te
- Isolated test environment
- Coverage reports

**Sunucuda manuel test gereksiz olur!**

---

## 🎯 Hangi Yöntemi Kullanmalıyım?

### Development (Lokal)
```bash
cd backend && npm test
cd frontend && npm test
```
✅ **En hızlı ve pratik**

### Sunucu (Production)
```bash
# CI/CD kullanın (GitHub Actions)
git push  # Otomatik testler çalışır
```
✅ **En güvenli ve otomatik**

### Docker Gerekiyorsa
```bash
./test.sh all
```
✅ **Tam izolasyon, production environment benzer**

---

## 🐛 Sorun Giderme

### "devDependencies not found"
```bash
# Test Dockerfile kullanın (Dockerfile.test)
docker compose -f docker-compose.test.yml build --no-cache backend-test
```

### Test Database bağlantı hatası
```bash
# Test DB'nin çalıştığından emin olun
docker compose -f docker-compose.test.yml ps postgres-test

# Yeniden başlat
docker compose -f docker-compose.test.yml restart postgres-test
```

### Port conflict (5432 kullanımda)
Test DB farklı port kullanır: `5433`
```bash
# Test DB'ye bağlan
psql -h localhost -p 5433 -U defneqr -d defneqr_test
```

### Tests pass locally but fail in Docker
```bash
# Environment variables kontrol et
docker compose -f docker-compose.test.yml config

# Logs'u incele
docker compose -f docker-compose.test.yml logs backend-test
```

---

## 📝 Test Komutları Özet

| Komut | Açıklama |
|-------|----------|
| `npm test` | Tüm testleri çalıştır |
| `npm run test:watch` | Watch mode |
| `npm run test:unit` | Sadece unit testler |
| `npm run test:integration` | Sadece integration testler |
| `npm run test:ci` | CI için (parallel disabled) |

---

## 🎬 Önerilen Workflow

### Development
1. Kod değişikliği yap
2. `npm test` ile testleri çalıştır
3. Commit yap
4. GitHub Actions otomatik test çalıştırır

### Production Deployment
1. GitHub Actions'daki testler geçsin
2. Merge to main
3. Deploy to production
4. **Manuel test gereksiz!**

---

## 💡 Pro Tips

- ✅ **CI/CD kullanın** - En güvenilir yöntem
- ✅ **Test container'ları izole** - Production'ı etkilemez
- ✅ **Coverage raporlarına bakın** - `coverage/` klasöründe
- ⚠️ **Production container'da test çalıştırmayın**
- ⚠️ **Test DB ayrı tutun** - `defneqr_test` database kullanın
