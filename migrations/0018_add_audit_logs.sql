CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
  details TEXT
);