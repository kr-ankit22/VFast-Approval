import { db } from "../server/db";
import { rooms, RoomType } from "../shared/schema";

async function createSampleRooms() {
  try {
    console.log("Creating sample rooms...");
    
    // Create 10 simple rooms on a single floor
    const roomsToCreate = [
      { roomNumber: "R01", type: RoomType.SINGLE, isAvailable: true },
      { roomNumber: "R02", type: RoomType.SINGLE, isAvailable: true },
      { roomNumber: "R03", type: RoomType.SINGLE, isAvailable: true },
      { roomNumber: "R04", type: RoomType.SINGLE, isAvailable: true },
      { roomNumber: "R05", type: RoomType.DOUBLE, isAvailable: true },
      { roomNumber: "R06", type: RoomType.DOUBLE, isAvailable: true },
      { roomNumber: "R07", type: RoomType.DOUBLE, isAvailable: true },
      { roomNumber: "R08", type: RoomType.DOUBLE, isAvailable: true },
      { roomNumber: "R09", type: RoomType.DELUXE, isAvailable: true },
      { roomNumber: "R10", type: RoomType.DELUXE, isAvailable: true },
    ];
    
    for (const room of roomsToCreate) {
      await db.insert(rooms).values(room);
      console.log(`Created room: ${room.roomNumber} (${room.type})`);
    }
    
    console.log("Successfully created all sample rooms!");
  } catch (error) {
    console.error("Error creating sample rooms:", error);
  } finally {
    process.exit(0);
  }
}

createSampleRooms();