import { Pool } from 'pg';
import 'dotenv/config';

async function checkDrizzleMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.connect();
    console.log('Successfully connected to the database!');

    const result = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drizzle_migrations';");

    if (result.rows.length > 0) {
      console.log('drizzle_migrations table exists.');
    } else {
      console.log('drizzle_migrations table does NOT exist.');
    }

  } catch (error) {
    console.error('Failed to connect or query:', error);
  } finally {
    await pool.end();
  }
}

checkDrizzleMigrations();