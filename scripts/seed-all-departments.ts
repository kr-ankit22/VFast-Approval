import 'dotenv/config';
import { db } from '../server/db';
import { departments } from '@shared/schema';

const departmentList = [
  // Operational Departments
  { name: 'Admin' },
  { name: 'VFAST' },

  // Academic Departments
  { name: 'Biological Sciences' },
  { name: 'Chemical Engineering' },
  { name: 'Chemistry' },
  { name: 'Civil Engineering' },
  { name: 'Computer Science and Information Systems' },
  { name: 'Economics and Finance' },
  { name: 'Electrical and Electronics Engineering' },
  { name: 'Humanities and Social Sciences' },
  { name: 'Mathematics' },
  { name: 'Mechanical Engineering' },
  { name: 'Management (MBA, Business Analytics)' },
  { name: 'Pharmacy' },
  { name: 'Physics' },

  // Finance and Administrative Departments
  { name: 'General Administration Unit' },
  { name: 'Registrar\'s Office' },
  { name: 'Finance & Accounts Department' },
  { name: 'Student Welfare Division' },
  { name: 'Alumni Relations' },
  { name: 'Practice School Division' },
  { name: 'Sponsored Research and Consultancy Division' },
  { name: 'Academic – Undergraduate Studies Division' },
  { name: 'Academic – Graduate Studies and Research Division' },
  { name: 'International Programs and Collaboration' },
  { name: 'Faculty Affairs Division' },
  { name: 'Grants Consultancy and Industrial Research' },
];

async function seedDepartments() {
  try {
    console.log('Seeding departments...');
    
    await db.insert(departments)
      .values(departmentList)
      .onConflictDoNothing();

    console.log('Department seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding departments:', error);
  } finally {
    process.exit(0);
  }
}

seedDepartments();
