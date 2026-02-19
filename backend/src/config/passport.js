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
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Google profilinden email al
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (!email) {
            return done(new Error('Google hesabından email alınamadı'), null);
          }

          // Kullanıcı zaten var mı kontrol et
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id }
          });

          // Eğer googleId ile bulunamazsa, email ile kontrol et
          if (!user) {
            user = await prisma.user.findUnique({
              where: { email }
            });

            // Email ile kullanıcı varsa, googleId'yi ekle
            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id }
              });
            }
          }

          // Hiç kullanıcı yoksa, yeni kullanıcı oluştur
          if (!user) {
            const displayName = profile.displayName || email.split('@')[0];
            
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email: email,
                fullName: displayName,
                username: null, // Google OAuth kullanıcıları için username opsiyonel
                password: null, // Google OAuth kullanıcıları için şifre yok
                role: 'RESTAURANT_OWNER'
              }
            });
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
