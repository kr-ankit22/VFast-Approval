import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Checking database connection...');

  // Get all table names
  const tableNames = await db.execute(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );

  console.log('Tables in database:', tableNames.rows);

  pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
