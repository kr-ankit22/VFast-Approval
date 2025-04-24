import { db } from "../server/db";
import { users, UserRole } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUsers() {
  console.log("Creating test users...");
  
  // Check if users already exist
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length > 0) {
    console.log("Users already exist in the database.");
    console.log("Existing users:");
    existingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    return;
  }
  
  // Create test users
  const testUsers = [
    {
      name: "Booking User",
      email: "booking@example.com",
      password: await hashPassword("password123"),
      role: UserRole.BOOKING,
      phone: "+91 98765 43210",
      department: "Computer Science",
    },
    {
      name: "Admin User",
      email: "admin@example.com",
      password: await hashPassword("password123"),
      role: UserRole.ADMIN,
      phone: "+91 98765 43211",
      department: "Administration",
    },
    {
      name: "VFast User",
      email: "vfast@example.com",
      password: await hashPassword("password123"),
      role: UserRole.VFAST,
      phone: "+91 98765 43212",
      department: "Hostel Management",
    }
  ];
  
  // Insert test users
  const result = await db.insert(users).values(testUsers).returning();
  
  console.log("Successfully created test users:");
  result.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
  });
  
  console.log("\nTest User Credentials:");
  console.log("1. Booking User");
  console.log("   Email: booking@example.com");
  console.log("   Password: password123");
  console.log("2. Admin User");
  console.log("   Email: admin@example.com");
  console.log("   Password: password123");
  console.log("3. VFast User");
  console.log("   Email: vfast@example.com");
  console.log("   Password: password123");
}

// Run the script
createTestUsers()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error creating test users:", error);
    process.exit(1);
  });