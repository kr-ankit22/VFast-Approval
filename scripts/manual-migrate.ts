import { pool } from '../server/db';
import * as fs from 'fs/promises';
import * as path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const client = await pool.connect();
  try {
    // 1. Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Get all applied migrations
    const appliedMigrationsResult = await client.query('SELECT name FROM migrations');
    const appliedMigrations = appliedMigrationsResult.rows.map(r => r.name);

    // 3. Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = (await fs.readdir(migrationsDir)).filter(f => f.endsWith('.sql'));

    // 4. Determine and apply pending migrations
    const pendingMigrations = migrationFiles.filter(f => !appliedMigrations.includes(f));

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations.');
      return;
    }

    console.log('Applying pending migrations:', pendingMigrations);

    for (const migrationFile of pendingMigrations) {
      console.log(`Applying migration: ${migrationFile}`);
      const sql = await fs.readFile(path.join(migrationsDir, migrationFile), 'utf-8');
      await client.query(sql);
      await client.query('INSERT INTO migrations (name) VALUES ($1)', [migrationFile]);
    }

    console.log('All pending migrations applied successfully.');

  } finally {
    client.release();
    pool.end();
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});