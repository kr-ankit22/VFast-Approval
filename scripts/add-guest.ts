
import { db } from "../server/db";
import { guests } from "../shared/schema";

async function addGuest() {
  try {
    console.log("Adding guest...");

    const bookingId = 1; // Assuming the booking ID is 1

    const [guest] = await db.insert(guests).values({
      bookingId: bookingId,
      name: "Test Guest",
      contact: "1234567890",
    }).returning();

    console.log("Guest added:", guest);
  } catch (error) {
    console.error("Error adding guest:", error);
  } finally {
    process.exit(0);
  }
}

addGuest();
