import { Pool } from 'pg';
import 'dotenv/config';

async function createDepartmentsTable() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.connect();
    console.log('Successfully connected to the database!');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      );
    `);
    console.log('departments table created or already exists.');

  } catch (error) {
    console.error('Failed to create departments table:', error);
  } finally {
    await pool.end();
  }
}

createDepartmentsTable();