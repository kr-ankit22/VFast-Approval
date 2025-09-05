ALTER TABLE "bookings" ADD COLUMN "rejection_history" json DEFAULT '[]'::json;
ALTER TABLE "bookings" ADD COLUMN "is_reconsidered" boolean DEFAULT false;
ALTER TABLE "bookings" ADD COLUMN "reconsideration_count" integer DEFAULT 0;
ALTER TABLE "bookings" ADD COLUMN "reconsidered_from_id" integer;