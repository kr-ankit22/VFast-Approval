import 'dotenv/config';
import { db } from '../server/db';
import { users, departments } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function assignDefaultDepartments() {
  try {
    console.log('Assigning default departments to admin and vfast users...');

    // 1. Find the departments
    const adminDept = await db.query.departments.findFirst({ where: eq(departments.name, 'Admin') });
    const vfastDept = await db.query.departments.findFirst({ where: eq(departments.name, 'VFAST') });

    if (!adminDept || !vfastDept) {
      throw new Error('Admin and/or VFAST departments not found. Please run the department seeding script first (`npm run db:setup`).');
    }

    console.log(`Found Admin department with ID: ${adminDept.id}`);
    console.log(`Found VFAST department with ID: ${vfastDept.id}`);

    // 2. Update the admin user
    const adminUpdateResult = await db.update(users)
      .set({ department_id: adminDept.id })
      .where(eq(users.email, 'admin@pilani.bits-pilani.ac.in'));

    console.log('Admin user updated.');

    // 3. Update the vfast user
    const vfastUpdateResult = await db.update(users)
      .set({ department_id: vfastDept.id })
      .where(eq(users.email, 'vfast@pilani.bits-pilani.ac.in'));

    console.log('VFAST user updated.');

    console.log('Default department assignment completed successfully!');

  } catch (error) {
    console.error('Error assigning default departments:', error);
  } finally {
    process.exit(0);
  }
}

assignDefaultDepartments();
