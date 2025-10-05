import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function getUserId() {
  const user = await db.select().from(users).where(eq(users.name, "Ankit"));
  console.log(user);
}

getUserId();
