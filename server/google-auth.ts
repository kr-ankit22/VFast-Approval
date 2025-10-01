import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import logger from './logger';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      // logger.info("Google Auth Strategy: GOOGLE_CLIENT_ID used:", process.env.GOOGLE_CLIENT_ID);
      // logger.info("Google Auth Strategy: GOOGLE_CLIENT_SECRET used:", process.env.GOOGLE_CLIENT_SECRET);
      // logger.info("Google Auth Strategy: GOOGLE_CALLBACK_URL used:", process.env.GOOGLE_CALLBACK_URL);
      const email = profile.emails?.[0]?.value;
      // logger.info("Google Auth: Extracted email from profile:", email);

      if (!email) {
        // logger.warn("Google Auth: Email not found in Google profile.");
        return done(new Error('Email not found in Google profile'), undefined);
      }

      if (!email.endsWith('@pilani.bits-pilani.ac.in')) {
        // logger.warn("Google Auth: Email domain mismatch for:", email);
        return done(new Error('Only BITS Pilani emails are allowed'), undefined);
      }

      try {
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        // logger.info({ user }, "Google Auth: User found by email:");

        if (user) {
          if (!user.googleId) {
            // logger.info("Google Auth: Updating googleId for user:", user.id);
            await db.update(users).set({ googleId: profile.id }).where(eq(users.id, user.id));
          }
          // logger.info("Google Auth: Successfully authenticated user:", user.id);
          return done(null, user);
        } else {
          // logger.warn("Google Auth: User not found in DB for email:", email);
          return done(new Error('User not found. Please contact an administrator.'), undefined);
        }
      } catch (error) {
        // logger.error("Google Auth: Error during authentication:", error);
        return done(error, undefined);
      }
    }
  )
);

export default passport;
