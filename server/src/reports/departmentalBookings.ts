import { db } from "../../db";
import { bookings, users } from "@shared/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function generateDepartmentalBookingsReport(filters: any) {
  const { startDate, endDate, status, department_id } = filters;

  const whereClause = [eq(bookings.department_id, department_id)];

  if (startDate) {
    whereClause.push(gte(bookings.createdAt, new Date(startDate)));
  }

  if (endDate) {
    whereClause.push(lte(bookings.createdAt, new Date(endDate)));
  }

  if (status) {
    whereClause.push(eq(bookings.status, status));
  }

  const data = await db
    .select({
      booking_id: bookings.id,
      requester_name: users.name,
      requester_email: users.email,
      guest_count: bookings.guestCount,
      check_in_date: bookings.checkInDate,
      check_out_date: bookings.checkOutDate,
      status: bookings.status,
      submitted_date: bookings.createdAt,
      approval_rejection_date: bookings.departmentApprovalAt, // Simplified for now
      approver_notes: bookings.departmentNotes,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.userId, users.id))
    .where(and(...whereClause));

  return data;
}
