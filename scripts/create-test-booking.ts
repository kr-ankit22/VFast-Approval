import "dotenv/config";
import { db } from "../server/db";
import { users, departments, bookings, BookingStatus, UserRole } from "../shared/schema";
import { InsertBooking } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createTestBooking() {
  console.log("Creating a test booking for Management (MBA, Business Analytics)...");

  // 1. Find the Management (MBA, Business Analytics) department
  const managementDept = await db.query.departments.findFirst({
    where: eq(departments.name, "Management (MBA, Business Analytics)"),
  });

  if (!managementDept) {
    console.error("Management (MBA, Business Analytics) department not found. Please ensure it's seeded.");
    process.exit(1);
  }
  console.log(`Found Management (MBA, Business Analytics) department with ID: ${managementDept.id}`);

  // 2. Find a booking user
  const bookingUser = await db.query.users.findFirst({
    where: eq(users.role, UserRole.BOOKING),
  });

  if (!bookingUser) {
    console.error("No booking user found. Please create one.");
    process.exit(1);
  }
  console.log(`Found booking user: ${bookingUser.name} (ID: ${bookingUser.id})`);

  // 3. Create the booking data
  const newBooking: InsertBooking = {
    userId: bookingUser.id,
    purpose: "Academic Conference - Test Booking",
    guestCount: 2,
    checkInDate: new Date("2025-11-01T10:00:00Z"),
    checkOutDate: new Date("2025-11-05T10:00:00Z"),
    department_id: managementDept.id,
    specialRequests: "Projector and whiteboard needed.",
    status: BookingStatus.PENDING_DEPARTMENT_APPROVAL,
  };

  // 4. Insert the booking
  try {
    const [booking] = await db.insert(bookings).values(newBooking).returning();
    console.log(`Successfully created booking with ID: ${booking.id}`);
  } catch (error) {
    console.error("Error creating test booking:", error);
  } finally {
    process.exit(0);
  }
}

createTestBooking();
