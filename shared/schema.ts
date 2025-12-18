import { pgTable, text, serial, integer, boolean, timestamp, json, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export enum UserRole {
  BOOKING = "booking",
  DEPARTMENT_APPROVER = "department_approver",
  ADMIN = "admin",
  VFAST = "vfast",
}

// Booking status enum
export enum BookingStatus {
  PENDING_DEPARTMENT_APPROVAL = "pending_department_approval",
  PENDING_ADMIN_APPROVAL = "pending_admin_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
  ALLOCATED = "allocated",
  PENDING_RECONSIDERATION = "pending_reconsideration"
}

// Booking type enum
export enum BookingType {
  OFFICIAL = "official",
  PERSONAL = "personal",
}

// Room type enum
export enum RoomType {
  STANDARD = "standard"
}

// Room status enum
export enum RoomStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
}

// Guest Check-in Status enum
export enum GuestCheckInStatus {
  PENDING_CHECK_IN = "pending_check_in",
  CHECKED_IN = "checked_in",
  CHECKED_OUT = "checked_out",
}

// Booking Workflow Stage enum
export enum WorkflowStage {
  PENDING_APPROVALS = "pending_approvals",
  ALLOCATION_PENDING = "allocation_pending",
  ALLOCATED = "allocated",
  CHECKED_IN = "checked_in",
  CHECKED_OUT = "checked_out",
  REJECTED = "rejected",
}

// Room Maintenance Status enum
export enum RoomMaintenanceStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role").notNull().default(UserRole.BOOKING),
  googleId: text("google_id").unique(),
  mobileNumber: text("mobile_number"),
  department_id: integer("department_id").references(() => departments.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (users) => {
  return {
    emailIdx: uniqueIndex("email_idx").on(users.email),
  };
});

// Insert schema for user registration
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

// Login schema
export const loginUserSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Booking table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  purpose: text("purpose").notNull(),
  bookingType: text("booking_type").notNull().default(BookingType.OFFICIAL),
  guestCount: integer("guest_count").notNull(),
  numberOfRooms: integer("number_of_rooms").notNull().default(1),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  department_id: integer("department_id").references(() => departments.id),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default(BookingStatus.PENDING_DEPARTMENT_APPROVAL),
  roomNumber: text("room_number"),
  adminNotes: text("admin_notes"),
  vfastNotes: text("vfast_notes"),
  departmentNotes: text("department_notes"), // New column for department approver notes
  departmentApproverId: integer("department_approver_id").references(() => users.id),
  adminApproverId: integer("admin_approver_id").references(() => users.id),
  departmentApprovalAt: timestamp("department_approval_at"),
  adminApprovalAt: timestamp("admin_approval_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  rejectionHistory: json("rejection_history").default([]),
  isReconsidered: boolean("is_reconsidered").default(false),
  reconsiderationCount: integer("reconsideration_count").default(0),
  reconsideredFromId: integer("reconsidered_from_id"),
  isDeleted: boolean("is_deleted").default(false),
  currentWorkflowStage: text("current_workflow_stage"),
  checkInStatus: text("check_in_status").notNull().default(GuestCheckInStatus.PENDING_CHECK_IN),
  documentPath: text("document_path"),
  keyHandedOver: boolean("key_handed_over").default(false),
  firstCheckedInGuestName: text("first_checked_in_guest_name"), // New column
}, (bookings) => {
  return {
    userIdx: index("user_id_idx").on(bookings.userId),
    statusIdx: index("status_idx").on(bookings.status),
    departmentIdIdx: index("department_id_idx").on(bookings.department_id),
    checkInDateIdx: index("check_in_date_idx").on(bookings.checkInDate),
    checkOutDateIdx: index("check_out_date_idx").on(bookings.checkOutDate),
    roomNumberIdx: index("room_number_idx").on(bookings.roomNumber),
    roomAvailabilityIdx: index("room_availability_idx").on(bookings.roomNumber, bookings.checkInDate, bookings.checkOutDate),
  };
});

// Insert schema for booking creation
export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ 
    id: true, 
    roomNumber: true, 
    adminNotes: true, 
    vfastNotes: true, 
    createdAt: true, 
    updatedAt: true,
    departmentApproverId: true,
    adminApproverId: true,
    departmentApprovalAt: true,
    adminApprovalAt: true,
    rejectionHistory: true,
    isReconsidered: true,
    reconsiderationCount: true,
    reconsideredFromId: true,
    isDeleted: true,
    checkInStatus: true,
  });

// Update schema for booking status
export const departmentApprovalSchema = z.object({
  status: z.enum([BookingStatus.APPROVED, BookingStatus.REJECTED]),
  notes: z.string().optional(),
});

export const adminApprovalSchema = z.object({
  status: z.enum([BookingStatus.APPROVED, BookingStatus.REJECTED]),
  notes: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  id: z.number(),
  status: z.nativeEnum(BookingStatus),
  notes: z.string().optional(),
  approverId: z.number().optional(),
});

export type UpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;

// Room allocation schema
export const roomAllocationSchema = z.object({
  bookingId: z.number(),
  roomIds: z.array(z.number()).min(1, "At least one room must be selected"),
  notes: z.string().optional(),
});

// Room table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  type: text("type").notNull().default(RoomType.STANDARD),
  floor: integer("floor").notNull(),
  status: text("status").notNull().default(RoomStatus.AVAILABLE),
  features: json("features").default([]),
  reservedBy: integer("reserved_by").references(() => users.id, { onDelete: "set null" }),
  reservedAt: timestamp("reserved_at"),
  reservationNotes: text("reservation_notes"),
}, (rooms) => {
  return {
    roomStatusIdx: index("room_status_idx").on(rooms.status),
    reservedByIdx: index("reserved_by_idx").on(rooms.reservedBy),
  };
});

// Insert schema for room creation
export const insertRoomSchema = createInsertSchema(rooms)
  .omit({ id: true });

export const booking_rooms = pgTable("booking_rooms", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  roomId: integer("room_id").notNull().references(() => rooms.id),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type RoomAllocation = z.infer<typeof roomAllocationSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Department = typeof departments.$inferSelect;

export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contact: text("contact"),
  kycDocumentUrl: text("kyc_document_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  origin: text("origin"),
  spocName: text("spoc_name"),
  spocContact: text("spoc_contact"),
  foodPreferences: text("food_preferences"),
  otherSpecialRequests: text("other_special_requests"),
  keyHandedOver: boolean("key_handed_over").default(false),
  travelDetails: json("travel_details"),
  citizenCategory: text("citizen_category"),
  passportNumber: text("passport_number"),
  nationality: text("nationality"),
  otherNationality: text("other_nationality"),
});

export const roomMaintenance = pgTable("room_maintenance", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default(RoomMaintenanceStatus.IN_PROGRESS),
});

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;

export type RoomMaintenance = typeof roomMaintenance.$inferSelect;
export type InsertRoomMaintenance = typeof roomMaintenance.$inferInsert;

// Guest Notes table
export const guestNotes = pgTable("guest_notes", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  type: text("type"),
  category: text("category"),
});

export type GuestNote = typeof guestNotes.$inferSelect;
export type InsertGuestNote = typeof guestNotes.$inferInsert;

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  action: text("action").notNull(),
  userId: text("user_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: text("details"),
});