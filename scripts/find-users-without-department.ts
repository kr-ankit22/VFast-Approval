import 'dotenv/config';
import { db } from '../server/db';
import { users } from '@shared/schema';
import { isNull } from 'drizzle-orm';

async function findUsersWithoutDepartment() {
  try {
    console.log('Finding users with no department assigned...');
    
    const usersWithoutDept = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }).from(users).where(isNull(users.department_id));

    if (usersWithoutDept.length === 0) {
      console.log('All users have a department assigned. No cleanup needed.');
      return;
    }

    console.log('The following users do not have a department:');
    console.table(usersWithoutDept);
    console.log(`
Please update these ${usersWithoutDept.length} users and assign them a department before running the migration.`);

  } catch (error) {
    console.error('Error finding users without department:', error);
  } finally {
    process.exit(0);
  }
}

findUsersWithoutDepartment();
