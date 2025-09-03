import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function listUsers() {
  console.log("Querying all users...");

  try {
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
      console.log("No users found in the database.");
      return;
    }

    console.log("\n--- User Credentials ---");
    allUsers.forEach(user => {
      console.log(`- Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      if (user.email.endsWith('@example.com')) {
        console.log(`  Password: password123`);
      } else {
        console.log(`  Password: (not a test user)`);
      }
      console.log("------------------------");
    });

  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    process.exit(0);
  }
}

listUsers();
