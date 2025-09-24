import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;

      if (!email) {
        return done(new Error('Email not found in Google profile'), undefined);
      }

      if (!email.endsWith('@bits-pilani.ac.in')) {
        return done(new Error('Only BITS Pilani emails are allowed'), undefined);
      }

      try {
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (user) {
          if (!user.googleId) {
            await db.update(users).set({ googleId: profile.id }).where(eq(users.id, user.id));
          }
          return done(null, user);
        } else {
          // This part should be controlled by the CSV upload feature as per the plan.
          // For now, we will not create a new user here.
          return done(new Error('User not found. Please contact an administrator.'), undefined);
        }
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

export default passport;
