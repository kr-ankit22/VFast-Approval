import { db } from "../../db";
import { bookings, departments, BookingStatus } from "@shared/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export async function generateDepartmentWiseAllotmentReport(filters: any) {
  const { startDate, endDate } = filters;

  const whereClause = [];

  if (startDate) {
    whereClause.push(gte(bookings.createdAt, new Date(startDate)));
  }

  if (endDate) {
    whereClause.push(lte(bookings.createdAt, new Date(endDate)));
  }

  const data = await db
    .select({
      department_name: departments.name,
      total_bookings_created: sql<number>`count(${bookings.id})`,
      total_pending_department_approval: sql<number>`count(CASE WHEN ${bookings.status} = ${BookingStatus.PENDING_DEPARTMENT_APPROVAL} THEN 1 ELSE NULL END)`,
      total_pending_admin_approval: sql<number>`count(CASE WHEN ${bookings.status} = ${BookingStatus.PENDING_ADMIN_APPROVAL} THEN 1 ELSE NULL END)`,
      total_approved: sql<number>`count(CASE WHEN ${bookings.status} = ${BookingStatus.APPROVED} THEN 1 ELSE NULL END)`,
      total_rejected: sql<number>`count(CASE WHEN ${bookings.status} = ${BookingStatus.REJECTED} THEN 1 ELSE NULL END)`,
      total_allocated: sql<number>`count(CASE WHEN ${bookings.status} = ${BookingStatus.ALLOCATED} THEN 1 ELSE NULL END)`,
      total_pending_reconsideration: sql<number>`count(CASE WHEN ${bookings.status} = ${BookingStatus.PENDING_RECONSIDERATION} THEN 1 ELSE NULL END)`,
    })
    .from(bookings)
    .leftJoin(departments, eq(bookings.department_id, departments.id))
    .where(and(...whereClause))
    .groupBy(departments.name);

  return data;
}
