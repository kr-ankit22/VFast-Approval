import { Pool } from 'pg';
import 'dotenv/config';

const departments = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Electrical Engineering' },
  { id: 3, name: 'Mechanical Engineering' },
  { id: 4, name: 'Civil Engineering' },
  { id: 5, name: 'Chemical Engineering' },
  { id: 6, name: 'Physics' },
  { id: 7, name: 'Chemistry' },
  { id: 8, name: 'Mathematics' },
];

async function seedDepartments() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set.');
    return;
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.connect();
    console.log('Successfully connected to the database!');

    for (const department of departments) {
      await pool.query('INSERT INTO departments (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING;', [department.id, department.name]);
    }

    console.log('Departments seeded successfully.');

  } catch (error) {
    console.error('Failed to seed departments:', error);
  } finally {
    await pool.end();
  }
}

seedDepartments();
