import { pool } from '../server/db';

async function checkDb() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
    `);
    console.log('Tables in database:', res.rows.map(r => r.tablename));
  } finally {
    client.release();
    pool.end();
  }
}

checkDb();