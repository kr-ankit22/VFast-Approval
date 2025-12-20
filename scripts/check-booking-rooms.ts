import { db } from "../server/db";
import { booking_rooms } from "../shared/schema";
import { sql } from "drizzle-orm";

async function check() {
  try {
    console.log("Checking available rooms...");
    const result = await db.execute(sql`SELECT * FROM rooms WHERE status = 'available' LIMIT 5`);
    console.log("Available Rooms:", result.rows);
    
    // Check if there are any with weird casing
    const result2 = await db.execute(sql`SELECT status, count(*) FROM rooms GROUP BY status`);
    console.log("Status counts:", result2.rows);
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

check();
