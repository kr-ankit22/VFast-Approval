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
import { eq, and, or, lt, gt, lte, gte } from "drizzle-orm";
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
  getBookingsByUserIdAndStatus(userId: number, status: BookingStatus): Promise<Booking[]>;
  getAllBookings(): Promise<any[]>;
  getBookingsByStatus(status: BookingStatus): Promise<Booking[]>;
  getBookingsByDepartment(departmentId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined>;
  reconsiderBooking(bookingId: number, bookingData: InsertBooking): Promise<Booking | undefined>;
  getBookingJourney(bookingId: number): Promise<any>;
  
  allocateRoom(params: RoomAllocation): Promise<Booking | undefined>;
  
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
      console.error(`Error in getUser for ID ${id}:`, error);
      throw new Error("Failed to retrieve user.");
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await this.dbClient.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error(`Error in getUserByEmail for email ${email}:`, error);
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
      const result = await this.dbClient.select({
        ...bookings,
        departmentName: departments.name
      }).from(bookings).where(eq(bookings.userId, userId)).leftJoin(departments, eq(bookings.department_id, departments.id));
      console.log('getBookingsByUserId result:', result);
      return result;
    } catch (error) {
      // console.error(`Error in getBookingsByUserId for user ID ${userId}:`, error);
      throw new Error("Failed to retrieve user bookings.");
    }
  }

  async getBookingsByUserIdAndStatus(userId: number, status: BookingStatus): Promise<any[]> {
    try {
      const result = await this.dbClient.select({
        ...bookings,
        departmentName: departments.name
      }).from(bookings).where(and(eq(bookings.userId, userId), eq(bookings.status, status))).leftJoin(departments, eq(bookings.department_id, departments.id));
      console.log('getBookingsByUserIdAndStatus result:', result);
      return result;
    } catch (error) {
      // console.error(`Error in getBookingsByUserIdAndStatus for user ID ${userId} and status ${status}:`, error);
      throw new Error("Failed to retrieve user bookings by status.");
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
      console.log(`Executing query for status: ${status}`);
      const result = await this.dbClient.select().from(bookings).where(eq(bookings.status, status));
      console.log('getBookingsByStatus result:', result);
      return result;
    } catch (error) {
      console.error(`Error in getBookingsByStatus for status ${status}:`, error);
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
      // console.error("Storage: Error in createBooking:", error);
      throw new Error("Failed to create booking.");
    }
  }

  async updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined> {
    try {
      const { id, status, notes, approverId } = params;
      
      const currentBooking = await this.getBooking(id);
      if (!currentBooking) {
        throw new Error("Booking not found");
      }

      const updateSet: Partial<Booking> = { status };
      
      if (status === BookingStatus.REJECTED) {
        const rejectionEntry = {
          reason: notes,
          rejectedBy: approverId,
          rejectedAt: new Date(),
        };
        updateSet.rejectionHistory = [...(currentBooking.rejectionHistory || []), rejectionEntry];
        updateSet.status = BookingStatus.PENDING_RECONSIDERATION;
      } else if (status === BookingStatus.PENDING_ADMIN_APPROVAL) {
        updateSet.departmentApproverId = approverId;
        updateSet.departmentApprovalAt = new Date();
      } else if (status === BookingStatus.APPROVED) {
        updateSet.adminApproverId = approverId;
        updateSet.adminApprovalAt = new Date();
      }

      if (approverId) {
        const approver = await this.getUser(approverId);
        if (!approver) {
          throw new Error("Approver not found");
        }

        if (notes) {
          if (approver.role === 'admin') {
            updateSet.adminNotes = notes;
          } else if (approver.role === 'vfast') {
            updateSet.vfastNotes = notes;
          } else if (approver.role === 'department_approver') {
            // Department approver notes should be stored in a separate field if needed
          }
        }
      }

      const [booking] = await this.dbClient
        .update(bookings)
        .set(updateSet)
        .where(eq(bookings.id, id))
        .returning();
      return booking;
    } catch (error) {
      console.error(`Error in updateBookingStatus for ID ${params.id}:`, error);
      throw new Error("Failed to update booking status.");
    }
  }

  async reconsiderBooking(bookingId: number, bookingData: InsertBooking): Promise<Booking | undefined> {
    try {
      const originalBooking = await this.getBooking(bookingId);
      if (!originalBooking) {
        throw new Error("Original booking not found");
      }

      const [reconsideredBooking] = await this.dbClient
        .update(bookings)
        .set({
          ...bookingData,
          status: BookingStatus.PENDING_DEPARTMENT_APPROVAL,
          isReconsidered: true,
          reconsiderationCount: (originalBooking.reconsiderationCount || 0) + 1,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      return reconsideredBooking;
    } catch (error) {
      // console.error(`Error in reconsiderBooking for booking ID ${bookingId}:`, error);
      throw new Error("Failed to reconsider booking.");
    }
  }

  async getBookingJourney(bookingId: number): Promise<any> {
    try {
      const booking = await this.getBooking(bookingId);
      if (!booking) {
        return null;
      }

      const journey: any[] = [];

      // Booking Creation
      const creator = await this.getUser(booking.userId);
      journey.push({
        stage: "Booking Creation",
        status: "Submitted",
        actor: creator ? { id: creator.id, name: creator.name } : null,
        timestamp: booking.createdAt,
        notes: null,
      });

      // Department Approval
      if (booking.departmentApproverId) {
        const approver = await this.getUser(booking.departmentApproverId);
        journey.push({
          stage: "Department Approval",
          status: booking.status === BookingStatus.PENDING_ADMIN_APPROVAL || booking.status === BookingStatus.APPROVED || booking.status === BookingStatus.ALLOCATED ? "Approved" : "Pending",
          actor: approver ? { id: approver.id, name: approver.name } : null,
          timestamp: booking.departmentApprovalAt,
          notes: null, // Add notes if available
        });
      }

      // Admin Approval
      if (booking.adminApproverId) {
        const approver = await this.getUser(booking.adminApproverId);
        journey.push({
          stage: "Admin Approval",
          status: booking.status === BookingStatus.APPROVED || booking.status === BookingStatus.ALLOCATED ? "Approved" : "Pending",
          actor: approver ? { id: approver.id, name: approver.name } : null,
          timestamp: booking.adminApprovalAt,
          notes: booking.adminNotes,
        });
      }

      // Rejection History
      if (booking.rejectionHistory) {
        for (const rejection of booking.rejectionHistory) {
          const rejecter = await this.getUser(rejection.rejectedBy);
          journey.push({
            stage: "Rejection",
            status: "Rejected",
            actor: rejecter ? { id: rejecter.id, name: rejecter.name } : null,
            timestamp: rejection.rejectedAt,
            notes: rejection.reason,
          });
        }
      }
      
      // Room Allocation
      if (booking.status === BookingStatus.ALLOCATED) {
        journey.push({
          stage: "Room Allocation",
          status: "Allocated",
          actor: null, // VFAST user details can be added here if needed
          timestamp: booking.updatedAt, // Assuming updatedAt is the allocation time
          notes: booking.vfastNotes,
        });
      }

      // Sort journey by timestamp
      journey.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return journey;
    } catch (error) {
      console.error(`Error in getBookingJourney for booking ID ${bookingId}:`, error);
      throw new Error("Failed to retrieve booking journey.");
    }
  }

  



  async allocateRoom(params: RoomAllocation): Promise<Booking | undefined> {
    try {
      const { bookingId, roomNumber, notes } = params;

      const bookingToAllocate = await this.getBooking(bookingId);
      if (!bookingToAllocate) {
        throw new Error("Booking not found");
      }

      const overlappingBookings = await this.dbClient.select().from(bookings).where(
        and(
          eq(bookings.roomNumber, roomNumber),
          or(
            and(
              lte(bookings.checkInDate, bookingToAllocate.checkInDate),
              gte(bookings.checkOutDate, bookingToAllocate.checkInDate)
            ),
            and(
              lte(bookings.checkInDate, bookingToAllocate.checkOutDate),
              gte(bookings.checkOutDate, bookingToAllocate.checkOutDate)
            ),
            and(
              gte(bookings.checkInDate, bookingToAllocate.checkInDate),
              lte(bookings.checkOutDate, bookingToAllocate.checkOutDate)
            )
          )
        )
      );

      if (overlappingBookings.length > 0) {
        throw new Error("Room is already booked for the selected dates.");
      }

      // Verify room exists and is available
      const room = await this.getRoomByNumber(roomNumber);
      if (!room || room.status !== RoomStatus.AVAILABLE) {
        throw new Error("Room not available");
      }
      
      // Begin transaction
      const client = await this.poolClient.connect();
      try {
        await client.query('BEGIN');
        
        // Update room availability
        const roomUpdateSet = { status: RoomStatus.OCCUPIED };
        await this.dbClient
          .update(rooms)
          .set(roomUpdateSet)
          .where(eq(rooms.roomNumber, roomNumber))
          .execute();

        const updatedRoom = await this.getRoomByNumber(roomNumber);
        
        // Update booking with allocated room and status
        const bookingUpdateSet = { 
            roomNumber, 
            status: BookingStatus.ALLOCATED,
            vfastNotes: notes
          };
        const [updatedBooking] = await this.dbClient
          .update(bookings)
          .set(bookingUpdateSet)
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
    } catch (error) {
      throw new Error("Failed to allocate room.");
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
