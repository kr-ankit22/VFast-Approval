import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import ConnectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { db, pool } from "./db";
import { initializeStorage, IStorage } from "./storage";
import { sql } from "drizzle-orm";
import { log } from "./vite";
import "./google-auth"; // Import the Google authentication strategy
import "./auth"; // Import the local authentication strategy

const PgStore = ConnectPgSimple(session);

export async function createApp(): Promise<{ app: express.Express, storage: IStorage }> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/uploads', express.static('uploads'));

  try {
    app.use(
      session({
        store: new PgStore({
          pool: pool,
          tableName: "user_sessions",
        }),
        secret: process.env.SESSION_SECRET || "a-secret-key-for-sessions",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
      })
    );
    console.log("PgStore (connect-pg-simple) initialized.");
  } catch (error) {
    console.error("Failed to initialize PgStore (connect-pg-simple):", error);
    process.exit(1); // Exit if session store cannot be initialized
  }

  app.use(passport.initialize());
  app.use(passport.session());

  try {
    await db.execute(sql`SELECT 1`);
    log("Database connection established.");
  } catch (error) {
    log("Failed to establish database connection:", error);
    process.exit(1);
  }

  const storage = initializeStorage(db, pool);
  await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  return { app, storage };
}
