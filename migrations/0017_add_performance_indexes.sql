-- Create index on users.email
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "users" ("email");

-- Create index on bookings.userId
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "bookings" ("user_id");

-- Create index on bookings.status
CREATE INDEX IF NOT EXISTS "status_idx" ON "bookings" ("status");

-- Create index on bookings.department_id
CREATE INDEX IF NOT EXISTS "department_id_idx" ON "bookings" ("department_id");

-- Create index on bookings.checkInDate
CREATE INDEX IF NOT EXISTS "check_in_date_idx" ON "bookings" ("check_in_date");

-- Create index on bookings.checkOutDate
CREATE INDEX IF NOT EXISTS "check_out_date_idx" ON "bookings" ("check_out_date");

-- Create index on bookings.roomNumber
CREATE INDEX IF NOT EXISTS "room_number_idx" ON "bookings" ("room_number");

-- Create composite index on bookings.roomNumber, bookings.checkInDate, bookings.checkOutDate
CREATE INDEX IF NOT EXISTS "room_availability_idx" ON "bookings" ("room_number", "check_in_date", "check_out_date");

-- Create index on rooms.status
CREATE INDEX IF NOT EXISTS "room_status_idx" ON "rooms" ("status");

-- Create index on rooms.reservedBy
CREATE INDEX IF NOT EXISTS "reserved_by_idx" ON "rooms" ("reserved_by");