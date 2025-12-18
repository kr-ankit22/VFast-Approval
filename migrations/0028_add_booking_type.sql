ALTER TABLE "bookings" ADD COLUMN "booking_type" text DEFAULT 'official' NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "department_id" DROP NOT NULL;
