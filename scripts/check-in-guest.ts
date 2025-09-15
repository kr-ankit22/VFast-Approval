
import { db } from "../server/db";
import { guests } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkInGuest() {
  try {
    console.log("Checking in guest...");

    const guestId = 1; // Assuming the guest ID is 1

    const [guest] = await db.update(guests).set({
      checkedIn: true,
      checkInTime: new Date(),
    }).where(eq(guests.id, guestId)).returning();

    console.log("Guest checked in:", guest);
  } catch (error) {
    console.error("Error checking in guest:", error);
  } finally {
    process.exit(0);
  }
}

checkInGuest();
