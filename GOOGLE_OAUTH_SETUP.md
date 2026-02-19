# Google OAuth Kurulum Rehberi

Bu rehber, Google OAuth entegrasyonunu kurmak için gerekli adımları açıklar.

## 1. Google Cloud Console'da Proje Oluşturma

1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Yeni bir proje oluşturun veya mevcut projeyi seçin
3. Sol menüden **APIs & Services** > **Credentials** seçeneğine tıklayın

## 2. OAuth 2.0 Client ID Oluşturma

1. **+ CREATE CREDENTIALS** butonuna tıklayın
2. **OAuth client ID** seçeneğini seçin
3. **Application type** olarak **Web application** seçin
4. **Name** alanına bir isim girin (örn: "Defne Qr Web")

### Authorized JavaScript origins

Development için:
```
http://localhost:5000
```

Production için:
```
https://yourdomain.com
```

### Authorized redirect URIs

Development için:
```
http://localhost:5000/api/auth/google/callback
```

Production için:
```
https://yourdomain.com/api/auth/google/callback
```

5. **Create** butonuna tıklayın
6. Client ID ve Client Secret'i kaydedin

## 3. Backend .env Dosyasını Güncelleme

`backend/.env` dosyasını açın ve şu değişkenleri güncelleyin:

```env
# OAuth (Google)
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Session Secret (güvenli bir random string)
SESSION_SECRET=your-secure-random-session-secret-here
```

## 4. Admin Settings'den Google OAuth'u Aktif Etme

1. Uygulamanızı başlatın
2. Admin hesabı ile giriş yapın
3. `http://localhost:3000/admin/settings` sayfasına gidin
4. **Kimlik Doğrulama** bölümünde **Google OAuth** toggle'ını açın
5. **Ayarları Kaydet** butonuna tıklayın

## 5. Test Etme

1. `http://localhost:3000/auth/login` veya `http://localhost:3000/auth/register` sayfasına gidin
2. **Google ile Giriş Yap** veya **Google ile Kayıt Ol** butonuna tıklayın
3. Google hesabınızı seçin ve izin verin
4. Başarılı girişten sonra dashboard'a yönlendirileceksiniz

## Güvenlik Notları

- **SESSION_SECRET**: Production ortamında güçlü, rastgele bir string kullanın
- **GOOGLE_CLIENT_SECRET**: Bu değeri asla public repository'lerde paylaşmayın
- Production'da HTTPS kullanın
- CORS ayarlarını production domain'inize göre güncelleyin

## Sorun Giderme

### "redirect_uri_mismatch" Hatası
- Google Console'daki Authorized redirect URIs'nin backend URL'iniz ile tam olarak eşleştiğinden emin olun
- Protocol (http/https) ve port numarasını kontrol edin

### "access_denied" Hatası
- Kullanıcı Google hesap izinlerini reddetti
- OAuth consent screen yapılandırmasını kontrol edin

### Token alınamıyor
- Backend'in çalıştığından emin olun
- FRONTEND_URL ve GOOGLE_CALLBACK_URL değerlerinin doğru olduğunu kontrol edin
- Browser console'da hata mesajlarını kontrol edin

## Ek Bilgiler

### OAuth Flow
1. Kullanıcı "Google ile Giriş Yap" butonuna tıklar
2. Backend'deki `/api/auth/google` endpoint'ine yönlendirilir
3. Google OAuth sayfası açılır
4. Kullanıcı Google hesabını seçer ve izin verir
5. Google, kullanıcıyı `/api/auth/google/callback` URL'ine yönlendirir
6. Backend, Google'dan kullanıcı bilgilerini alır
7. Kullanıcı veritabanında yoksa oluşturulur, varsa güncellenir
8. JWT token oluşturulur
9. Frontend'deki `/auth/callback` sayfasına token ile yönlendirilir
10. Frontend token'ı localStorage'a kaydeder ve kullanıcıyı uygun sayfaya yönlendirir

### Veritabanı Şeması
Google OAuth kullanıcıları için:
- `googleId`: Google'dan alınan unique user ID
- `email`: Google hesabından alınan email
- `password`: NULL (Google OAuth kullanıcıları şifre kullanmaz)
- `fullName`: Google profilinden alınan tam ad

Mevcut email'e sahip kullanıcı varsa, sadece `googleId` eklenir ve böylece kullanıcı hem normal login hem de Google OAuth ile giriş yapabilir.
