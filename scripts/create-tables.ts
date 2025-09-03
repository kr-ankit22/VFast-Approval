import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    console.log("Dropping tables...");
    await db.session.execute(sql`DROP TABLE IF EXISTS bookings;`);
    await db.session.execute(sql`DROP TABLE IF EXISTS rooms;`);
    await db.session.execute(sql`DROP TABLE IF EXISTS users;`);
    await db.session.execute(sql`DROP TABLE IF EXISTS departments;`);

    console.log("Creating tables...");

    await db.session.execute(sql`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `);

    await db.session.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'booking',
        phone TEXT,
        department_id INTEGER REFERENCES departments(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.session.execute(sql`
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        room_number TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        floor INTEGER NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT true,
        features JSON DEFAULT '[]'
      );
    `);

    await db.session.execute(sql`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        purpose TEXT NOT NULL,
        guest_count INTEGER NOT NULL,
        check_in_date TIMESTAMP NOT NULL,
        check_out_date TIMESTAMP NOT NULL,
        department_id INTEGER NOT NULL REFERENCES departments(id),
        special_requests TEXT,
        status TEXT NOT NULL DEFAULT 'pending_department_approval',
        room_number TEXT,
        admin_notes TEXT,
        vfast_notes TEXT,
        department_approver_id INTEGER REFERENCES users(id),
        admin_approver_id INTEGER REFERENCES users(id),
        department_approval_at TIMESTAMP,
        admin_approval_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_deleted BOOLEAN NOT NULL DEFAULT false
      );
    `);

    console.log("Tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    process.exit(0);
  }
}

createTables();
