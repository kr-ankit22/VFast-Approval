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
      console.log("Google Auth Strategy: GOOGLE_CALLBACK_URL used:", process.env.GOOGLE_CALLBACK_URL);
      const email = profile.emails?.[0]?.value;
      console.log("Google Auth: Extracted email from profile:", email);

      if (!email) {
        console.log("Google Auth: Email not found in Google profile.");
        return done(new Error('Email not found in Google profile'), undefined);
      }

      if (!email.endsWith('@pilani.bits-pilani.ac.in')) {
        console.log("Google Auth: Email domain mismatch for:", email);
        return done(new Error('Only BITS Pilani emails are allowed'), undefined);
      }

      try {
        let user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        console.log("Google Auth: User found by email:", user);

        if (user) {
          if (!user.googleId) {
            console.log("Google Auth: Updating googleId for user:", user.id);
            await db.update(users).set({ googleId: profile.id }).where(eq(users.id, user.id));
          }
          console.log("Google Auth: Successfully authenticated user:", user.id);
          return done(null, user);
        } else {
          console.log("Google Auth: User not found in DB for email:", email);
          return done(new Error('User not found. Please contact an administrator.'), undefined);
        }
      } catch (error) {
        console.error("Google Auth: Error during authentication:", error);
        return done(error, undefined);
      }
    }
  )
);

export default passport;
