import bcrypt from 'bcrypt';
import { db } from "../server/db";
import { users, UserRole } from "../shared/schema";
import { eq } from 'drizzle-orm';

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function createOrUpdateUser(email: string, name: string, role: UserRole, passwordHash: string, department_id?: number) {
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) {
    await db.update(users).set({
      name,
      password: passwordHash,
      role,
      department_id: department_id || null,
    }).where(eq(users.id, user.id));
    console.log(`Updated user: ${email}`);
  } else {
    await db.insert(users).values({
      name,
      email,
      password: passwordHash,
      role,
      department_id: department_id || null,
    });
    console.log(`Created user: ${email}`);
  }
}

async function createSampleUsers() {
  try {
    console.log("Creating sample users...");

    const password = "password123";
    const hashedPassword = await hashPassword(password);

    await createOrUpdateUser("student@pilani.bits-pilani.ac.in", "BITS Student", UserRole.BOOKING, hashedPassword, 1);
    await createOrUpdateUser("admin@pilani.bits-pilani.ac.in", "BITS Admin", UserRole.ADMIN, hashedPassword);
    await createOrUpdateUser("vfast@pilani.bits-pilani.ac.in", "VFast Manager", UserRole.VFAST, hashedPassword);
    await createOrUpdateUser("approver@pilani.bits-pilani.ac.in", "Department Approver", UserRole.DEPARTMENT_APPROVER, hashedPassword, 1);

    console.log("Successfully created/updated all sample users!");
  } catch (error) {
    console.error("Error creating sample users:", error);
  } finally {
    process.exit(0);
  }
}

createSampleUsers();
