const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./database');

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
  const googleConfig = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
    scope: ['profile', 'email'],
    passReqToCallback: true
  };

  const googleStrategy = new GoogleStrategy(
    googleConfig,
    async (req, accessToken, refreshToken, params, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
          return done(new Error('Google hesabından email alınamadı'), null);
        }

        let user = await prisma.user.findUnique({
          where: { googleId: profile.id }
        });

        if (!user) {
          user = await prisma.user.findUnique({
            where: { email }
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id }
            });
          }
        }

        if (!user) {
          const displayName = profile.displayName || email.split('@')[0];
          const isRandevu = req?.cookies?.oauth_return === 'randevu';
          const defaultRole = isRandevu ? 'BUSINESS_OWNER' : 'RESTAURANT_OWNER';

          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email: email,
              fullName: displayName,
              username: null,
              password: null,
              role: defaultRole
            }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  );

  passport.use(googleStrategy);
}

module.exports = passport;
