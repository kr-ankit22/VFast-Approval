import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.error("Usage: tsx scripts/update-user-role.ts <email> <role>");
    process.exit(1);
  }

  try {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.email, email))
      .returning();

    if (user) {
      console.log(`User ${user.email} role updated to ${user.role}`);
    } else {
      console.log(`User with email ${email} not found`);
    }
  } catch (error) {
    console.error("Error updating user role:", error);
  } finally {
    process.exit(0);
  }
}

main();
