import { 
  User, InsertUser,
  Booking, InsertBooking, UpdateBookingStatus, RoomAllocation,
  Room, InsertRoom, RoomStatus,
  BookingStatus,
  Department,
  users,
  bookings,
  departments,
  rooms
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getAllBookings(): Promise<any[]>;
  getBookingsByStatus(status: BookingStatus): Promise<Booking[]>;
  getBookingsByDepartment(departmentId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined>;
  allocateRoom(params: RoomAllocation): Promise<Booking | undefined>;
  softDeleteBooking(id: number): Promise<Booking | undefined>;
  
  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  getAllRooms(): Promise<Room[]>;
  getAvailableRoomsByType(type: string): Promise<Room[]>;
  getAllAvailableRooms(): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoomStatus(id: number, status: RoomStatus): Promise<Room | undefined>;
  
  // Session store
  sessionStore: session.Store;

  // Department operations
  getAllDepartments(): Promise<Department[]>;
}

export function initializeStorage(dbInstance: typeof db, poolInstance: typeof pool): IStorage {
  return new DatabaseStorage(dbInstance, poolInstance);
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private dbClient: typeof db;
  private poolClient: typeof pool;

  constructor(dbInstance: typeof db, poolInstance: typeof pool) {
    this.poolClient = poolInstance;
    this.sessionStore = new (connectPg(session))({ 
      pool: this.poolClient, 
      createTableIfMissing: true,
      tableName: "user_sessions" 
    });
    this.dbClient = dbInstance;
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await this.dbClient.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      
      throw new Error("Failed to retrieve user.");
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await this.dbClient.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      // console.error(`Error in getUserByEmail for email ${email}:`, error);
      throw new Error("Failed to retrieve user by email.");
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await this.dbClient
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      // console.error("Error in createUser:", error);
      throw new Error("Failed to create user.");
    }
  }

  // Booking Operations
  async getBooking(id: number): Promise<Booking | undefined> {
    try {
      // console.log("getBooking ID:", id);
      const [booking] = await this.dbClient.select({
        ...bookings,
        departmentName: departments.name
      }).from(bookings).where(eq(bookings.id, id)).leftJoin(departments, eq(bookings.department_id, departments.id));
      return booking;
    } catch (error) {
      // console.error(`Error in getBooking for ID ${id}:`, error);
      throw new Error("Failed to retrieve booking.");
    }
  }

  async getBookingsByUserId(userId: number): Promise<any[]> {
    try {
      return await this.dbClient.select({
        ...bookings,
        departmentName: departments.name
      }).from(bookings).where(eq(bookings.userId, userId)).leftJoin(departments, eq(bookings.department_id, departments.id));
    } catch (error) {
      // console.error(`Error in getBookingsByUserId for user ID ${userId}:`, error);
      throw new Error("Failed to retrieve user bookings.");
    }
  }

  async getAllBookings(): Promise<any[]> {
    try {
      return await this.dbClient.select({
        ...bookings,
        departmentName: departments.name
      }).from(bookings).where(eq(bookings.isDeleted, false)).leftJoin(departments, eq(bookings.department_id, departments.id));
    } catch (error) {
      // console.error("Error in getAllBookings:", error);
      throw new Error("Failed to retrieve all bookings.");
    }
  }

  async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    try {
      // console.log(`Executing query for status: ${status}`);
      const result = await this.dbClient.select().from(bookings).where(eq(bookings.status, status));
      // console.log('getBookingsByStatus result:', result);
      return result;
    } catch (error) {
      // console.error(`Error in getBookingsByStatus for status ${status}:`, error);
      throw new Error("Failed to retrieve bookings by status.");
    }
  }

  async getBookingsByDepartment(departmentId: number): Promise<Booking[]> {
    try {
      // console.log(`Executing query for departmentId: ${departmentId}`);
      const result = await this.dbClient.select().from(bookings).where(eq(bookings.department_id, departmentId));
      // console.log('getBookingsByDepartment result:', result);
      return result;
    } catch (error) {
      // console.error("Error in getBookingsByDepartment:", error);
      throw new Error("Failed to retrieve department-specific bookings.");
    }
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    try {
      const [booking] = await this.dbClient
        .insert(bookings)
        .values(insertBooking)
        .returning();
      return booking;
    } catch (error) {
      // console.error("Error in createBooking:", error);
      throw new Error("Failed to create booking.");
    }
  }

  async updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined> {
    try {
      const { id, status, notes, approverId } = params;
      // console.log("updateBookingStatus params:", params);
      const updateSet = {
          status, 
          ...(notes && { 
            adminNotes: status === BookingStatus.APPROVED || status === BookingStatus.REJECTED ? notes : undefined,
            vfastNotes: status === BookingStatus.ALLOCATED ? notes : undefined 
          }),
          ...(status === BookingStatus.PENDING_ADMIN_APPROVAL || status === BookingStatus.REJECTED) && {
            departmentApproverId: approverId,
            departmentApprovalAt: new Date()
          }
        };
      // console.log("updateBookingStatus set object:", updateSet);
      const [booking] = await this.dbClient
        .update(bookings)
        .set(updateSet)
        .where(eq(bookings.id, id))
        .returning();
      return booking;
    } catch (error) {
      // console.error(`Error in updateBookingStatus for ID ${params.id}:`, error);
      throw new Error("Failed to update booking status.");
    }
  }

  async allocateRoom(params: RoomAllocation): Promise<Booking | undefined> {
    try {
      const { bookingId, roomNumber, notes } = params;
      // console.log("--- Allocating Room --- C: \Users\indan\Downloads\VFastBooker\VFastBooker\server\storage.ts");
      // console.log("Params:", params);
      
      // Verify room exists and is available
      const room = await this.getRoomByNumber(roomNumber);
      // console.log("Room before allocation:", room);
      if (!room || room.status !== RoomStatus.AVAILABLE) {
        throw new Error("Room not available");
      }
      
      // Begin transaction
      const client = await this.poolClient.connect();
      try {
        await client.query('BEGIN');
        
        // Update room availability
        const roomUpdateSet = { status: RoomStatus.OCCUPIED };
        // console.log("Updating room status to OCCUPIED");
        await this.dbClient
          .update(rooms)
          .set(roomUpdateSet)
          .where(eq(rooms.roomNumber, roomNumber))
          .execute();

        const updatedRoom = await this.getRoomByNumber(roomNumber);
        // console.log("Room after allocation:", updatedRoom);
        
        // Update booking with allocated room and status
        const bookingUpdateSet = { 
            roomNumber, 
            status: BookingStatus.ALLOCATED,
            vfastNotes: notes
          };
        // console.log("Updating booking status to ALLOCATED");
        const [updatedBooking] = await this.dbClient
          .update(bookings)
          .set(bookingUpdateSet)
          .where(eq(bookings.id, bookingId))
          .returning();
        
        await client.query('COMMIT');
        // console.log("--- Allocation Complete ---");
        return updatedBooking;
      } catch (error) {
        await client.query('ROLLBACK');
        // console.error("--- Allocation Failed: Transaction Rolled Back ---");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      // console.error(`Error in allocateRoom for booking ID ${params.bookingId}:`, error);
      throw new Error("Failed to allocate room.");
    }
  }

  async softDeleteBooking(id: number): Promise<Booking | undefined> {
    try {
      const [booking] = await this.dbClient
        .update(bookings)
        .set({ isDeleted: true })
        .where(eq(bookings.id, id))
        .returning();
      return booking;
    } catch (error) {
      // console.error(`Error in softDeleteBooking for ID ${id}:`, error);
      throw new Error("Failed to soft delete booking.");
    }
  }

  // Room Operations
  async getRoom(id: number): Promise<Room | undefined> {
    try {
      const [room] = await this.dbClient.select().from(rooms).where(eq(rooms.id, id));
      return room;
    } catch (error) {
      // console.error(`Error in getRoom for ID ${id}:`, error);
      throw new Error("Failed to retrieve room.");
    }
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    try {
      const [room] = await this.dbClient.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
      return room;
    } catch (error) {
      // console.error(`Error in getRoomByNumber for room number ${roomNumber}:`, error);
      throw new Error("Failed to retrieve room by number.");
    }
  }

  async getAllRooms(): Promise<Room[]> {
    try {
      return await this.dbClient.select().from(rooms);
    } catch (error) {
      // console.error("Error in getAllRooms:", error);
      throw new Error("Failed to retrieve all rooms.");
    }
  }

  async getAvailableRoomsByType(type: string): Promise<Room[]> {
    try {
      return await this.dbClient
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.type, type),
            eq(rooms.status, RoomStatus.AVAILABLE)
          )
        );
    } catch (error) {
      // console.error(`Error in getAvailableRoomsByType for type ${type}:`, error);
      throw new Error("Failed to retrieve available rooms by type.");
    }
  }
  
  async getAllAvailableRooms(): Promise<Room[]> {
    try {
      const availableRooms = await this.dbClient
        .select()
        .from(rooms)
        .where(eq(rooms.status, RoomStatus.AVAILABLE));
      // console.log("getAllAvailableRooms result:", availableRooms);
      return availableRooms;
    } catch (error) {
      // console.error("Error in getAllAvailableRooms:", error);
      throw new Error("Failed to retrieve all available rooms.");
    }
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    try {
      const [room] = await this.dbClient
        .insert(rooms)
        .values(insertRoom)
        .returning();
      return room;
    } catch (error) {
      // console.error("Error in createRoom:", error);
      throw new Error("Failed to create room.");
    }
  }

  async updateRoomStatus(id: number, status: RoomStatus): Promise<Room | undefined> {
    try {
      const [room] = await this.dbClient
        .update(rooms)
        .set({ status })
        .where(eq(rooms.id, id))
        .returning();
      return room;
    } catch (error) {
      // console.error(`Error in updateRoomStatus for ID ${id}:`, error);
      throw new Error("Failed to update room status.");
    }
  }

  // Department Operations
  async getAllDepartments(): Promise<Department[]> {
    try {
      return await this.dbClient.select().from(departments);
    } catch (error) {
      // console.error("Error in getAllDepartments:", error);
      throw new Error("Failed to retrieve all departments.");
    }
  }
}
