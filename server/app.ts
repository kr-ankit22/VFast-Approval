import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { db, pool } from "./db";
import { initializeStorage, IStorage } from "./storage";
import { sql } from "drizzle-orm";
import { log } from "./vite";

export async function createApp(): Promise<{ app: express.Express, storage: IStorage }> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Custom logging middleware
  // app.use((req, res, next) => {
  //   const start = Date.now();
  //   const path = req.path;
  //   let capturedJsonResponse: Record<string, any> | undefined = undefined;

  //   const originalResJson = res.json;
  //   res.json = function (bodyJson, ...args) {
  //     capturedJsonResponse = bodyJson;
  //     return originalResJson.apply(res, [bodyJson, ...args]);
  //   };

  //   res.on("finish", () => {
  //     const duration = Date.now() - start;
  //     if (path.startsWith("/api")) {
  //       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
  //       if (capturedJsonResponse) {
  //         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
  //       }
  //       log(logLine);
  //     }
  //   });

  //   next();
  // });

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
