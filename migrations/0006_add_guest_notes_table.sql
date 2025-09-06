-- Create the guest_notes table
CREATE TABLE "guest_notes" (
    "id" serial PRIMARY KEY NOT NULL,
    "guest_id" integer NOT NULL REFERENCES "guests"("id") ON DELETE cascade,
    "note" text NOT NULL,
    "timestamp" timestamp DEFAULT now(),
    "type" text
);

-- Create index for faster lookup of guest notes by guest_id
CREATE INDEX "guest_notes_guest_id_idx" ON "guest_notes" ("guest_id");