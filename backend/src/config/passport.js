const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('🔐 Google OAuth Configuration:');
  console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
  console.log('   Callback URL:', process.env.GOOGLE_CALLBACK_URL);
  
  const googleConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    scope: ['profile', 'email'],
    passReqToCallback: false
  };
  
  console.log('📋 Final Google Strategy Config:');
  console.log('   clientID:', googleConfig.clientID?.substring(0, 30) + '...');
  console.log('   callbackURL:', googleConfig.callbackURL);
  console.log('   callbackURL length:', googleConfig.callbackURL?.length);
  console.log('   callbackURL bytes:', Buffer.from(googleConfig.callbackURL || '').toString('hex').substring(0, 100));
  
  const googleStrategy = new GoogleStrategy(
    googleConfig,
    async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('========================================');
          console.log('🎉 STEP 5: Google Token Exchange Başarılı!');
          console.log('   Access Token received:', accessToken?.substring(0, 30) + '...');
          console.log('   Profile ID:', profile.id);
          console.log('   Display Name:', profile.displayName);
          console.log('   Emails:', JSON.stringify(profile.emails));
          console.log('========================================');
          
          // Google profilinden email al
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (!email) {
            console.error('❌ Email bulunamadı!');
            return done(new Error('Google hesabından email alınamadı'), null);
          }

          console.log('📧 STEP 6: Email alındı:', email);
          console.log('🔍 STEP 7: Veritabanında kullanıcı aranıyor...');
          
          // Kullanıcı zaten var mı kontrol et
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id }
          });
          
          console.log('   GoogleId ile arama sonucu:', user ? 'BULUNDU' : 'BULUNAMADI');

          // Eğer googleId ile bulunamazsa, email ile kontrol et
          if (!user) {
            console.log('   Email ile aranıyor:', email);
            user = await prisma.user.findUnique({
              where: { email }
            });

            // Email ile kullanıcı varsa, googleId'yi ekle
            if (user) {
              console.log('✅ Email ile bulundu! GoogleId ekleniyor...');
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id }
              });
              console.log('   GoogleId güncellendi:', user.id);
            }
          }

          // Hiç kullanıcı yoksa, yeni kullanıcı oluştur
          if (!user) {
            const displayName = profile.displayName || email.split('@')[0];
            console.log('🆕 STEP 8: Yeni kullanıcı oluşturuluyor...');
            console.log('   Email:', email);
            console.log('   Full Name:', displayName);
            console.log('   GoogleId:', profile.id);
            
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: email,
                fullName: displayName,
                username: null,
                password: null,
                role: 'RESTAURANT_OWNER'
              }
            });
            console.log('✅ Kullanıcı oluşturuldu! ID:', user.id);
          }

          console.log('========================================');
          console.log('✅ STEP 9: Passport Strategy Tamamlandı');
          console.log('   User:', user.email, '(ID:', user.id + ')');
          console.log('========================================');
          return done(null, user);
        } catch (error) {
          console.error('========================================');
          console.error('❌ PASSPORT STRATEGY ERROR!');
          console.error('   Error message:', error.message);
          console.error('   Error name:', error.name);
          console.error('   Error stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
          console.error('========================================');
          return done(error, null);
        }
      }
    )
  );

  // Wrap OAuth2 client to log token exchange requests
  const originalGetOAuthAccessToken = googleStrategy._oauth2.getOAuthAccessToken.bind(googleStrategy._oauth2);
  googleStrategy._oauth2.getOAuthAccessToken = function(code, params, callback) {
    console.log('========================================');
    console.log('🔐 STEP 3.5: Token Exchange Request to Google');
    console.log('   Code (first 30 chars):', code?.substring(0, 30) + '...');
    console.log('   Code length:', code?.length);
    console.log('   Params:', JSON.stringify(params, null, 2));
    console.log('   Client ID:', this._clientId?.substring(0, 35) + '...');
    console.log('   Client Secret:', this._clientSecret ? '***' + this._clientSecret.substring(this._clientSecret.length - 4) : 'NOT SET');
    console.log('   Token URL:', this._baseSite + this._getAccessTokenUrl);
    console.log('========================================');
    
    return originalGetOAuthAccessToken(code, params, (err, accessToken, refreshToken, params) => {
      if (err) {
        console.log('========================================');
        console.log('❌ STEP 3.6: Google Token Exchange FAILED');
        console.log('   Error:', JSON.stringify(err, null, 2));
        console.log('========================================');
      } else {
        console.log('========================================');
        console.log('✅ STEP 3.6: Google Token Exchange SUCCESS');
        console.log('   Access Token received:', accessToken?.substring(0, 30) + '...');
        console.log('========================================');
      }
      callback(err, accessToken, refreshToken, params);
    });
  };

  passport.use(googleStrategy);
}

module.exports = passport;
