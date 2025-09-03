import { Pool } from 'pg';
import 'dotenv/config';
import fs from 'fs/promises';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Connecting to database...');
  const client = await pool.connect();
  console.log('Connected to database.');

  try {
    console.log('Starting manual migration...');

    const migrationFiles = [
      'migrations/0000_certain_vector.sql',
      'migrations/0001_absent_lady_vermin.sql',
      'migrations/0002_add_room_status.sql',
    ];

    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      const sql = await fs.readFile(file, 'utf-8');
      await client.query(sql);
      console.log(`Finished executing: ${file}`);
    }

    console.log('Manual migration complete.');
  } catch (error) {
    console.error('Error during manual migration:', error);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
