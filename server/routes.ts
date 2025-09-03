import type { Express, Request, Response } from "express";
import { IStorage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertBookingSchema, 
  updateBookingStatusSchema, 
  roomAllocationSchema,
  UserRole,
  BookingStatus
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import fs from 'fs/promises';

// Middleware to check user role
const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: Function) => {
    // console.log("Checking role for user:", req.user);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express, storage: IStorage): Promise<void> {
  // Set up authentication routes
  setupAuth(app, storage);

  // Bookings API
  
  // Get all bookings (Admin & VFast users)
  app.get("/api/bookings", checkRole([UserRole.ADMIN, UserRole.VFAST]), async (req, res) => {
    try {
      const status = req.query.status as BookingStatus | undefined;
      let bookings;
      
      if (status) {
        bookings = await storage.getBookingsByStatus(status);
      } else {
        bookings = await storage.getAllBookings();
      }
      
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get user's bookings (Booking users)
  app.get("/api/my-bookings", checkRole([UserRole.BOOKING]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookings = await storage.getBookingsByUserId(req.user.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get a single booking
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      // console.log("GET /api/bookings/:id - bookingId:", bookingId);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if user is authenticated and authorized to view this booking
      if (req.user && req.user.role === UserRole.BOOKING && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this booking" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Get pending department approvals
  app.get("/api/department-approvals", checkRole([UserRole.DEPARTMENT_APPROVER]), async (req, res) => {
    try {
      // console.log("GET /api/department-approvals - req.user:", req.user);
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookings = await storage.getBookingsByDepartment(req.user.department_id);
      
      // console.log("GET /api/department-approvals - Bookings from storage:", bookings);
      res.json(bookings);
    } catch (error) {
      // console.error("Error in /api/department-approvals:", error);
      res.status(500).json({ message: "Failed to fetch department approvals" });
    }
  });

  // Update booking status (Department Approver)
  app.patch("/api/bookings/:id/department-approval", checkRole([UserRole.DEPARTMENT_APPROVER]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bookingId = parseInt(req.params.id);
      const { status, notes } = req.body;
      // console.log("Department approval request body:", req.body);
      // console.log("Department approver user ID:", req.user.id);

      if (status !== BookingStatus.PENDING_ADMIN_APPROVAL && status !== BookingStatus.REJECTED) {
        return res.status(400).json({ message: "Invalid status update" });
      }

      const booking = await storage.updateBookingStatus({
        id: bookingId,
        status,
        notes,
        approverId: req.user.id,
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Create a new booking (Booking users)
  app.post("/api/bookings", checkRole([UserRole.BOOKING]), async (req, res) => {
    debugger;
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: BookingStatus.PENDING_DEPARTMENT_APPROVAL, // Explicitly set status
        checkInDate: new Date(req.body.checkInDate),
        checkOutDate: new Date(req.body.checkOutDate)
      });
      // console.log("Booking data before creation:", bookingData);
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      // console.error("Booking creation error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Update booking status (Admin users)
  app.patch("/api/bookings/:id/status", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const statusData = updateBookingStatusSchema.parse({
        id: bookingId,
        status: req.body.status,
        notes: req.body.notes
      });
      
      const booking = await storage.updateBookingStatus(statusData);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  app.patch("/api/bookings/:id/soft-delete", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.softDeleteBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Allocate room to booking (VFast users)
  app.patch("/api/bookings/:id/allocate", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const allocationData = roomAllocationSchema.parse({
        bookingId: bookingId,
        roomNumber: req.body.roomNumber,
        notes: req.body.notes
      });
      
      const booking = await storage.allocateRoom(allocationData);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to allocate room" });
    }
  });

  // Get approved bookings (for VFast room allocation)
  app.get("/api/bookings/approved", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByStatus(BookingStatus.APPROVED);
      res.json(bookings);
    } catch (error) {
      // console.error("Failed to fetch approved bookings:", error);
      res.status(500).json({ message: "Failed to fetch approved bookings" });
    }
  });
  
  // Get reconsideration requests (for VFast review)
  app.get("/api/bookings/reconsideration", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByStatus(BookingStatus.REJECTED);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reconsideration requests" });
    }
  });

  // Rooms API
  
  // Get all rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get all available rooms
  app.get("/api/rooms/available", async (req, res) => {
    try {
      const rooms = await storage.getAllAvailableRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available rooms" });
    }
  });

  // Get all departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });
  
  // Get available rooms by type
  app.get("/api/rooms/available/:type", async (req, res) => {
    try {
      const roomType = req.params.type;
      const rooms = await storage.getAvailableRoomsByType(roomType);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available rooms" });
    }
  });

  // Debug endpoint to get room status
  app.get("/api/debug/room-status/:roomNumber", async (req, res) => {
    try {
      const roomNumber = req.params.roomNumber;
      const room = await storage.getRoomByNumber(roomNumber);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room" });
    }
  });

  // Update room status (Admin users)
  app.patch("/api/rooms/:id/status", checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { status } = req.body;

      const room = await storage.updateRoomStatus(roomId, status);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update room status" });
    }
  });

  // Log endpoint for debugging
  app.post("/api/log", async (req, res) => {
    try {
      const { filename, data } = req.body;
      // In a real application, you would sanitize filename and path
      const filePath = `./${filename}`;
      // Using fs.promises.writeFile for async file writing
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      res.status(200).json({ message: "Logged successfully" });
    } catch (error) {
      // console.error("Failed to write log file:", error);
      res.status(500).json({ message: "Failed to write log file" });
    }
  });
}
