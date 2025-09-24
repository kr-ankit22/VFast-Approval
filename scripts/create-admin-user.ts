import 'dotenv/config';
import { db } from '../server/db';
import { users, UserRole } from '../shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  try {
    const email = 'admin@bits.ac.in';
    const password = 'password'; // Known password for testing
    const hashedPassword = await bcrypt.hash(password, 10);

    let adminUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (adminUser) {
      // Update existing admin user
      await db.update(users).set({
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Admin User',
      }).where(eq(users.id, adminUser.id));
      console.log(`Updated admin user: ${email}`);
    } else {
      // Create new admin user
      await db.insert(users).values({
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Admin User',
      });
      console.log(`Created admin user: ${email}`);
    }
    console.log(`Admin user '${email}' provisioned with password: '${password}'`);
  } catch (error) {
    console.error('Error provisioning admin user:', error);
    process.exit(1);
  }
  process.exit(0);
}

createAdminUser();
