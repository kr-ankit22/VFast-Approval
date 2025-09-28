import 'dotenv/config';
import { db } from "./server/db";

async function checkDb() {
  try {
    await db.execute('SELECT 1');
    console.log("Database connection successful!");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

checkDb();