import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export enum UserRole {
  BOOKING = "booking",
  ADMIN = "admin",
  VFAST = "vfast"
}

// Booking status enum
export enum BookingStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  ALLOCATED = "allocated"
}

// Room type enum
export enum RoomType {
  SINGLE = "single",
  DOUBLE = "double",
  DELUXE = "deluxe"
}

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.BOOKING),
  phone: text("phone"),
  department: text("department"),
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
  userId: integer("user_id").notNull(),
  purpose: text("purpose").notNull(),
  guestCount: integer("guest_count").notNull(),
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  roomPreference: text("room_preference").notNull(),
  specialRequests: text("special_requests"),
  status: text("status").notNull().default(BookingStatus.PENDING),
  roomNumber: text("room_number"),
  adminNotes: text("admin_notes"),
  vfastNotes: text("vfast_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema for booking creation
export const insertBookingSchema = createInsertSchema(bookings)
  .omit({ 
    id: true, 
    status: true, 
    roomNumber: true, 
    adminNotes: true, 
    vfastNotes: true, 
    createdAt: true, 
    updatedAt: true 
  });

// Update schema for booking status
export const updateBookingStatusSchema = z.object({
  id: z.number(),
  status: z.enum([
    BookingStatus.PENDING, 
    BookingStatus.APPROVED, 
    BookingStatus.REJECTED, 
    BookingStatus.ALLOCATED
  ]),
  notes: z.string().optional(),
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
  type: text("type").notNull(),
  floor: integer("floor").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  features: json("features").default([]),
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
