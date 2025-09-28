import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Local Strategy
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }

      if (!user.password) {
        return done(null, false, { message: 'User registered via OAuth, please use Google login.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user into the session
passport.serializeUser((user: any, done) => {

  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id, 10)),
    });

    done(null, user);
  } catch (error) {
    console.error("Passport: Error deserializing user:", error);
    done(error, undefined);
  }
});

export default passport;