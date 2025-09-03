ALTER TABLE "rooms" ADD COLUMN "status" text DEFAULT 'available' NOT NULL;
ALTER TABLE "rooms" DROP COLUMN "is_available";
