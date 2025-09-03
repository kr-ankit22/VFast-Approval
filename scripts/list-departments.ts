import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';
import * as schema from "@shared/schema";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log('Querying all departments...');

  try {
    const departments = await db.select().from(schema.departments);
    if (departments.length === 0) {
      console.log('No departments found in the database.');
    } else {
      console.log('-- Departments --');
      departments.forEach((dept) => {
        console.log(`- ID: ${dept.id}, Name: ${dept.name}`);
      });
      console.log('-------------------');
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
  } finally {
    pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
