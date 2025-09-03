import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import 'dotenv/config';
import * as schema from "@shared/schema";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log('Querying all rooms...');

  try {
    const rooms = await db.select().from(schema.rooms);
    if (rooms.length === 0) {
      console.log('No rooms found in the database.');
    } else {
      console.log('-- Rooms --');
      rooms.forEach((room) => {
        console.log(`- Room Number: ${room.roomNumber}, Type: ${room.type}, Floor: ${room.floor}, Status: ${room.status}, Features: ${room.features}`);
      });
      console.log(`Total rooms: ${rooms.length}`);
      console.log('-------------------');
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
  } finally {
    pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
