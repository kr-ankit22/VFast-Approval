import 'dotenv/config';
import { pool } from '../server/db';

async function createSessionTable() {
  try {
    console.log('Creating session table...');
    await pool.query(`
      DROP TABLE IF EXISTS "user_sessions" CASCADE;
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
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
