import type { Express, Request, Response } from "express";
import passport from "passport";
import { IStorage } from "./storage";
import bcrypt from 'bcrypt';
import { sendEmail } from './email';
import { 
  insertBookingSchema, 
  departmentApprovalSchema, 
  adminApprovalSchema, 
  roomAllocationSchema,
    InsertGuest, GuestCheckInStatus, WorkflowStage,
  InsertRoomMaintenance, RoomMaintenanceStatus,
  UserRole,
  BookingStatus,
  users
} from "@shared/schema";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import fs from 'fs/promises';
import Papa from 'papaparse';

import upload from './upload';

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  department: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

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
  app.get("/test", (req, res) => {
    console.log("Test route hit!");
    res.send("Test successful!");
  });

  // Set up authentication routes
  setupAuth(app, storage);

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect home.
      res.redirect("/");
    }
  );

  // Local Register Route
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password, role, phone, department } = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        department_id: department ? parseInt(department) : undefined, // Assuming department is an ID
      });

      // Log the user in after successful registration
      req.login(newUser, async (err) => {
        if (err) {
          console.error("Error logging in after registration:", err);
          return res.status(500).json({ message: "Failed to log in after registration." });
        }

        // Send welcome email
        try {
          await sendEmail({
            to: newUser.email,
            subject: "Welcome to VFast Booker!",
            html: `<h1>Welcome, ${newUser.name}!</h1><p>Your account has been successfully created.</p><p>You can now log in to the VFast Booker application.</p>`,
            text: `Welcome, ${newUser.name}! Your account has been successfully created. You can now log in to the VFast Booker application.`,
          });
          console.log(`Welcome email sent to ${newUser.email}`);
        } catch (emailError) {
          console.error(`Failed to send welcome email to ${newUser.email}:`, emailError);
          // Continue even if email fails, as user account is created
        }

        res.status(201).json(newUser);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user." });
    }
  });

  // Local Login Route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) { return next(err); }
      if (!user) { return res.status(401).json({ message: info.message }); }
      req.login(user, (err) => {
        if (err) { return next(err); }
        return res.json(user);
      });
    })(req, res, next);
  });

  // Logout Route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) { return next(err); }
      req.session.destroy((err) => {
        if (err) { return next(err); }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  app.get("/api/users/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.patch("/api/users/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { mobileNumber } = req.body;
    const userId = req.user.id;

    try {
      const updatedUser = await storage.updateUser(userId, { mobileNumber });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/upload", checkRole([UserRole.ADMIN]), upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const csvData = req.file.buffer.toString('utf-8');
    let created = 0;
    let updated = 0;

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        for (const row of results.data as any[]) {
          const { email, role } = row;

          if (!email || !role) {
            continue;
          }

          const existingUser = await storage.getUserByEmail(email);

          if (existingUser) {
            await storage.updateUser(existingUser.id, { role });
            updated++;
          } else {
            await storage.createUser({ name: email.split('@')[0], email, password: 'password', role });
            created++;
          }
        }

        res.json({ created, updated });
      },
      error: (error) => {
        res.status(500).json({ message: "Failed to parse CSV file", error });
      },
    });
  });

  // Get guest worklist (VFast users)
  app.get("/api/bookings/worklist", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookings = await storage.getAllocatedBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error in /api/bookings/worklist:", error);
      res.status(500).json({ message: "Failed to fetch guest worklist" });
    }
  });

  app.get("/api/stats/vfast-allocation", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const stats = await storage.getVFastAllocationStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch VFast allocation stats", error: error.message });
    }
  });

  // Bookings API
  
  // Get all bookings (Admin & VFast users)
  app.get("/api/bookings", checkRole([UserRole.ADMIN, UserRole.VFAST]), async (req, res) => {
    try {
      const status = req.query.status as BookingStatus | undefined;
      const workflowStage = req.query.workflowStage as WorkflowStage | undefined;
      let bookings;
      
      if (workflowStage) {
        bookings = await storage.getBookingsByWorkflowStage(workflowStage);
      } else if (status) {
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
      
      const status = req.query.status as BookingStatus | undefined;
      let bookings;

      if (status) {
        bookings = await storage.getBookingsByUserIdAndStatus(req.user.id, status);
      } else {
        bookings = await storage.getBookingsByUserId(req.user.id);
      }

      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get user's bookings for reconsideration (Booking users)
  app.get("/api/my-bookings/reconsider", checkRole([UserRole.BOOKING]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bookings = await storage.getBookingsByUserIdAndStatus(req.user.id, BookingStatus.PENDING_RECONSIDERATION);

      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings for reconsideration" });
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

  // Get booking journey
  app.get("/api/bookings/:id/journey", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const journey = await storage.getBookingJourney(bookingId);
      
      if (!journey) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(journey);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking journey" });
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
      console.log(`[BACKEND] Received department approval request for booking ID: ${req.params.id}`); // ADD THIS LINE
      console.log("[BACKEND] Request body:", req.body); // ADD THIS LINE

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bookingId = parseInt(req.params.id);
      const { status, notes } = req.body;

      console.log(`[BACKEND] Status received from frontend: "${status}"`); // ADD THIS LINE
      console.log(`[BACKEND] Comparing with BookingStatus.APPROVED: "${BookingStatus.APPROVED}"`); // ADD THIS LINE
      console.log(`[BACKEND] Comparing with BookingStatus.REJECTED: "${BookingStatus.REJECTED}"`); // ADD THIS LINE
      console.log(`[BACKEND] Is status === BookingStatus.APPROVED? ${status === BookingStatus.APPROVED}`); // ADD THIS LINE
      console.log(`[BACKEND] Is status === BookingStatus.REJECTED? ${status === BookingStatus.REJECTED}`); // ADD THIS LINE

      console.log(`[BACKEND] Calling updateBookingStatus with status: ${status}`);

      if (status !== BookingStatus.APPROVED && status !== BookingStatus.REJECTED) {
        return res.status(400).json({ message: "Invalid status update" });
      }

      // Department approval always transitions to PENDING_ADMIN_APPROVAL
      const booking = await storage.updateBookingStatus({
        id: bookingId,
        status: status, // Use the status received from the frontend
        notes,
        approverId: req.user.id,
      }, req.user.role as UserRole);

      if (!booking) {
        console.log(`[BACKEND] Booking ${bookingId} not found.`);
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send email notification to the booking user
      try {
        const bookingUser = await storage.getUser(booking.userId);
        if (bookingUser && bookingUser.email) {
          await sendEmail({
            to: bookingUser.email,
            subject: `Your Booking #${booking.id} Status Update: ${booking.status}`,
            html: `<h1>Booking Status Update</h1>
                   <p>Dear ${bookingUser.name},</p>
                   <p>Your booking request #${booking.id} has been <strong>${booking.status}</strong> by the Department Approver.</p>
                   ${booking.notes ? `<p>Notes from approver: ${booking.notes}</p>` : ''}
                   <p>Thank you for using VFast Booker.</p>`,
            text: `Dear ${bookingUser.name}, Your booking request #${booking.id} has been ${booking.status} by the Department Approver. ${booking.notes ? `Notes: ${booking.notes}` : ''} Thank you for using VFast Booker.`,
          });
          console.log(`Email sent to ${bookingUser.email} for booking ${booking.id} status update.`);
        }
      } catch (emailError) {
        console.error(`Failed to send email for booking ${booking.id} status update:`, emailError);
      }

      console.log(`[BACKEND] Booking ${bookingId} status updated to: ${status}`);
      res.json(booking);
    } catch (error) {
      console.error("[BACKEND] Error in /api/bookings/:id/department-approval:", error); // ADD THIS LINE
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Create a new booking (Booking users)
  app.post("/api/bookings", checkRole([UserRole.BOOKING]), async (req, res) => {
    
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log(req.body);
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
      const statusData = adminApprovalSchema.parse(req.body);
      
      const booking = await storage.updateBookingStatus(
        {
          id: bookingId,
          status: statusData.status,
          notes: statusData.notes,
          approverId: req.user.id,
        },
        req.user.role as UserRole
      );
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send email notification to the booking user
      try {
        const bookingUser = await storage.getUser(booking.userId);
        if (bookingUser && bookingUser.email) {
          await sendEmail({
            to: bookingUser.email,
            subject: `Your Booking #${booking.id} Status Update: ${booking.status}`,
            html: `<h1>Booking Status Update</h1>
                   <p>Dear ${bookingUser.name},</p>
                   <p>Your booking request #${booking.id} has been <strong>${booking.status}</strong> by an Administrator.</p>
                   ${booking.notes ? `<p>Notes from administrator: ${booking.notes}</p>` : ''}
                   <p>Thank you for using VFast Booker.</p>`,
            text: `Dear ${bookingUser.name}, Your booking request #${booking.id} has been ${booking.status} by an Administrator. ${booking.notes ? `Notes: ${booking.notes}` : ''} Thank you for using VFast Booker.`,
          });
          console.log(`Email sent to ${bookingUser.email} for booking ${booking.id} status update.`);
        }
      } catch (emailError) {
        console.error(`Failed to send email for booking ${booking.id} status update:`, emailError);
      }
      
      res.json(booking);
      console.error("Error updating booking status:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

    

  // Resubmit booking (Booking users)
  app.post("/api/bookings/:id/resubmit", checkRole([UserRole.BOOKING]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bookingId = parseInt(req.params.id);
      const originalBooking = await storage.getBooking(bookingId);

      if (!originalBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (originalBooking.status !== BookingStatus.PENDING_RECONSIDERATION) {
        return res.status(400).json({ message: "Booking is not pending reconsideration" });
      }

      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
        status: BookingStatus.PENDING_DEPARTMENT_APPROVAL, // Explicitly set status
        checkInDate: new Date(req.body.checkInDate),
        checkOutDate: new Date(req.body.checkOutDate)
      });

      const booking = await storage.reconsiderBooking(bookingId, bookingData);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found or not eligible for reconsideration" });
      }

      res.json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to resubmit booking" });
    }
  });

  // Guest Management Endpoints

  // Add a guest to a booking
  app.post("/api/bookings/:bookingId/guests", checkRole([UserRole.VFAST]), async (req, res) => {
    console.log('GUEST BODY', req.body)
    try {
      const bookingId = parseInt(req.params.bookingId);
      const {
        name,
        contact,
        kycDocumentUrl,
        origin,
        spocName,
        spocContact,
        foodPreferences,
        otherSpecialRequests,
        travelDetails,
        citizenCategory,
      } = req.body;

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const guestData: InsertGuest = {
        bookingId,
        name,
        contact,
        kycDocumentUrl,
        origin,
        spocName,
        spocContact,
        foodPreferences,
        otherSpecialRequests,
        travelDetails,
        citizenCategory,
      };

      const guest = await storage.createGuest(guestData);
      res.status(201).json(guest);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to add guest" });
    }
  });

  // Get all guests for a booking
  app.get("/api/bookings/:bookingId/guests", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const guests = await storage.getGuestsByBookingId(bookingId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guests" });
    }
  });

  // Update guest details (including KYC verification and check-in/out)
  app.patch("/api/guests/:guestId", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const updates = req.body;

      const guest = await storage.updateGuest(guestId, updates);

      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update guest" });
    }
  });

  // Delete a guest
  app.delete("/api/guests/:guestId", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      await storage.deleteGuest(guestId);
      res.status(204).send(); // No content
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest" });
    }
  });

  // Upload document for a guest
  app.post("/api/guests/:guestId/document", checkRole([UserRole.VFAST]), upload.single('file'), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const guest = await storage.updateGuest(guestId, { kycDocumentUrl: file.path });

      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete document for a guest
  app.delete("/api/guests/:guestId/document", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const guest = await storage.getGuest(guestId);

      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      if (guest.kycDocumentUrl) {
        await fs.unlink(guest.kycDocumentUrl);
      }

      const updatedGuest = await storage.updateGuest(guestId, { kycDocumentUrl: null });

      res.json(updatedGuest);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Check-in a guest
  app.post("/api/guests/:guestId/check-in", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const guest = await storage.updateGuest(guestId, { checkedIn: true, checkInTime: new Date() });
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }

      // Fetch the booking to check if firstCheckedInGuestName is already set
      const booking = await storage.getBooking(guest.bookingId);
      if (booking && !booking.firstCheckedInGuestName) {
        // If firstCheckedInGuestName is not set, update it with the current guest's name
        await storage.updateBooking(guest.bookingId, { firstCheckedInGuestName: guest.name });
        console.log(`Updated booking ${guest.bookingId} with firstCheckedInGuestName: ${guest.name}`); // ADD THIS LINE
      } else if (booking) {
        console.log(`Booking ${guest.bookingId} already has firstCheckedInGuestName: ${booking.firstCheckedInGuestName}`); // ADD THIS LINE
      }
      
      await storage.updateBooking(guest.bookingId, { keyHandedOver: true });
      res.json(guest);
    } catch (error) {
      console.error("Error in /api/guests/:guestId/check-in:", error); // ADD THIS LINE
      res.status(500).json({ message: "Failed to check-in guest" });
    }
  });

  // Check-out a guest
  app.post("/api/guests/:guestId/check-out", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const { keyHandedOver } = req.body; // Expect keyHandedOver status (e.g., key received)
      const guest = await storage.updateGuest(guestId, { checkedIn: false, checkOutTime: new Date(), keyHandedOver: keyHandedOver });
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to check-out guest" });
    }
  });

  // Upload KYC document
  app.post("/api/guests/:guestId/kyc", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const { kycDocumentUrl } = req.body;
      const guest = await storage.updateGuest(guestId, { kycDocumentUrl, isVerified: true });
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload KYC document" });
    }
  });

  // Upload a generic document for a guest
  app.post("/api/guests/:guestId/documents", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const { documentType, documentUrl } = req.body; // documentUrl will come from frontend after upload

      // In a real scenario, you'd handle file upload here, save to storage, and get a URL.
      // For now, we're mocking the upload and expecting a documentUrl from the client.
      const uploadedUrl = await storage.uploadDocument(documentUrl); // Mocking upload

      // You might want to store these documents in a separate table or as a JSON array in guest table
      // For simplicity, let's assume kycDocumentUrl is generic for now, or add a new field.
      // For now, we'll just return the URL and let the frontend decide how to store it.
      res.status(200).json({ message: "Document uploaded successfully", url: uploadedUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Guest Notes Endpoints

  // Add a note to a guest
  app.post("/api/guests/:guestId/notes", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const { note, type } = req.body;

      const guestNote: InsertGuestNote = {
        guestId,
        note,
        type,
      };

      const newNote = await storage.createGuestNote(guestNote);
      res.status(201).json(newNote);
    } catch (error) {
      res.status(500).json({ message: "Failed to add guest note" });
    }
  });

  // Get all notes for a guest
  app.get("/api/guests/:guestId/notes", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      const notes = await storage.getGuestNotesByGuestId(guestId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guest notes" });
    }
  });

  // Booking Workflow Endpoints

  // Update booking workflow stage
  app.patch("/api/bookings/:id/workflow-stage", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { stage, checkInStatus } = req.body;

      if (!Object.values(WorkflowStage).includes(stage)) {
        return res.status(400).json({ message: "Invalid workflow stage" });
      }

      if (checkInStatus && !Object.values(GuestCheckInStatus).includes(checkInStatus)) {
        return res.status(400).json({ message: "Invalid check-in status" });
      }

      const booking = await storage.updateBookingWorkflowStage(bookingId, stage, checkInStatus);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking workflow stage" });
    }
  });

  // Check-in a booking (update booking's overall check-in status)
  app.patch("/api/bookings/:id/check-in", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.updateBookingCheckInStatus(bookingId, GuestCheckInStatus.CHECKED_IN);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to check-in booking" });
    }
  });

  // Check-out a booking (update booking's overall check-out status)
  app.patch("/api/bookings/:id/check-out", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.updateBookingCheckInStatus(bookingId, GuestCheckInStatus.CHECKED_OUT);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to check-out booking" });
    }
  });

  // Allocate room to booking (VFast users)
  app.patch("/api/bookings/:id/allocate", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      console.log(`[SERVER] Received allocation request for booking ID: ${req.params.id}`);
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
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch approved bookings", error: error.message });
    }
  });
  
  // Get reconsideration requests (for VFast review)
  app.get("/api/bookings/reconsideration", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByStatus(BookingStatus.PENDING_RECONSIDERATION);
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

  // Get a single department
  app.get("/api/departments/:id", async (req, res) => {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await storage.getDepartment(departmentId);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch department" });
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

  // Update room status (Admin and VFast users)
  app.patch("/api/rooms/:id/status", checkRole([UserRole.ADMIN, UserRole.VFAST]), async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { status, notes } = req.body;

      const room = await storage.updateRoomStatus(roomId, status, notes, req.user.id);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Room Maintenance Endpoints

  // Create a room maintenance entry
  app.post("/api/rooms/:roomId/maintenance", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { reason, startDate, endDate, status } = req.body;

      const room = await storage.getRoom(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const maintenanceData: InsertRoomMaintenance = {
        roomId,
        reason,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || RoomMaintenanceStatus.IN_PROGRESS,
      };

      const maintenance = await storage.createRoomMaintenance(maintenanceData);
      res.status(201).json(maintenance);
    } catch (error) {
      res.status(500).json({ message: "Failed to create room maintenance entry" });
    }
  });

  // Update room maintenance status
  app.patch("/api/room-maintenance/:maintenanceId/status", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.maintenanceId);
      const { status } = req.body;

      if (!Object.values(RoomMaintenanceStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid maintenance status" });
      }

      const maintenance = await storage.updateRoomMaintenanceStatus(maintenanceId, status);

      if (!maintenance) {
        return res.status(404).json({ message: "Room maintenance entry not found" });
      }

      res.json(maintenance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update room maintenance status" });
    }
  });

  // Get all active room maintenance entries
  app.get("/api/rooms/maintenance/active", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const activeMaintenance = await storage.getActiveRoomMaintenance();
      res.json(activeMaintenance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active room maintenance entries" });
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

  // Get user details
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Upload document for a booking
  app.post("/api/bookings/:bookingId/document", checkRole([UserRole.VFAST]), upload.single('file'), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const booking = await storage.updateBooking(bookingId, { documentPath: file.path });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete document for a booking
  app.delete("/api/bookings/:bookingId/document", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.documentPath) {
        await fs.unlink(booking.documentPath);
      }

      const updatedBooking = await storage.updateBooking(bookingId, { documentPath: null });

      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.patch("/api/bookings/:id", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const updates = req.body;

      const booking = await storage.updateBooking(bookingId, updates);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.post("/api/bookings/:bookingId/checkout-all", checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.checkOutAllGuests(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to check out all guests" });
    }
  });
}