
import { db } from "../server/db";
import { bookings, BookingStatus } from "../shared/schema";
import { eq } from "drizzle-orm";

async function approveAndAllocateBooking() {
  try {
    console.log("Approving and allocating booking...");

    const bookingId = 1; // Assuming the booking ID is 1
    const roomNumber = "R01"; // Allocate room R01

    const [booking] = await db.update(bookings).set({
      status: BookingStatus.ALLOCATED,
      roomNumber: roomNumber,
    }).where(eq(bookings.id, bookingId)).returning();

    console.log("Booking approved and allocated:", booking);
  } catch (error) {
    console.error("Error approving and allocating booking:", error);
  } finally {
    process.exit(0);
  }
}

approveAndAllocateBooking();
