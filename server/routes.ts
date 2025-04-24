import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

// Middleware to check user role
const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

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
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if user is authorized to view this booking
      if (req.user.role === UserRole.BOOKING && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this booking" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Create a new booking (Booking users)
  app.post("/api/bookings", checkRole([UserRole.BOOKING]), async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
        checkInDate: new Date(req.body.checkInDate),
        checkOutDate: new Date(req.body.checkOutDate)
      });
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
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

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
