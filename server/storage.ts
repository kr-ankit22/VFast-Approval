import { 
  users, bookings, rooms,
  User, InsertUser,
  Booking, InsertBooking, UpdateBookingStatus, RoomAllocation,
  Room, InsertRoom,
  BookingStatus
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByStatus(status: BookingStatus): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined>;
  allocateRoom(params: RoomAllocation): Promise<Booking | undefined>;
  
  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  getAllRooms(): Promise<Room[]>;
  getAvailableRoomsByType(type: string): Promise<Room[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoomAvailability(id: number, isAvailable: boolean): Promise<Room | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: "user_sessions" 
    });
  }

  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Booking Operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.status, status));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined> {
    const { id, status, notes } = params;
    const [booking] = await db
      .update(bookings)
      .set({ 
        status, 
        ...(notes && { 
          adminNotes: status === BookingStatus.APPROVED || status === BookingStatus.REJECTED ? notes : undefined,
          vfastNotes: status === BookingStatus.ALLOCATED ? notes : undefined 
        })
      })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async allocateRoom(params: RoomAllocation): Promise<Booking | undefined> {
    const { bookingId, roomNumber, notes } = params;
    
    // Verify room exists and is available
    const room = await this.getRoomByNumber(roomNumber);
    if (!room || !room.isAvailable) {
      throw new Error("Room not available");
    }
    
    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update room availability
      await db
        .update(rooms)
        .set({ isAvailable: false })
        .where(eq(rooms.roomNumber, roomNumber))
        .execute();
      
      // Update booking with allocated room and status
      const [updatedBooking] = await db
        .update(bookings)
        .set({ 
          roomNumber, 
          status: BookingStatus.ALLOCATED,
          vfastNotes: notes
        })
        .where(eq(bookings.id, bookingId))
        .returning();
      
      await client.query('COMMIT');
      return updatedBooking;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Room Operations
  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
    return room;
  }

  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getAvailableRoomsByType(type: string): Promise<Room[]> {
    return await db
      .select()
      .from(rooms)
      .where(
        and(
          eq(rooms.type, type),
          eq(rooms.isAvailable, true)
        )
      );
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async updateRoomAvailability(id: number, isAvailable: boolean): Promise<Room | undefined> {
    const [room] = await db
      .update(rooms)
      .set({ isAvailable })
      .where(eq(rooms.id, id))
      .returning();
    return room;
  }
}

// Initialize the storage with database connection
export const storage = new DatabaseStorage();