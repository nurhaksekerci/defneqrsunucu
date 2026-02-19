# ✅ GitHub'a Push Etmeden Önce KESİNLİKLE KONTROL EDİN!

## 🚨 KRİTİK GÜVENLİK KONTROL LİSTESİ

### 1. ❌ ASLA GitHub'a Gönderilmemeli:

- [ ] `.env` dosyası (✅ .gitignore'da var)
- [ ] `.env.local` dosyası (✅ .gitignore'da var)
- [ ] Gerçek şifreler
- [ ] API anahtarları (Google OAuth, Sentry, vs.)
- [ ] JWT Secret'lar
- [ ] SMTP şifreleri
- [ ] SSL sertifikaları (*.pem, *.key)
- [ ] Database backup'ları (*.sql)
- [ ] Uploads klasörü (✅ .gitignore'da var)

### 2. ✅ .env Dosyası Kontrolü

**ŞU AN .env DOSYANIZDA GERÇEK BİLGİLER VAR!**

```bash
# Kontrol et
cat .env

# .env'in git'e eklenmediğini doğrula
git status

# Eğer .env görünüyorsa HEMEN ÇIKAR:
git rm --cached .env
```

### 3. ✅ .env.example Güncel mi?

`.env.example` dosyası placeholder değerlerle güncellenmeli:

```env
# ❌ YANLIŞ (gerçek değerler - ÖRNEK)
SMTP_PASS=MyRealPassword123
GOOGLE_CLIENT_SECRET=GOCSPX-RealSecretKeyHere

# ✅ DOĞRU (placeholder)
SMTP_PASS=your-smtp-password-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### 4. ✅ Git Kontrolü

```bash
# .gitignore'u kontrol et
cat .gitignore

# Git durumunu kontrol et
git status

# .env dosyası GÖRÜNMEMELI!
# Eğer görünüyorsa DURUN ve düzeltin!
```

### 5. ✅ README Güncel mi?

- [ ] Kurulum talimatları doğru
- [ ] .env.example'dan kopyalama talimatları var
- [ ] Güvenlik notları eklendi
- [ ] Production deployment rehberi var

## 📝 İlk Commit Öncesi Checklist

### Adım 1: .env Kontrolü
```bash
# .env'in git'e eklenmediğini kontrol et
git status | grep ".env"

# Çıktı boş olmalı! Eğer .env görünüyorsa:
git rm --cached .env
git rm --cached frontend/.env.local
```

### Adım 2: Hassas Bilgileri Temizle
```bash
# .env.example'ı kontrol et
cat .env.example

# Gerçek şifreler/anahtarlar varsa placeholder'larla değiştir
```

### Adım 3: .gitignore Kontrolü
```bash
cat .gitignore | grep -E "\.env|uploads|logs|ssl"
```

Şu satırlar MUTLAKA olmalı:
```
.env
.env.local
**/.env
**/uploads/
**/logs/
nginx/ssl/*.pem
nginx/ssl/*.key
```

### Adım 4: Test Commit (Güvenli)
```bash
# Stage all files
git add .

# Staged dosyaları kontrol et
git status

# .env, uploads, logs, ssl GÖRÜNMEMELI!
# Eğer görünüyorsa:
git reset HEAD .env
git reset HEAD backend/uploads/
git reset HEAD backend/logs/
git reset HEAD nginx/ssl/

# Commit yap
git commit -m "Initial commit: Defne Qr - QR Menu System"
```

### Adım 5: Remote Ekle
```bash
# GitHub repo oluştur (github.com'da)
# Sonra:
git remote add origin https://github.com/YOUR_USERNAME/defneqr.git

# Veya SSH:
git remote add origin git@github.com:YOUR_USERNAME/defneqr.git
```

### Adım 6: Push
```bash
# İlk push
git push -u origin main

# Veya master branch:
git push -u origin master
```

## 🔍 Push Sonrası Kontrol

1. **GitHub'da .env dosyasını ara:**
   - Repository'de "env" ara
   - `.env` dosyası GÖRÜNMEMELI!

2. **Hassas bilgileri ara:**
   - "password" ara
   - "secret" ara
   - Gerçek şifreler aranmalı (örn: "MyPassword123")
   - Hiçbir gerçek bilgi çıkmamalı!

3. **Public mi Private mı?**
   - Eğer gerçek bilgiler varsa repository'yi Private yapın
   - Settings → Danger Zone → Change visibility

## 🚨 EĞER HATA YAPTIYSAN

### Senaryo 1: .env'i Commit Ettin Ama Push Etmedin
```bash
# Son commit'i geri al
git reset HEAD~1

# .env'i çıkar
git rm --cached .env

# Tekrar commit
git add .
git commit -m "Initial commit: Defne Qr - QR Menu System"
```

### Senaryo 2: .env'i Push Ettin 😱
```bash
# 1. Repository'yi hemen Private yap (GitHub'da)

# 2. Hassas bilgileri HEMEN değiştir:
# - Database şifreleri
# - JWT Secret'lar
# - API anahtarları
# - SMTP şifreleri

# 3. Git history'den tamamen sil (TEHLİKELİ!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (SADECE ilk push sonrası!)
git push origin --force --all

# 5. TÜM hassas bilgileri değiştir!
```

### Senaryo 3: Public Repo'da Hassas Bilgi Var
1. **HEMEN Repository'yi Private yap**
2. **TÜM şifreleri ve anahtarları değiştir**
3. **GitHub'a bildirme linki:** https://github.com/contact
4. **Git history'den temizle (yukarıdaki komut)**

## ✅ Güvenli Push Komutları

```bash
# 1. Son kontrol
git status
git diff --staged

# 2. .env kontrolü
git ls-files | grep ".env"
# Çıktı boş olmalı!

# 3. Commit
git add .
git commit -m "Initial commit: Defne Qr - QR Menu System"

# 4. Push
git push -u origin main
```

## 📚 Yararlı Git Komutları

```bash
# Staged dosyaları göster
git diff --staged --name-only

# Belirli bir dosyanın staged olup olmadığını kontrol et
git ls-files --stage | grep ".env"

# .gitignore'u test et
git check-ignore -v .env
# Çıktı: .gitignore:6:.env  .env

# Belirli bir dosyayı stage'den çıkar
git reset HEAD .env

# Tüm stage'i temizle
git reset HEAD .
```

## 🎯 Özet: Push Öncesi 5 Saniye Kuralı

Push etmeden önce 5 saniye durun ve sorun:

1. ❓ `.env` dosyası git'e eklendi mi? → `git status | grep .env`
2. ❓ Gerçek şifreler var mı? → `git diff --staged | grep -i "password\|secret"`
3. ❓ API anahtarları var mı? → `git diff --staged | grep -i "key\|token"`
4. ❓ .gitignore doğru mu? → `cat .gitignore`
5. ❓ Public repo mu? → Hassas bilgi varsa Private yap

**Cevabınız "EVET" ise PUSH ETMEYİN!**

---

## 🔒 Production Deployment Notları

Repository'yi clone eden kişiler için:

1. `.env.example`'dan `.env` oluştur
2. Tüm placeholder'ları gerçek değerlerle değiştir
3. JWT Secret'ları güçlü rastgele değerlerle değiştir
4. Database şifrelerini güçlü yap
5. Google OAuth credential'larını kendi projenizden alın

## 📞 Yardım

Eğer yanlışlıkla hassas bilgi push ettiyseniz:
1. Repository'yi hemen Private yapın
2. TÜM hassas bilgileri değiştirin
3. Git history'den silin (yukarıdaki komutlar)
4. GitHub support'a bildirin

---

**⚠️ HATIRLATMA:** Bu checklist'i push etmeden önce MUTLAKA takip edin!
