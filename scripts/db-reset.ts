import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('Resetting database...');

  // Get all table names
  const tableNames = await db.execute(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );

  // Drop all tables
  for (const { tablename } of tableNames.rows) {
    console.log(`Dropping table: ${tablename}`);
    await db.execute(`DROP TABLE IF EXISTS "${tablename}" CASCADE`);
  }

  console.log('Database reset complete.');

  pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});