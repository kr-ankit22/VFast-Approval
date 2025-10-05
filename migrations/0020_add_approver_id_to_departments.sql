ALTER TABLE departments ADD COLUMN approver_id INTEGER REFERENCES users(id);
