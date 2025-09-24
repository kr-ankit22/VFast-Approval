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
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
console.log("Database pool created.");

// Create a drizzle instance with our schema
export const db = drizzle(pool, { schema, logger: false });
console.log("Drizzle instance created.");