import { db } from "../../db";
import { bookings, users, departments } from "@shared/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function generateAllBookingsReport(filters: any) {
  const { startDate, endDate, status, department } = filters;

  const whereClause = [];

  if (startDate) {
    const startDateTime = new Date(startDate);
    console.log('Backend: AllBookings - Filtering by startDate:', startDateTime);
    whereClause.push(gte(bookings.createdAt, startDateTime));
  }

  if (endDate) {
    const endDateTime = new Date(endDate);
    console.log('Backend: AllBookings - Filtering by endDate:', endDateTime);
    whereClause.push(lte(bookings.createdAt, endDateTime));
  }

  if (status) {
    console.log('Backend: AllBookings - Filtering by status:', status);
    whereClause.push(eq(bookings.status, status));
  }

  if (department) {
    console.log('Backend: AllBookings - Filtering by department:', department);
    whereClause.push(eq(bookings.department_id, department));
  }

  console.log('Backend: AllBookings - Final whereClause:', whereClause);

  const data = await db
    .select({
      booking_id: bookings.id,
      department: departments.name,
      department_id: departments.id,
      requester_name: users.name,
      status: bookings.status,
      room_number: bookings.roomNumber,
      check_in_date: bookings.checkInDate,
      check_out_date: bookings.checkOutDate,
      guest_count: bookings.guestCount,
      purpose: bookings.purpose,
      special_requests: bookings.specialRequests,
      admin_notes: bookings.adminNotes,
      department_approver_notes: bookings.departmentNotes,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .leftJoin(departments, eq(bookings.department_id, departments.id))
    .where(and(...whereClause));

  return data;
}
