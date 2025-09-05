import { Pool } from 'pg';
import 'dotenv/config';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.connect();
    console.log('Successfully connected to the database!');

    // Try to create a dummy table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);
    console.log('Successfully created/verified test_table!');

  } catch (error) {
    console.error('Failed to connect or create table:', error);
  } finally {
    await pool.end();
  }
}

testConnection();