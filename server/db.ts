import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Validate that we have a database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

console.log("DATABASE_URL:", process.env.DATABASE_URL);
// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, // More robust SSL config
  max: 20, // Set a maximum of 20 connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // 10 second connection timeout
});
console.log("Database pool created.");

// Create a drizzle instance with our schema
export const db = drizzle(pool, { schema, logger: false });
console.log("Drizzle instance created.");