-- Create the guests table
CREATE TABLE "guests" (
    "id" serial PRIMARY KEY NOT NULL,
    "booking_id" integer NOT NULL REFERENCES "bookings"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "contact" text,
    "kyc_document_url" text,
    "is_verified" boolean DEFAULT false NOT NULL,
    "checked_in" boolean DEFAULT false NOT NULL,
    "check_in_time" timestamp,
    "check_out_time" timestamp
);

-- Add current_workflow_stage and check_in_status to bookings table
ALTER TABLE "bookings" ADD COLUMN "current_workflow_stage" text DEFAULT 'allocation_pending' NOT NULL;
ALTER TABLE "bookings" ADD COLUMN "check_in_status" text DEFAULT 'pending_check_in' NOT NULL;

-- Create the room_maintenance table
CREATE TABLE "room_maintenance" (
    "id" serial PRIMARY KEY NOT NULL,
    "room_id" integer NOT NULL REFERENCES "rooms"("id") ON DELETE cascade,
    "reason" text NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp,
    "status" text DEFAULT 'in_progress' NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX "guests_booking_id_idx" ON "guests" ("booking_id");
CREATE INDEX "room_maintenance_room_id_idx" ON "room_maintenance" ("room_id");