import { 
  users, 
  User, 
  InsertUser, 
  bookings, 
  Booking, 
  InsertBooking, 
  UpdateBookingStatus, 
  rooms, 
  Room, 
  InsertRoom, 
  BookingStatus,
  RoomAllocation,
  UserRole
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: any; // Express session store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookings: Map<number, Booking>;
  private rooms: Map<number, Room>;
  private userAutoIncrement: number;
  private bookingAutoIncrement: number;
  private roomAutoIncrement: number;
  sessionStore: any; // Express session store

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    this.rooms = new Map();
    this.userAutoIncrement = 1;
    this.bookingAutoIncrement = 1;
    this.roomAutoIncrement = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with sample rooms data
    this.seedRooms();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userAutoIncrement++;
    
    // Handle required role field
    const role = insertUser.role || UserRole.BOOKING;
    
    // Create user and remove confirmPassword which is only for validation
    const { confirmPassword, ...userData } = insertUser;
    
    const user: User = { 
      ...userData, 
      id, 
      role,
      phone: userData.phone || null,
      department: userData.department || null,
      createdAt: new Date() 
    };
    
    this.users.set(id, user);
    return user;
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByUserId(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.userId === userId
    );
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.status === status
    );
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingAutoIncrement++;
    const now = new Date();
    const booking: Booking = {
      ...insertBooking,
      id,
      status: BookingStatus.PENDING,
      specialRequests: insertBooking.specialRequests || null,
      roomNumber: null,
      adminNotes: null,
      vfastNotes: null,
      createdAt: now,
      updatedAt: now
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBookingStatus(params: UpdateBookingStatus): Promise<Booking | undefined> {
    const booking = this.bookings.get(params.id);
    if (!booking) return undefined;
    
    const updatedBooking: Booking = {
      ...booking,
      status: params.status,
      updatedAt: new Date()
    };
    
    if (params.notes) {
      if (params.status === BookingStatus.APPROVED || params.status === BookingStatus.REJECTED) {
        updatedBooking.adminNotes = params.notes;
      } else if (params.status === BookingStatus.ALLOCATED) {
        updatedBooking.vfastNotes = params.notes;
      }
    }
    
    this.bookings.set(params.id, updatedBooking);
    return updatedBooking;
  }

  async allocateRoom(params: RoomAllocation): Promise<Booking | undefined> {
    const booking = this.bookings.get(params.bookingId);
    if (!booking) return undefined;
    
    const room = await this.getRoomByNumber(params.roomNumber);
    if (!room) return undefined;
    
    // Update booking with room allocation
    const updatedBooking: Booking = {
      ...booking,
      status: BookingStatus.ALLOCATED,
      roomNumber: params.roomNumber,
      vfastNotes: params.notes || booking.vfastNotes,
      updatedAt: new Date()
    };
    
    this.bookings.set(params.bookingId, updatedBooking);
    
    // Update room availability
    await this.updateRoomAvailability(room.id, false);
    
    return updatedBooking;
  }

  // Room operations
  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.roomNumber === roomNumber
    );
  }

  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getAvailableRoomsByType(type: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(
      (room) => room.type === type && room.isAvailable
    );
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomAutoIncrement++;
    const room: Room = { 
      ...insertRoom, 
      id,
      isAvailable: insertRoom.isAvailable ?? true,
      features: insertRoom.features || [] 
    };
    this.rooms.set(id, room);
    return room;
  }

  async updateRoomAvailability(id: number, isAvailable: boolean): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom: Room = {
      ...room,
      isAvailable
    };
    
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  // Seed initial room data
  private seedRooms() {
    const roomsData: InsertRoom[] = [
      { roomNumber: "S-101", type: "single", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC"] },
      { roomNumber: "S-102", type: "single", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC"] },
      { roomNumber: "S-103", type: "single", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC"] },
      { roomNumber: "S-201", type: "single", floor: 2, isAvailable: true, features: ["Wi-Fi", "AC"] },
      { roomNumber: "S-202", type: "single", floor: 2, isAvailable: true, features: ["Wi-Fi", "AC"] },
      { roomNumber: "D-101", type: "double", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC", "TV"] },
      { roomNumber: "D-102", type: "double", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC", "TV"] },
      { roomNumber: "D-201", type: "double", floor: 2, isAvailable: true, features: ["Wi-Fi", "AC", "TV"] },
      { roomNumber: "D-202", type: "double", floor: 2, isAvailable: true, features: ["Wi-Fi", "AC", "TV"] },
      { roomNumber: "DLX-101", type: "deluxe", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC", "TV", "Mini-fridge"] },
      { roomNumber: "DLX-102", type: "deluxe", floor: 1, isAvailable: true, features: ["Wi-Fi", "AC", "TV", "Mini-fridge"] },
      { roomNumber: "DLX-201", type: "deluxe", floor: 2, isAvailable: true, features: ["Wi-Fi", "AC", "TV", "Mini-fridge"] },
    ];

    roomsData.forEach(room => {
      this.createRoom(room);
    });
  }
}

export const storage = new MemStorage();
