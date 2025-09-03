import { db } from "../server/db";
import { rooms, RoomType } from "../shared/schema";

async function createSampleRooms() {
  try {
    console.log("Creating sample rooms...");
    
    const roomsToCreate = [];

    for (let i = 1; i <= 40; i++) {
      const roomNumber = `R${i < 10 ? '0' : ''}${i}`;
      const floor = Math.ceil(i / 10); // Distribute across 4 floors
      
      roomsToCreate.push({
        roomNumber,
        type: RoomType.STANDARD,
        floor,
        isAvailable: true,
        features: [] // You can add features here if needed
      });
    }
    
    for (const room of roomsToCreate) {
      await db.insert(rooms).values(room);
      console.log(`Created room: ${room.roomNumber} (Type: ${room.type}, Floor: ${room.floor})`);
    }
    
    console.log("Successfully created all sample rooms!");
  } catch (error) {
    console.error("Error creating sample rooms:", error);
  } finally {
    process.exit(0);
  }
}

createSampleRooms();