# JWT Token Security - Refresh Token & Blacklist Implementation

## ✅ Tamamlanan Özellikler

### 1. Short-Lived Access Tokens
- ✅ Access token: 15 dakika (önceden 7 gün idi - ÇOK RİSKLİ!)
- ✅ JWT ile imzalanmış
- ✅ Kullanıcı ID içeriyor

### 2. Long-Lived Refresh Tokens
- ✅ Refresh token: 7 gün
- ✅ Secure random token (40 byte hex)
- ✅ Database'de saklanıyor
- ✅ Device/browser tracking (user-agent, IP)
- ✅ Revoke edilebilir

### 3. Token Blacklist
- ✅ Logout'ta access token blacklist'e ekleniyor
- ✅ Middleware blacklist kontrolü yapıyor
- ✅ Expired token'lar otomatik temizleniyor

### 4. Auto Token Refresh
- ✅ Frontend 401 alınca otomatik refresh deniyor
- ✅ Request queue ile concurrent request'ler handle ediliyor
- ✅ Refresh başarısız olursa login'e yönlendirme

### 5. Multi-Device Session Management
- ✅ Aktif oturumları görüntüleme
- ✅ Tek cihazdan logout
- ✅ Tüm cihazlardan logout

### 6. Automatic Cleanup
- ✅ Her saat başı expired token temizliği
- ✅ Hem refresh token hem blacklist temizleniyor

## 🗄️ Database Schema

### RefreshToken Table
```prisma
model RefreshToken {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token      String   @unique
  expiresAt  DateTime
  isRevoked  Boolean  @default(false)
  revokedAt  DateTime?
  createdAt  DateTime @default(now())
  
  userAgent  String?  // Browser/device tracking
  ipAddress  String?  // IP tracking
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([isRevoked])
}
```

### TokenBlacklist Table
```prisma
model TokenBlacklist {
  id        String   @id @default(uuid())
  token     String   @unique
  expiresAt DateTime
  reason    String?  // logout, security, etc.
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([expiresAt])
}
```

## 📁 Oluşturulan/Güncellenen Dosyalar

### Backend

#### 1. Token Manager Utility
**`backend/src/utils/tokenManager.js`**
- `generateAccessToken()` - 15 dakika access token
- `generateRefreshToken()` - 7 gün refresh token + DB save
- `verifyAccessToken()` - Blacklist check + JWT verify
- `verifyRefreshToken()` - DB lookup + expiry check
- `revokeRefreshToken()` - Tek token revoke
- `revokeAllUserTokens()` - Tüm user token'larını revoke
- `blacklistAccessToken()` - Access token'ı blacklist'e ekle
- `cleanupExpiredTokens()` - Expired token'ları temizle
- `getUserActiveSessions()` - Aktif oturumları getir

#### 2. Auth Controller Updates
**`backend/src/controllers/auth.controller.js`**
- `register()` - Hem access hem refresh token dönüyor
- `login()` - Hem access hem refresh token dönüyor
- `logout()` - Token'ları revoke ediyor ve blacklist'e ekliyor
- `refreshToken()` - Yeni access token üretiyor (NEW)
- `logoutAll()` - Tüm cihazlardan logout (NEW)
- `getActiveSessions()` - Aktif oturumları listele (NEW)

#### 3. Auth Middleware Updates
**`backend/src/middleware/auth.middleware.js`**
- Blacklist kontrolü eklendi
- `tokenManager.verifyAccessToken()` kullanıyor

#### 4. Auth Routes Updates
**`backend/src/routes/auth.routes.js`**
- `POST /api/auth/refresh` - Yeni access token al
- `POST /api/auth/logout-all` - Tüm cihazlardan çık
- `GET /api/auth/sessions` - Aktif oturumlar

#### 5. Token Cleanup Scheduler
**`backend/src/utils/tokenCleanup.js`**
- Her saat başı otomatik cleanup
- `server.js`'de initialize ediliyor

#### 6. OAuth Controller Updates
**`backend/src/controllers/oauth.controller.js`**
- Google OAuth'da da refresh token dönüyor

### Frontend

#### 1. Auth Service Updates
**`frontend/src/lib/auth.ts`**
- `register()` - accessToken + refreshToken saklıyor
- `login()` - accessToken + refreshToken saklıyor
- `logout()` - refreshToken ile logout
- `logoutAll()` - Tüm cihazlardan logout (NEW)
- `refreshAccessToken()` - Yeni access token al (NEW)
- `getActiveSessions()` - Aktif oturumlar (NEW)

#### 2. API Interceptor Updates
**`frontend/src/lib/api.ts`**
- 401 alınca otomatik refresh deniyor
- Request queue ile concurrent request'ler handle ediliyor
- Refresh başarısız olursa login'e yönlendirme
- Infinite loop prevention

#### 3. OAuth Callback Updates
**`frontend/src/app/auth/callback/page.tsx`**
- Hem accessToken hem refreshToken parametrelerini handle ediyor

## 🔄 Token Flow

### Normal Login Flow
```
1. User → POST /auth/login
2. Backend:
   - Validate credentials
   - Generate accessToken (15min)
   - Generate refreshToken (7 days) + save to DB
   - Return both tokens
3. Frontend:
   - Save accessToken to localStorage
   - Save refreshToken to localStorage
   - Set accessToken in API headers
```

### API Request Flow
```
1. Frontend → API Request (with accessToken)
2. Middleware:
   - Check if token blacklisted
   - Verify JWT signature
   - Check expiration
3a. Token valid → Process request
3b. Token invalid/expired → Return 401
```

### Auto Refresh Flow
```
1. API returns 401 (token expired)
2. Frontend interceptor:
   - Detect 401
   - Get refreshToken from localStorage
   - POST /auth/refresh with refreshToken
3. Backend:
   - Verify refreshToken (DB lookup)
   - Check if revoked
   - Check expiration
   - Generate new accessToken
4. Frontend:
   - Save new accessToken
   - Retry original request
```

### Logout Flow
```
1. User → Logout button
2. Frontend:
   - POST /auth/logout with refreshToken
   - Send accessToken in header
3. Backend:
   - Revoke refreshToken in DB
   - Add accessToken to blacklist
4. Frontend:
   - Clear localStorage
   - Redirect to login
```

## 🔒 Güvenlik Özellikleri

### 1. Short-Lived Access Tokens
- **Problem**: 7 günlük token çalınırsa 7 gün kullanılabilir
- **Solution**: 15 dakikalık token, çalınsa bile 15 dakika risk
- **Impact**: Kullanıcı deneyimi etkilenmiyor (auto refresh)

### 2. Refresh Token Rotation (Optional)
```javascript
// Her refresh'te yeni refresh token üret
const { token: newRefreshToken } = await tokenManager.generateRefreshToken(/*...*/);
await tokenManager.revokeRefreshToken(oldRefreshToken);
return { accessToken, refreshToken: newRefreshToken };
```

### 3. Token Blacklist
- Logout sonrası token hala geçerli olabilir (JWT'nin dezavantajı)
- Blacklist ile revoke edilen token'lar kullanılamaz
- Expired token'lar otomatik temizleniyor (DB space optimization)

### 4. Device/Browser Tracking
- Hangi cihazdan giriş yapıldığı kaydediliyor
- Şüpheli oturum tespiti
- Kullanıcı oturumlarını görebilir

### 5. Cascade Delete
- Kullanıcı silinince tüm token'ları otomatik silinir
- Database integrity

## 📊 API Endpoints

### 1. Login (Updated)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "eyJhbGci...",
    "refreshToken": "a1b2c3d4..."
  }
}
```

### 2. Refresh Token (NEW)
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

### 3. Logout (Updated)
```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4..."
}

Response:
{
  "success": true,
  "message": "Çıkış başarılı"
}
```

### 4. Logout All (NEW)
```http
POST /api/auth/logout-all
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "message": "Tüm cihazlardan çıkış yapıldı. 3 oturum sonlandırıldı."
}
```

### 5. Get Active Sessions (NEW)
```http
GET /api/auth/sessions
Authorization: Bearer {accessToken}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-02-18T19:00:00.000Z",
      "expiresAt": "2026-02-25T19:00:00.000Z"
    }
  ]
}
```

## 🧪 Test Scenarios

### 1. Normal Login & Use
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Use access token (valid for 15 min)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {accessToken}"
```

### 2. Token Refresh
```bash
# Wait 16 minutes (access token expired)
# Request with expired access token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {expiredAccessToken}"
# Returns 401

# Refresh token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"{refreshToken}"}'
# Returns new accessToken

# Use new access token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {newAccessToken}"
# Works!
```

### 3. Logout & Token Revocation
```bash
# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"{refreshToken}"}'

# Try to use revoked token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer {accessToken}"
# Returns 401 (blacklisted)

# Try to refresh with revoked refresh token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"{refreshToken}"}'
# Returns 401 (revoked)
```

### 4. Multi-Device Sessions
```bash
# Login from device 1
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Device1" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# Get accessToken1, refreshToken1

# Login from device 2
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Device2" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# Get accessToken2, refreshToken2

# Check active sessions
curl http://localhost:5000/api/auth/sessions \
  -H "Authorization: Bearer {accessToken1}"
# Shows 2 sessions

# Logout all devices
curl -X POST http://localhost:5000/api/auth/logout-all \
  -H "Authorization: Bearer {accessToken1}"

# Both tokens now revoked
```

## ⚡ Performance Considerations

### 1. Database Queries
- Indexed columns: token, userId, expiresAt, isRevoked
- Efficient lookups: O(log n)
- Cleanup reduces DB size

### 2. Memory Usage
- Request queue in API interceptor
- Cleared after refresh completes
- Prevents memory leaks

### 3. Network Overhead
- Extra refresh call when token expires
- But only once per 15 minutes
- Minimal impact

## 🔧 Configuration

### Environment Variables
```env
# Access token expiration (default: 15m)
JWT_EXPIRE=15m

# JWT secret for signing
JWT_SECRET=your-super-secret-key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### Customization
```javascript
// Change access token expiration
// backend/src/utils/tokenManager.js
exports.generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30m' // Increase to 30 minutes
  });
};

// Change refresh token expiration
// backend/src/utils/tokenManager.js
const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

// Change cleanup interval
// backend/src/utils/tokenCleanup.js
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // Daily instead of hourly
```

## 🎯 Security Best Practices Implemented

✅ **Short-lived access tokens** (15 min vs 7 days)
✅ **Refresh token mechanism** (seamless UX)
✅ **Token revocation** (logout works properly)
✅ **Token blacklist** (extra security layer)
✅ **Device tracking** (multi-device awareness)
✅ **Automatic cleanup** (DB optimization)
✅ **Auto refresh** (user doesn't notice expiration)
✅ **Concurrent request handling** (no race conditions)
✅ **Cascade delete** (data integrity)
✅ **Index optimization** (fast queries)

## 🚀 Production Deployment Notes

### 1. Environment Variables
- Set strong JWT_SECRET (32+ chars random)
- Set strong SESSION_SECRET
- Configure proper FRONTEND_URL

### 2. HTTPS Required
- Refresh tokens should only be transmitted over HTTPS in production
- Configure `secure: true` for cookies

### 3. Monitoring
- Track token refresh frequency
- Alert on high revocation rates (possible attack)
- Monitor cleanup job success

### 4. Backup Strategy
- Refresh tokens can be regenerated (no backup needed)
- But track active sessions for user transparency

## 📈 Impact

**Before:**
- ❌ Access token: 7 days (very risky if stolen)
- ❌ No token revocation
- ❌ Logout didn't actually invalidate token
- ❌ Stolen token = 7 days of unauthorized access

**After:**
- ✅ Access token: 15 minutes (minimal risk window)
- ✅ Refresh token: Revokable
- ✅ Logout properly invalidates tokens
- ✅ Stolen access token = max 15 min access
- ✅ Stolen refresh token = Can be revoked
- ✅ Multi-device awareness
- ✅ Seamless UX (auto refresh)

## 🎉 Sonuç

JWT Token security başarıyla production-ready hale getirildi! Artık OWASP standartlarına uygun bir authentication sisteminiz var.

**Next Steps:**
- Frontend UI için session management sayfası (opsiyonel)
- Email notification on new device login (opsiyonel)
- Anomaly detection (opsiyonel)
