import 'dotenv/config'; // Ensure environment variables are loaded first
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import ConnectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { db, pool } from "./db";
import { initializeStorage, IStorage } from "./storage";
import { sql } from "drizzle-orm";
import logger from "./logger";
import "./google-auth"; // Import the Google authentication strategy
import "./auth"; // Import the local authentication strategy
import jwt from 'jsonwebtoken';
import cors from 'cors';

const PgStore = ConnectPgSimple(session);

export async function createApp(): Promise<{ app: express.Express, storage: IStorage }> {
  const app = express();
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow requests from your frontend origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies to be sent
    allowedHeaders: "Content-Type,Authorization", // Explicitly allow Authorization header
  }));
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
    // logger.info("PgStore (connect-pg-simple) initialized.");
  } catch (error) {
    // logger.error({ err: error }, "Failed to initialize PgStore (connect-pg-simple):");
    throw error; // Propagate the error to the caller
  }

  app.use(passport.initialize());



  app.use((req: Request, res: Response, next: NextFunction) => {
    if ((req as any).skipSession) {
      return next();
    }
    passport.session()(req, res, next);
  });

  try {
    await db.execute(sql`SELECT 1`);
    // logger.info("Database connection established.");
  } catch (error) {
    // logger.error({ err: error }, "Failed to establish database connection:");
    throw error;
  }

  const storage = initializeStorage(db, pool);
  await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // logger.error(err);
    res.status(status).json({ message });
  });

  return { app, storage };
}