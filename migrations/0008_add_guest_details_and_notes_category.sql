ALTER TABLE guests ADD COLUMN origin TEXT;
ALTER TABLE guests ADD COLUMN spoc_name TEXT;
ALTER TABLE guests ADD COLUMN spoc_contact TEXT;
ALTER TABLE guests ADD COLUMN key_handed_over BOOLEAN DEFAULT FALSE;
ALTER TABLE guests ADD COLUMN food_preferences TEXT;
ALTER TABLE guests ADD COLUMN other_special_requests TEXT;
ALTER TABLE guests ADD COLUMN travel_details JSON;
ALTER TABLE guest_notes ADD COLUMN category TEXT;