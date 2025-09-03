import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';
import * as schema from "@shared/schema";
import { bookings } from "@shared/schema";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log('Creating sample booking...');

  try {
    const [booking] = await db.insert(bookings).values({
      userId: 1, // Assuming user with ID 1 exists (student user)
      purpose: 'Sample Booking for Department Approval',
      guestCount: 2,
      checkInDate: new Date('2025-10-01'),
      checkOutDate: new Date('2025-10-05'),
      department_id: 1, // Assuming department with ID 1 exists (Computer Science)
      specialRequests: 'Early check-in',
      status: schema.BookingStatus.PENDING_DEPARTMENT_APPROVAL,
    }).returning();

    console.log('Created sample booking:', booking);
    console.log('Sample booking created successfully!');
  } catch (error) {
    console.error('Error creating sample booking:', error);
  } finally {
    pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
