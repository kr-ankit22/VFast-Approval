import { db } from "../../db";
import { bookings, guests } from "@shared/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function generateRoomAllocationGuestReport(filters: any) {
  const { startDate, endDate, checkInStatus } = filters;

  const whereClause = [eq(bookings.status, "allocated")];

  if (startDate) {
    whereClause.push(gte(bookings.checkInDate, new Date(startDate)));
  }

  if (endDate) {
    whereClause.push(lte(bookings.checkOutDate, new Date(endDate)));
  }

  if (checkInStatus) {
    whereClause.push(eq(guests.checkedIn, checkInStatus));
  }

  const data = await db
    .select({
      booking_id: bookings.id,
      room_number: bookings.roomNumber,
      check_in_date: bookings.checkInDate,
      check_out_date: bookings.checkOutDate,
      guest_name: guests.name,
      guest_contact: guests.contact,
      guest_check_in_status: guests.checkedIn,
    })
    .from(bookings)
    .leftJoin(guests, eq(bookings.id, guests.bookingId))
    .where(and(...whereClause));

  return data;
}
