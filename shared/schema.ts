import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.BOOKING),
  phone: text("phone"),
  department_id: integer("department_id").references(() => departments.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema for user registration
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .extend({
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

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
  guestCount: integer("guest_count").notNull(),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  department_id: integer("department_id").notNull().references(() => departments.id),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default(BookingStatus.PENDING_DEPARTMENT_APPROVAL),
  roomNumber: text("room_number"),
  adminNotes: text("admin_notes"),
  vfastNotes: text("vfast_notes"),
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
  currentWorkflowStage: text("current_workflow_stage").notNull().default(WorkflowStage.ALLOCATION_PENDING),
  checkInStatus: text("check_in_status").notNull().default(GuestCheckInStatus.PENDING_CHECK_IN),
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
    currentWorkflowStage: true,
    checkInStatus: true,
  });

// Update schema for booking status
export const updateBookingStatusSchema = z.object({
  id: z.number(),
  status: z.enum([
    BookingStatus.PENDING_DEPARTMENT_APPROVAL,
    BookingStatus.PENDING_ADMIN_APPROVAL,
    BookingStatus.APPROVED, 
    BookingStatus.REJECTED, 
    BookingStatus.ALLOCATED,
    BookingStatus.PENDING_RECONSIDERATION
  ]),
  notes: z.string().optional(),
  approverId: z.number().optional(),
});

// Room allocation schema
export const roomAllocationSchema = z.object({
  bookingId: z.number(),
  roomNumber: z.string().min(1, "Room number is required"),
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
});

// Insert schema for room creation
export const insertRoomSchema = createInsertSchema(rooms)
  .omit({ id: true });

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type UpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;
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
});

export type GuestNote = typeof guestNotes.$inferSelect;
export type InsertGuestNote = typeof guestNotes.$inferInsert;