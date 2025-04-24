import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "../server/db";
import { users, UserRole } from "../shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createSampleUsers() {
  try {
    console.log("Creating sample users...");
    
    // Create a student (booking user)
    const studentPassword = await hashPassword("password123");
    const student = await db
      .insert(users)
      .values({
        name: "BITS Student",
        email: "student@bits.ac.in",
        password: studentPassword,
        role: UserRole.BOOKING,
        department: "Computer Science"
      })
      .returning();
    console.log("Created student user:", student[0].email);
    
    // Create an admin user
    const adminPassword = await hashPassword("password123");
    const admin = await db
      .insert(users)
      .values({
        name: "BITS Admin",
        email: "admin@bits.ac.in",
        password: adminPassword,
        role: UserRole.ADMIN
      })
      .returning();
    console.log("Created admin user:", admin[0].email);
    
    // Create a VFast user
    const vfastPassword = await hashPassword("password123");
    const vfast = await db
      .insert(users)
      .values({
        name: "VFast Manager",
        email: "vfast@bits.ac.in",
        password: vfastPassword,
        role: UserRole.VFAST
      })
      .returning();
    console.log("Created vfast user:", vfast[0].email);
    
    console.log("Successfully created all sample users!");
  } catch (error) {
    console.error("Error creating sample users:", error);
  } finally {
    process.exit(0);
  }
}

createSampleUsers();