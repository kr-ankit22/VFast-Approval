import { db } from "./server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function checkDb() {
  try {
    await db.execute(`SELECT 1`);
    console.log("Database connection successful.");

    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, "admin@bits.ac.in"),
    });

    if (adminUser) {
      console.log("Admin user found:", adminUser);
    } else {
      console.log("Admin user not found.");
    }

  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

checkDb();
