import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import logger from './logger';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

logger.info("server/auth.ts: Initializing Passport strategies.");

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

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

logger.info({ secretOrKey: jwtOptions.secretOrKey ? "[SECRET_PRESENT]" : "[SECRET_MISSING]" }, "JWT Strategy: Using secretOrKey");

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    logger.info({ payload }, "JWT Strategy: Payload received");
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id),
      });

      if (user) {
        logger.info({ userId: user.id }, "JWT Strategy: User found");
        return done(null, user);
      } else {
        logger.warn("JWT Strategy: User not found for payload:", payload);
        return done(null, false);
      }
    } catch (error) {
      logger.error({ err: error }, "JWT Strategy: Error during user lookup");
      return done(error, false);
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
    logger.error({ err: error }, "Passport: Error deserializing user");
    done(error, undefined);
  }
});

export const authenticateJwt = passport.authenticate('jwt', { session: false });

export default passport;