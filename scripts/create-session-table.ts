import 'dotenv/config';
import { pool } from '../server/db';

async function createSessionTable() {
  try {
    console.log('Creating session table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
    `);
    console.log('Session table created successfully!');
  } catch (error) {
    // Ignore errors if the table already exists
    if (error.code !== '42P07') {
      console.error('Error creating session table:', error);
    }
  } finally {
    process.exit(0);
  }
}

createSessionTable();
