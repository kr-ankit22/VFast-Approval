import type { Express, Request, Response } from "express";
import passport from "passport";
import { IStorage } from "./storage";
import bcrypt from 'bcrypt';
import { sendEmail } from './email';
import { welcomeEmailTemplate, newBookingRequestEmailTemplate, bookingStatusUpdateEmailTemplate, roomAllocatedEmailTemplate, bookingCreatedEmailTemplate, bookingForAllocationEmailTemplate, bookingRejectedByAdminEmailTemplate, bookingResubmittedEmailTemplate } from './email-templates';
import { FRONTEND_BASE_URL } from './config';
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
import logger from './logger';
import { authenticateJwt } from "./auth";

import jwt from 'jsonwebtoken';

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  department: z.string(),
  authMethod: z.enum(["Password", "Google"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;



// Middleware to check user role
const checkRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!roles.includes((req.user as any).role as UserRole)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express, storage: IStorage): Promise<void> {
  app.get("/test", (req, res) => {
    logger.info
    res.send("Test successful!");
  });

  // Set up authentication routes


  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          logger.error({ err }, "Google Auth Error");
          return res.redirect("/login?error=" + encodeURIComponent(err.message));
        }
        if (!user) {
  logger.warn
          return res.redirect("/login?error=" + encodeURIComponent(info.message || "Authentication failed"));
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        // logger.info("Google Login: Token generated. Redirecting to /");
        res.redirect(`/?token=${token}`);
      })(req, res, next);
    }
  );

  // Local Register Route
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password, authMethod, role, phone, department } = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists." });
      }

      let hashedPassword: string | null = null;
      if (authMethod === "Password" && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const newUser = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        department_id: parseInt(department),
      });

      // Log the user in after successful registration
      req.login(newUser, async (err) => {
        if (err) {
          // logger.error({ err }, "Error logging in after registration");
          return res.status(500).json({ message: "Failed to log in after registration." });
        }

        // Send welcome email
        try {
          const emailTemplate = await welcomeEmailTemplate(newUser, config.frontendLoginUrl);
          sendEmail({
            to: newUser.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
          logger.info({ email: newUser.email }, "Welcome email sent");
        } catch (emailError) {
          logger.error({ err: emailError }, `Failed to send welcome email to ${newUser.email}`);
          // Continue even if email fails, as user account is created
        }

        res.status(201).json(newUser);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      // logger.error({ err: error }, "Registration error");
      res.status(500).json({ message: "Failed to register user." });
    }
  });

  // Local Login Route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", { session: false }, (err: any, user: any, info: any) => {
      if (err) { return next(err); }
      if (!user) { return res.status(401).json({ message: info.message }); }
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });
      return res.json({ user, token });
    })(req, res, next);
  });

  // Logout Route
  app.post("/api/logout", (req, res) => {
    // For JWT-based authentication, logout is primarily handled client-side by removing the token.
    // The server doesn't maintain sessions for JWTs, so no server-side session destruction is strictly necessary.
    // However, if session middleware is still active, we can clear it for completeness.
    req.logout((err) => {
      if (err) {
        // logger.error({ err }, "Logout error");
        return res.status(500).json({ message: "Failed to log out." });
      }
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            // logger.error({ err }, "Session destruction error");
            return res.status(500).json({ message: "Failed to destroy session." });
          }
          res.clearCookie('connect.sid'); // Clear session cookie
          res.status(200).json({ message: "Logged out successfully" });
        });
      } else {
        res.status(200).json({ message: "Logged out successfully" });
      }
    });
  });

  app.get("/api/users/me", passport.authenticate('jwt', { session: false }), (req, res) => {
    // logger.info({ user: req.user }, "Backend: /api/users/me - Sending user data");
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
        const errors: string[] = [];
        const validRows = [];

        // First pass: Validate all rows for basic requirements
        for (const [index, row] of (results.data as any[]).entries()) {
          const { email, role, department, password } = row;
          if (!email || !role || !department) {
            if (!email && !role && !department) continue;
            errors.push(`Row ${index + 2}: Missing required fields. 'email', 'role', and 'department' are all mandatory.`);
          } else {
            validRows.push(row);
          }
        }

        if (errors.length > 0) {
          return res.status(400).json({ message: "CSV validation failed. No users were created or updated.", errors });
        }

        // Second pass: Process valid rows with new policy
        for (const row of validRows) {
          const { email, role, name, phone, department, password } = row;
          
          // Rule 1: If password is provided in CSV, reject
          if (password) {
            errors.push(`Row for ${email}: Password provided in CSV. Only Google users without passwords can be bulk created.`);
            continue; // Skip this row
          }

          // Rule 2 & 3: If no password, check email for Gmail
          if (!email.endsWith('@gmail.com')) {
            errors.push(`Row for ${email}: Non-Gmail email without a password. Only Gmail users can be bulk created without a password.`);
            continue; // Skip this row
          }

          const existingUser = await storage.getUserByEmail(email);

          const userData = {
            name: name || email.split('@')[0],
            email,
            role,
            phone,
            department_id: parseInt(department, 10),
            password: null, // Always null for bulk created Google users
          };

          if (isNaN(userData.department_id)) {
            errors.push(`Row for ${email}: Invalid Department ID. Department must be a number.`);
            continue; // Skip this row
          }

          if (existingUser) {
            // For existing users, we only update if they are Google users and no password was provided
            if (existingUser.googleId) {
              await storage.updateUser(existingUser.id, userData);
              updated++;
            } else {
              errors.push(`Row for ${email}: Existing user is not a Google user. Cannot update via bulk upload.`);
            }
          } else {
            await storage.createUser(userData);
            created++;
          }
        }

        res.json({ created, updated, errors });
      },
      error: (error) => {
        res.status(500).json({ message: "Failed to parse CSV file", error });
      },
    });
  });

  // Admin User Management Endpoints

  // Get all users (Admin only)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      // logger.error({ err: error }, "Error fetching all users");
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user and department stats (Admin only)
  app.get("/api/admin/stats/users", authenticateJwt, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const totalUsers = await storage.getTotalUsers();
      const totalDepartments = await storage.getTotalDepartments();
      res.json({ totalUsers, totalDepartments });
    } catch (error) {
      // logger.error({ err: error }, "Error fetching user stats");
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Create a new user (Admin only)
  app.post("/api/admin/users", authenticateJwt, checkRole([UserRole.ADMIN]), async (req, res) => {
    logger.info({ body: req.body }, "Admin user creation request body");
    try {
      const { name, email, password, authMethod, role, phone, department } = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists." });
      }

      let hashedPassword: string | null = null;
      if (authMethod === "Password" && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const newUser = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        department_id: parseInt(department),
      });

      // Send welcome email
      try {
        const emailTemplate = await welcomeEmailTemplate(newUser, config.frontendLoginUrl);
        sendEmail({
          to: newUser.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
        logger.info({ email: newUser.email }, "Welcome email sent to admin-created user");
      } catch (emailError) {
        logger.error({ err: emailError }, `Failed to send welcome email to ${newUser.email}`);
        // Continue even if email fails, as user account is created
      }

      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      // logger.error({ err: error }, "Error creating user");
      res.status(500).json({ message: "Failed to create user." });
    }
  });

  // Update a user (Admin only)
  app.patch("/api/admin/users/:id", authenticateJwt, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      // Hash password if provided
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const updatedUser = await storage.updateUser(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      // logger.error({ err: error }, "Error updating user");
      res.status(500).json({ message: "Failed to update user." });
    }
  });

  // Delete a user (Admin only)
  app.delete("/api/admin/users/:id", authenticateJwt, checkRole([UserRole.ADMIN]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.status(204).send(); // No content
    } catch (error) {
      // logger.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user." });
    }
  });

  // Get guest worklist (VFast users)
  app.get("/api/bookings/worklist", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookings = await storage.getAllocatedBookings();
      res.json(bookings);
    } catch (error) {
      // logger.error("Error in /api/bookings/worklist:", error);
      res.status(500).json({ message: "Failed to fetch guest worklist" });
    }
  });

  app.get("/api/stats/vfast-allocation", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const stats = await storage.getVFastAllocationStats();
      res.json(stats);
    } catch (error: any) {
      // logger.error("Failed to fetch VFast allocation stats", { error: error.message });
      res.status(500).json({ message: "Failed to fetch VFast allocation stats", error: error.message });
    }
  });

  // Bookings API
  
  // Get all bookings (Admin & VFast users)
  app.get("/api/bookings", authenticateJwt, checkRole([UserRole.ADMIN, UserRole.VFAST]), async (req, res) => {
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
  app.get("/api/my-bookings", authenticateJwt, checkRole([UserRole.BOOKING]), async (req, res) => {
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
  app.get("/api/my-bookings/reconsider", authenticateJwt, checkRole([UserRole.BOOKING]), async (req, res) => {
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
  app.get("/api/department-approvals", authenticateJwt, checkRole([UserRole.DEPARTMENT_APPROVER]), async (req, res) => {
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
  app.patch("/api/bookings/:id/department-approval", authenticateJwt, checkRole([UserRole.DEPARTMENT_APPROVER]), async (req, res) => {
    try {
      // logger.info(`[BACKEND] Received department approval request for booking ID: ${req.params.id}`);
      // logger.info("[BACKEND] Request body:", req.body);

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bookingId = parseInt(req.params.id);
      const { status, notes } = req.body;

      // logger.info(`[BACKEND] Status received from frontend: "${status}"`);
      // logger.info(`[BACKEND] Comparing with BookingStatus.APPROVED: "${BookingStatus.APPROVED}"`);
      // logger.info(`[BACKEND] Comparing with BookingStatus.REJECTED: "${BookingStatus.REJECTED}"`);
      // logger.info(`[BACKEND] Is status === BookingStatus.APPROVED? ${status === BookingStatus.APPROVED}`);
      // logger.info(`[BACKEND] Is status === BookingStatus.REJECTED? ${status === BookingStatus.REJECTED}`);

      // logger.info(`[BACKEND] Calling updateBookingStatus with status: ${status}`);

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
        // logger.warn(`[BACKEND] Booking ${bookingId} not found.`);
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send email notification to the booking user
      try {
        const bookingUser = await storage.getUser(booking.userId);
        if (bookingUser && bookingUser.email) {
          const emailTemplate = await bookingStatusUpdateEmailTemplate(booking, bookingUser, booking.status, 'Department Approver', config.frontendLoginUrl);
          sendEmail({
            to: bookingUser.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
        }
      } catch (emailError) {
        logger.error({ err: emailError }, `Failed to send email for booking ${booking.id} status update`);
      }

      // logger.info(`[BACKEND] Booking ${bookingId} status updated to: ${status}`);
      res.json(booking);
    } catch (error) {
      // logger.error("[BACKEND] Error in /api/bookings/:id/department-approval:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Create a new booking (Booking users)
  app.post("/api/bookings", authenticateJwt, checkRole([UserRole.BOOKING]), async (req, res) => {
    
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
      logger.info({ bookingData }, "Booking data received before creation");
      const booking = await storage.createBooking(bookingData);
      logger.info({ booking }, "Newly created booking");
      logger.info({ bookingId: booking.id }, "Booking successfully created in database");

      logger.info("Attempting to send email notifications...");
      // Send email notification to Department Approver
      try {
        const department = await storage.getDepartment(booking.department_id);
        logger.info({ department }, "Department fetched for booking");
        if (department) {
          const approvers = await storage.getDepartmentApprovers(department.id);
          logger.info({ approversCount: approvers.length, approvers: approvers.map(a => a.email) }, "Department approvers fetched");
          for (const approver of approvers) {
            if (approver.email) {
              const emailTemplate = await newBookingRequestEmailTemplate(booking, approver, department.name, config.frontendLoginUrl);
              logger.info({ to: approver.email, subject: emailTemplate.subject }, "Attempting to send email to approver");
              sendEmail({
                to: approver.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
              });
              logger.info({ to: approver.email }, "Email sent to approver");
            }
          }
        }
      } catch (emailError) {
        logger.error({ err: emailError }, `Failed to send email to Department Approver for new booking ${booking.id}`);
      }
      res.status(201).json(booking);

      // Send booking created email to the requestor
      try {
        const bookingUser = await storage.getUser(booking.userId);
        if (bookingUser && bookingUser.email) {
          const emailTemplate = await bookingCreatedEmailTemplate(booking, bookingUser, config.frontendLoginUrl);
          sendEmail({
            to: bookingUser.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
          logger.info({ email: bookingUser.email, bookingId: booking.id }, "Booking created email sent to requestor");
        }
      } catch (emailError) {
        logger.error({ err: emailError }, `Failed to send booking created email to requestor for booking ${booking.id}`);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      logger.error({ err: error }, "Error creating booking");
      res.status(500).json({ message: "Failed to create booking." });
    }
  });

  // Update booking status (Admin users)
  app.patch("/api/bookings/:id/status", authenticateJwt, checkRole([UserRole.ADMIN]), async (req, res) => {
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
          const emailTemplate = await bookingStatusUpdateEmailTemplate(booking, bookingUser, booking.status, 'Administrator', config.frontendLoginUrl);
          sendEmail({
            to: bookingUser.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
        }
      } catch (emailError) {
        logger.error({ err: emailError }, `Failed to send email for booking ${booking.id} status update`);
      }
      
      res.json(booking);
    } catch (error) {
      // logger.error("Error updating booking status:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

    

  // Resubmit booking (Booking users)
  app.post("/api/bookings/:id/resubmit", authenticateJwt, checkRole([UserRole.BOOKING]), async (req, res) => {
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

      // Send email notification to Department Approver
      try {
        const department = await storage.getDepartment(booking.department_id);
        if (department) {
          const approvers = await storage.getDepartmentApprovers(department.id);
          for (const approver of approvers) {
            if (approver.email) {
              const emailTemplate = await bookingResubmittedEmailTemplate(booking, approver, department.name, config.frontendLoginUrl);
              sendEmail({
                to: approver.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
              });
              logger.info({ to: approver.email, bookingId: booking.id }, "Booking resubmitted email sent to approver");
            }
          }
        }
      } catch (emailError) {
        logger.error({ err: emailError }, `Failed to send resubmitted email to Department Approver for booking ${booking.id}`);
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
  app.post("/api/bookings/:bookingId/guests", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.get("/api/bookings/:bookingId/guests", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const guests = await storage.getGuestsByBookingId(bookingId);
      res.json(guests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch guests" });
    }
  });

  // Update guest details (including KYC verification and check-in/out)
  app.patch("/api/guests/:guestId", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.delete("/api/guests/:guestId", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const guestId = parseInt(req.params.guestId);
      await storage.deleteGuest(guestId);
      res.status(204).send(); // No content
    } catch (error) {
      res.status(500).json({ message: "Failed to delete guest" });
    }
  });

  // Upload document for a guest
  app.post("/api/guests/:guestId/document", authenticateJwt, checkRole([UserRole.VFAST]), upload.single('file'), async (req, res) => {
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
  app.delete("/api/guests/:guestId/document", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.post("/api/guests/:guestId/check-in", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
        // logger.info(`Updated booking ${guest.bookingId} with firstCheckedInGuestName: ${guest.name}`);
      } else if (booking) {
        // logger.info(`Booking ${guest.bookingId} already has firstCheckedInGuestName: ${booking.firstCheckedInGuestName}`);
      }
      
      await storage.updateBooking(guest.bookingId, { keyHandedOver: true });
      res.json(guest);
    } catch (error) {
      // logger.error("Error in /api/guests/:guestId/check-in:", error);
      res.status(500).json({ message: "Failed to check-in guest" });
    }
  });

  // Check-out a guest
  app.post("/api/guests/:guestId/check-out", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.post("/api/guests/:guestId/kyc", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.post("/api/guests/:guestId/documents", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.post("/api/guests/:guestId/notes", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.get("/api/guests/:guestId/notes", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.patch("/api/bookings/:id/workflow-stage", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.patch("/api/bookings/:id/check-in", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.patch("/api/bookings/:id/check-out", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.patch("/api/bookings/:id/allocate", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      // logger.info(`[SERVER] Received allocation request for booking ID: ${req.params.id}`);
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
      
            // Send email notification to the booking user
            try {
              const bookingUser = await storage.getUser(booking.userId);
              if (bookingUser && bookingUser.email) {
                const emailTemplate = await roomAllocatedEmailTemplate(booking, bookingUser, config.frontendLoginUrl);
                sendEmail({
                  to: bookingUser.email,
                  subject: emailTemplate.subject,
                  html: emailTemplate.html,
                  text: emailTemplate.text,
                });
              }
            } catch (emailError) {
              logger.error({ err: emailError }, `Failed to send email to booking user for room allocation of booking ${booking.id}`);
            }
      
            res.json(booking);    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to allocate room" });
    }
  });

  // Get approved bookings (for VFast room allocation)
  app.get("/api/bookings/approved", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    try {
      const bookings = await storage.getBookingsByStatus(BookingStatus.APPROVED);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch approved bookings", error: error.message });
    }
  });
  
  // Get reconsideration requests (for VFast review)
  app.get("/api/bookings/reconsideration", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
    // logger.info("Backend: /api/bookings/reconsideration route handler entered.");
    try {
      const bookings = await storage.getBookingsByStatus(BookingStatus.PENDING_RECONSIDERATION);
      // logger.info("Backend: /api/bookings/reconsideration - Found bookings:", bookings.length);
      res.json(bookings);
    } catch (error) {
      // logger.error("Backend: Error in /api/bookings/reconsideration:", error);
      res.status(500).json({ message: "Failed to fetch reconsideration requests", error: (error as Error).message });
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
  app.patch("/api/rooms/:id/status", authenticateJwt, checkRole([UserRole.ADMIN, UserRole.VFAST]), async (req, res) => {
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
  app.post("/api/rooms/:roomId/maintenance", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.patch("/api/room-maintenance/:maintenanceId/status", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.get("/api/rooms/maintenance/active", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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
  app.post("/api/bookings/:bookingId/document", authenticateJwt, checkRole([UserRole.VFAST]), (req, res, next) => {
    // logger.info("Booking document upload route hit!");
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        // logger.error("Multer error:", err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      // logger.info("Parsed bookingId:", bookingId);
      const file = req.file;
      // logger.info("File object from Multer:", file);

      if (!file) {
        // logger.error("No file uploaded after Multer processing.");
        return res.status(400).json({ message: "No file uploaded" });
      }

      // logger.info("Updating booking with documentPath:", file.path);
      const booking = await storage.updateBooking(bookingId, { documentPath: file.path });

      if (!booking) {
        // logger.error("Booking not found for ID:", bookingId);
        return res.status(404).json({ message: "Booking not found" });
      }

      // logger.info("Booking updated successfully:", booking.id);
      res.json(booking);
    } catch (error) {
      // logger.error("Error in booking document upload (after Multer):", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Delete document for a booking
  app.delete("/api/bookings/:bookingId/document", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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

  app.patch("/api/bookings/:id", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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

  app.post("/api/bookings/:bookingId/checkout-all", authenticateJwt, checkRole([UserRole.VFAST]), async (req, res) => {
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