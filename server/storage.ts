import {
  User, InsertUser, UserRole,
  Booking, InsertBooking, UpdateBookingStatus, RoomAllocation,
  Room, InsertRoom, RoomStatus,
  BookingStatus,
  Department,
  Guest, InsertGuest,
  RoomMaintenance, InsertRoomMaintenance,
  GuestNote, InsertGuestNote,
  GuestCheckInStatus, WorkflowStage, RoomMaintenanceStatus,
  users,
  bookings,
  departments,
  rooms,
  guests,
  roomMaintenance,
  guestNotes,
  auditLogs
} from "@shared/schema";
import { eq, and, or, lt, gt, lte, gte, sql, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { sendEmail } from "./email";
import { welcomeEmailTemplate, newBookingRequestEmailTemplate, bookingStatusUpdateEmailTemplate, roomAllocatedEmailTemplate, bookingCreatedEmailTemplate, bookingForAllocationEmailTemplate, bookingRejectedByAdminEmailTemplate, bookingResubmittedEmailTemplate } from './email-templates';
import { FRONTEND_BASE_URL } from './config';

import logger from "./logger";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getDepartmentApprovers(departmentId: number): Promise<User[]>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByUserId(userId: number): Promise<Booking[]>;
  getBookingsByUserIdAndStatus(userId: number, status: BookingStatus): Promise<Booking[]>;
  getAllBookings(): Promise<any[]>;
  getBookingsByStatus(status: BookingStatus): Promise<Booking[]>;
  getBookingsByDepartment(departmentId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(params: UpdateBookingStatus, role?: UserRole): Promise<Booking | undefined>;
  reconsiderBooking(bookingId: number, bookingData: InsertBooking): Promise<Booking | undefined>;
  updateBooking(bookingId: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  getBookingJourney(bookingId: number): Promise<any>;
  updateBookingWorkflowStage(bookingId: number, stage: WorkflowStage, checkInStatus?: GuestCheckInStatus): Promise<Booking | undefined>;
  getBookingsByWorkflowStage(stage: WorkflowStage): Promise<Booking[]>;
  
  allocateRoom(params: RoomAllocation): Promise<Booking | undefined>;
  allocateMultipleRooms(bookingId: number, roomIds: number[], notes?: string): Promise<Booking | undefined>;
  
  // Guest operations
  createGuest(guest: InsertGuest): Promise<Guest>;
  getGuest(guestId: number): Promise<Guest | undefined>;
  getGuestsByBookingId(bookingId: number): Promise<Guest[]>;
  updateGuest(guestId: number, updates: Partial<Guest>): Promise<Guest | undefined>;
  deleteGuest(guestId: number): Promise<void>;
  uploadDocument(file: string): Promise<string>;
  checkOutAllGuests(bookingId: number): Promise<Booking | undefined>;

  // Guest Note operations
  createGuestNote(note: InsertGuestNote): Promise<GuestNote>;
  getGuestNotesByGuestId(guestId: number): Promise<GuestNote[]>;

  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  getAllRooms(): Promise<any[]>;
  getAvailableRoomsByType(type: string): Promise<Room[]>;
  getAllAvailableRooms(): Promise<Room[]>;
  getAllocatedBookings(): Promise<any[]>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoomStatus(id: number, status: RoomStatus, notes?: string, userId?: number): Promise<Room | undefined>;
  
  // Room Maintenance operations
  createRoomMaintenance(maintenance: InsertRoomMaintenance): Promise<RoomMaintenance>;
  updateRoomMaintenanceStatus(id: number, status: RoomMaintenanceStatus): Promise<RoomMaintenance | undefined>;
  getRoomMaintenanceByRoomId(roomId: number): Promise<RoomMaintenance[]>;
  getActiveRoomMaintenance(): Promise<RoomMaintenance[]>;

  // Session store
  sessionStore: session.Store;

  // Department operations
  getAllDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  getTotalUsers(): Promise<number>;
  getTotalDepartments(): Promise<number>;

  // Stats
  getVFastAllocationStats(): Promise<any>;

  // Audit Log operations
  createAuditLog(tableName: string, recordId: string, action: string, userId?: string, details?: string): Promise<void>;
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
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getUser for ID ${id}`);
      throw new Error("Failed to retrieve user.");
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await this.dbClient.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getUserByEmail for email ${email}`);
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
    } catch (error: any) {
      // logger.error({ err: error }, "Error in createUser");
      throw new Error("Failed to create user.");
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const [user] = await this.dbClient
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateUser for ID ${id}`);
      throw new Error("Failed to update user.");
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.dbClient.select().from(users);
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getAllUsers");
      throw new Error("Failed to retrieve all users.");
    }
  }

  async getDepartmentApprovers(departmentId: number): Promise<User[]> {
    try {
      logger.info({ departmentId }, "Fetching department approvers for department ID");
      const approvers = await this.dbClient.select().from(users).where(and(eq(users.role, UserRole.DEPARTMENT_APPROVER), eq(users.department_id, departmentId)));
      logger.info({ approversCount: approvers.length, departmentId }, "Found department approvers");
      return approvers;
    } catch (error: any) {
      logger.error({ err: error, departmentId }, `Error in getDepartmentApprovers for department ID ${departmentId}`);
      throw new Error("Failed to retrieve department approvers.");
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      logger.info({ role }, "Fetching users by role");
      const usersByRole = await this.dbClient.select().from(users).where(eq(users.role, role));
      logger.info({ usersCount: usersByRole.length, role }, "Found users by role");
      return usersByRole;
    } catch (error: any) {
      logger.error({ err: error, role }, `Error in getUsersByRole for role ${role}`);
      throw new Error("Failed to retrieve users by role.");
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await this.dbClient.delete(users).where(eq(users.id, id));
    } catch (error: any) {
      // logger.error({ err: error }, `Error in deleteUser for ID ${id}`);
      throw new Error("Failed to delete user.");
    }
  }

  // Booking Operations
  async getBooking(id: number): Promise<Booking | undefined> {
    try {
      // logger.info({ id }, "getBooking ID");
      const [booking] = await this.dbClient.select({
        id: bookings.id,
        userId: bookings.userId,
        purpose: bookings.purpose,
        guestCount: bookings.guestCount,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        department_id: bookings.department_id,
        specialRequests: bookings.specialRequests,
        status: bookings.status,
        roomNumber: bookings.roomNumber,
        adminNotes: bookings.adminNotes,
        vfastNotes: bookings.vfastNotes,
        departmentNotes: bookings.departmentNotes,
        departmentApproverId: bookings.departmentApproverId,
        adminApproverId: bookings.adminApproverId,
        departmentApprovalAt: bookings.departmentApprovalAt,
        adminApprovalAt: bookings.adminApprovalAt,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        rejectionHistory: bookings.rejectionHistory,
        isReconsidered: bookings.isReconsidered,
        reconsiderationCount: bookings.reconsiderationCount,
        reconsideredFromId: bookings.reconsideredFromId,
        isDeleted: bookings.isDeleted,
        currentWorkflowStage: bookings.currentWorkflowStage,
        checkInStatus: bookings.checkInStatus,
        documentPath: bookings.documentPath,
        keyHandedOver: bookings.keyHandedOver,
        firstCheckedInGuestName: bookings.firstCheckedInGuestName,
        departmentName: departments.name,
      }).from(bookings).where(eq(bookings.id, id)).leftJoin(departments, eq(bookings.department_id, departments.id));
      return booking;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getBooking for ID ${id}`);
      throw new Error("Failed to retrieve booking.");
    }
  }

  async getBookingsByUserId(userId: number): Promise<any[]> {
    try {
      const result = await this.dbClient.select({
        id: bookings.id,
        userId: bookings.userId,
        purpose: bookings.purpose,
        guestCount: bookings.guestCount,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        department_id: bookings.department_id,
        specialRequests: bookings.specialRequests,
        status: bookings.status,
        roomNumber: bookings.roomNumber,
        adminNotes: bookings.adminNotes,
        vfastNotes: bookings.vfastNotes,
        departmentNotes: bookings.departmentNotes,
        departmentApproverId: bookings.departmentApproverId,
        adminApproverId: bookings.adminApproverId,
        departmentApprovalAt: bookings.departmentApprovalAt,
        adminApprovalAt: bookings.adminApprovalAt,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        rejectionHistory: bookings.rejectionHistory,
        isReconsidered: bookings.isReconsidered,
        reconsiderationCount: bookings.reconsiderationCount,
        reconsideredFromId: bookings.reconsideredFromId,
        isDeleted: bookings.isDeleted,
        currentWorkflowStage: bookings.currentWorkflowStage,
        checkInStatus: bookings.checkInStatus,
        documentPath: bookings.documentPath,
        keyHandedOver: bookings.keyHandedOver,
        firstCheckedInGuestName: bookings.firstCheckedInGuestName,
        departmentName: departments.name
      }).from(bookings).where(eq(bookings.userId, userId)).leftJoin(departments, eq(bookings.department_id, departments.id));
      // logger.info({ result }, 'getBookingsByUserId result');
      return result;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getBookingsByUserId for user ID ${userId}`);
      throw new Error("Failed to retrieve user bookings.");
    }
  }

  async getBookingsByUserIdAndStatus(userId: number, status: BookingStatus): Promise<any[]> {
    try {
      const result = await this.dbClient.select({
        id: bookings.id,
        userId: bookings.userId,
        purpose: bookings.purpose,
        guestCount: bookings.guestCount,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        department_id: bookings.department_id,
        specialRequests: bookings.specialRequests,
        status: bookings.status,
        roomNumber: bookings.roomNumber,
        adminNotes: bookings.adminNotes,
        vfastNotes: bookings.vfastNotes,
        departmentNotes: bookings.departmentNotes,
        departmentApproverId: bookings.departmentApproverId,
        adminApproverId: bookings.adminApproverId,
        departmentApprovalAt: bookings.departmentApprovalAt,
        adminApprovalAt: bookings.adminApprovalAt,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        rejectionHistory: bookings.rejectionHistory,
        isReconsidered: bookings.isReconsidered,
        reconsiderationCount: bookings.reconsiderationCount,
        reconsideredFromId: bookings.reconsideredFromId,
        isDeleted: bookings.isDeleted,
        currentWorkflowStage: bookings.currentWorkflowStage,
        checkInStatus: bookings.checkInStatus,
        documentPath: bookings.documentPath,
        keyHandedOver: bookings.keyHandedOver,
        firstCheckedInGuestName: bookings.firstCheckedInGuestName,
        departmentName: departments.name
      }).from(bookings).where(and(eq(bookings.userId, userId), eq(bookings.status, status))).leftJoin(departments, eq(bookings.department_id, departments.id));
      // logger.info({ result }, 'getBookingsByUserIdAndStatus result');
      return result;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getBookingsByUserIdAndStatus for user ID ${userId} and status ${status}`);
      throw new Error("Failed to retrieve user bookings by status.");
    }
  }

  async getAllBookings(): Promise<any[]> {
    try {
      return await this.dbClient.select({
        id: bookings.id,
        userId: bookings.userId,
        purpose: bookings.purpose,
        guestCount: bookings.guestCount,
        checkInDate: bookings.checkInDate,
        checkOutDate: bookings.checkOutDate,
        department_id: bookings.department_id,
        specialRequests: bookings.specialRequests,
        status: bookings.status,
        roomNumber: bookings.roomNumber,
        adminNotes: bookings.adminNotes,
        vfastNotes: bookings.vfastNotes,
        departmentNotes: bookings.departmentNotes,
        departmentApproverId: bookings.departmentApproverId,
        adminApproverId: bookings.adminApproverId,
        departmentApprovalAt: bookings.departmentApprovalAt,
        adminApprovalAt: bookings.adminApprovalAt,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        rejectionHistory: bookings.rejectionHistory,
        isReconsidered: bookings.isReconsidered,
        reconsiderationCount: bookings.reconsiderationCount,
        reconsideredFromId: bookings.reconsideredFromId,
        isDeleted: bookings.isDeleted,
        currentWorkflowStage: bookings.currentWorkflowStage,
        checkInStatus: bookings.checkInStatus,
        documentPath: bookings.documentPath,
        keyHandedOver: bookings.keyHandedOver,
        firstCheckedInGuestName: bookings.firstCheckedInGuestName,
        departmentName: departments.name,
        requester_name: users.name,
      }).from(bookings).where(eq(bookings.isDeleted, false)).leftJoin(departments, eq(bookings.department_id, departments.id)).leftJoin(users, eq(bookings.userId, users.id));
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getAllBookings");
      throw new Error("Failed to retrieve all bookings.");
    }
  }

  async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    try {
      // logger.info({ status }, `Executing query for getBookingsByStatus`);
      const result = await this.dbClient.select().from(bookings).where(eq(bookings.status, status));
      // logger.info({ status, count: result.length }, `getBookingsByStatus found bookings`);
      return result;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getBookingsByStatus for status ${status}`);
      throw new Error("Failed to retrieve bookings by status.");
    }
  }

  async getBookingsByWorkflowStage(stage: WorkflowStage): Promise<Booking[]> {
    try {
      // logger.info({ stage }, `Executing query for workflow stage`);
      const result = await this.dbClient.select().from(bookings).where(eq(bookings.currentWorkflowStage, stage));
      // logger.info({ result }, 'getBookingsByWorkflowStage result');
      return result;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getBookingsByWorkflowStage for stage ${stage}`);
      throw new Error("Failed to retrieve bookings by workflow stage.");
    }
  }

  async getBookingsByDepartment(departmentId: number): Promise<Booking[]> {
    try {
      // logger.info({ departmentId }, `Executing query for departmentId`);
      const result = await this.dbClient.select().from(bookings).where(eq(bookings.department_id, departmentId));
      // logger.info({ result }, 'getBookingsByDepartment result');
      return result;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getBookingsByDepartment");
      throw new Error("Failed to retrieve department-specific bookings.");
    }
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    try {
      const [booking] = await this.dbClient
        .insert(bookings)
        .values({ ...insertBooking, currentWorkflowStage: WorkflowStage.PENDING_APPROVALS })
        .returning();
      return booking;
    } catch (error: any) {
      // logger.error({ err: error }, "Storage: Error in createBooking");
      throw new Error("Failed to create booking.");
    }
  }

  async updateBookingStatus(params: UpdateBookingStatus, role?: UserRole): Promise<Booking | undefined> {
    try {
      const { id, status, notes, approverId } = params;

      const currentBooking = await this.getBooking(id);
      if (!currentBooking) {
        throw new Error(`Booking with ID ${id} not found`);
      }

      const updateSet: Partial<Booking> = {};

      if (status === BookingStatus.REJECTED) {
        const rejectionEntry = {
          reason: notes,
          rejectedBy: approverId,
          rejectedAt: new Date(),
        };
        updateSet.rejectionHistory = [...(currentBooking.rejectionHistory as any[] || []), rejectionEntry];
        updateSet.status = BookingStatus.PENDING_RECONSIDERATION;
        updateSet.currentWorkflowStage = WorkflowStage.REJECTED;
        updateSet.isReconsidered = true;
        updateSet.reconsiderationCount = (currentBooking.reconsiderationCount || 0) + 1;
      } else if (status === BookingStatus.APPROVED) {
        if (role === UserRole.ADMIN) {
          if (currentBooking.status !== BookingStatus.PENDING_ADMIN_APPROVAL) {
            throw new Error("Booking is not pending admin approval");
          }
          updateSet.status = BookingStatus.APPROVED;
          updateSet.adminNotes = notes;
          updateSet.adminApproverId = approverId;
          updateSet.adminApprovalAt = new Date();
          updateSet.currentWorkflowStage = WorkflowStage.ALLOCATION_PENDING;
        } else if (role === UserRole.DEPARTMENT_APPROVER) {
          if (currentBooking.status !== BookingStatus.PENDING_DEPARTMENT_APPROVAL) {
            throw new Error("Booking is not pending department approval");
          }
          updateSet.status = BookingStatus.PENDING_ADMIN_APPROVAL;
          updateSet.departmentNotes = notes;
          updateSet.departmentApproverId = approverId;
          updateSet.departmentApprovalAt = new Date();
        }
      } else if (status === BookingStatus.ALLOCATED) {
        updateSet.status = BookingStatus.ALLOCATED;
        updateSet.currentWorkflowStage = WorkflowStage.ALLOCATED;
        updateSet.vfastNotes = notes;
      } else {
        updateSet.status = status;
      }

      const [booking] = await this.dbClient
        .update(bookings)
        .set(updateSet)
        .where(eq(bookings.id, id))
        .returning();

      await this.createAuditLog("bookings", booking.id.toString(), "update_status", approverId?.toString(), `Status changed to ${status}`);

      // Send email notification to the booking user
      const user = await this.getUser(booking.userId);
      if (user) {
        const approverRole = role === UserRole.ADMIN ? 'Administrator' : 'Department Approver';
        const emailTemplate = await bookingStatusUpdateEmailTemplate(booking, user, booking.status, approverRole, config.frontendLoginUrl);
        sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }

      // Send email notification to admin users if the booking is pending admin approval
      if (booking.status === BookingStatus.PENDING_ADMIN_APPROVAL) {
        const admins = await this.getUsersByRole(UserRole.ADMIN);
        for (const admin of admins) {
          if (admin.email) {
            const department = await this.getDepartment(booking.department_id);
            const emailTemplate = await newBookingRequestEmailTemplate(booking, admin, department?.name || 'N/A', config.frontendLoginUrl);
            sendEmail({
              to: admin.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            });
          }
        }
      }

      // Gap 2: Send email notification to VFAST team if the booking is approved by admin
      if (booking.status === BookingStatus.APPROVED && role === UserRole.ADMIN) {
        const vfastUsers = await this.getUsersByRole(UserRole.VFAST);
        for (const vfastUser of vfastUsers) {
          if (vfastUser.email) {
            const emailTemplate = await bookingForAllocationEmailTemplate(booking, config.frontendLoginUrl);
            sendEmail({
              to: vfastUser.email,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
              text: emailTemplate.text,
            });
          }
        }
      }

      // Gap 3: Send email notification to Department Approver if the booking is rejected by admin
      if (booking.status === BookingStatus.PENDING_RECONSIDERATION && role === UserRole.ADMIN && currentBooking.departmentApproverId) {
        const departmentApprover = await this.getUser(currentBooking.departmentApproverId);
        if (departmentApprover && departmentApprover.email) {
          const department = await this.getDepartment(booking.department_id);
          const emailTemplate = await bookingRejectedByAdminEmailTemplate(booking, departmentApprover, department?.name || 'N/A', config.frontendLoginUrl);
          sendEmail({
            to: departmentApprover.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
        }
      }

      return booking;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateBookingStatus for ID ${params.id}`);
      throw new Error(`Failed to update booking status for booking with ID ${params.id}. Error: ${error.message}`);
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
    } catch (error: any) {
      // logger.error({ err: error }, `Error in reconsiderBooking for booking ID ${bookingId}`);
      throw new Error("Failed to reconsider booking.");
    }
  }

  async updateBooking(bookingId: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    try {
      const [booking] = await this.dbClient
        .update(bookings)
        .set(updates)
        .where(eq(bookings.id, bookingId))
        .returning();
      return booking;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateBooking for ID ${bookingId}`);
      throw new Error("Failed to update booking.");
    }
  }

    async getBookingJourney(bookingId: number): Promise<any> {
      try {
        const booking = await this.getBooking(bookingId);
        if (!booking) {
          return null;
        }
  
        const userIdsToFetch: Set<number> = new Set();
        userIdsToFetch.add(booking.userId);
        if (booking.departmentApproverId) userIdsToFetch.add(booking.departmentApproverId);
        if (booking.adminApproverId) userIdsToFetch.add(booking.adminApproverId);
        if (booking.rejectionHistory) {
          for (const rejection of booking.rejectionHistory as any[]) {
            if (rejection.rejectedBy) userIdsToFetch.add(rejection.rejectedBy);
          }
        }
  
        const usersMap = new Map<number, User>();
        if (userIdsToFetch.size > 0) {
          const fetchedUsers = await this.dbClient.select().from(users).where(inArray(users.id, Array.from(userIdsToFetch)));
          fetchedUsers.forEach(user => usersMap.set(user.id, user));
        }
  
        const journey: any[] = [];
  
        // Booking Creation
        const creator = usersMap.get(booking.userId);
        journey.push({
          stage: "Booking Creation",
          status: "Submitted",
          actor: creator ? { id: creator.id, name: creator.name } : null,
          timestamp: booking.createdAt,
          notes: null,
        });
  
        // Department Approval
        if (booking.departmentApproverId) {
          const approver = usersMap.get(booking.departmentApproverId);
          journey.push({
            stage: "Department Approval",
            status: booking.status === BookingStatus.PENDING_ADMIN_APPROVAL || booking.status === BookingStatus.APPROVED || booking.status === BookingStatus.ALLOCATED ? "Approved" : "Pending",
            actor: approver ? { id: approver.id, name: approver.name } : null,
            timestamp: booking.departmentApprovalAt,
            notes: booking.departmentNotes,
          });
        }
  
        // Admin Approval
        if (booking.adminApproverId) {
          const approver = usersMap.get(booking.adminApproverId);
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
          for (const rejection of booking.rejectionHistory as any[]) {
            const rejecter = usersMap.get(rejection.rejectedBy);
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
            actor: null,
            timestamp: booking.updatedAt,
            notes: booking.vfastNotes,
          });
        }
  
        // Sort journey by timestamp
        journey.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
        return journey;
      } catch (error: any) {
        // logger.error({ err: error }, `Error in getBookingJourney for booking ID ${bookingId}`);
        throw new Error("Failed to retrieve booking journey.");
      }
    }
  async updateBookingWorkflowStage(bookingId: number, stage: WorkflowStage, checkInStatus?: GuestCheckInStatus): Promise<Booking | undefined> {
    try {
      const updateSet: Partial<Booking> = { currentWorkflowStage: stage };
      if (checkInStatus) {
        updateSet.checkInStatus = checkInStatus;
      }
      const [booking] = await this.dbClient
        .update(bookings)
        .set(updateSet)
        .where(eq(bookings.id, bookingId))
        .returning();
      return booking;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateBookingWorkflowStage for ID ${bookingId}`);
      throw new Error("Failed to update booking workflow stage.");
    }
  }

  async updateBookingCheckInStatus(bookingId: number, status: GuestCheckInStatus): Promise<Booking | undefined> {
    try {
      const currentBooking = await this.getBooking(bookingId);
      if (!currentBooking) {
        throw new Error("Booking not found");
      }

      const updateSet: Partial<Booking> = { checkInStatus: status };
      let roomUpdateSet: Partial<Room> = {};

      if (status === GuestCheckInStatus.CHECKED_IN) {
        updateSet.currentWorkflowStage = WorkflowStage.CHECKED_IN;
        // Room status remains OCCUPIED if already allocated
      } else if (status === GuestCheckInStatus.CHECKED_OUT) {
        updateSet.currentWorkflowStage = WorkflowStage.CHECKED_OUT;
        roomUpdateSet = { status: RoomStatus.AVAILABLE };
      }

      // Begin transaction
      const client = await this.poolClient.connect();
      try {
        await client.query('BEGIN');
        
        const [updatedBooking] = await this.dbClient
          .update(bookings)
          .set(updateSet)
          .where(eq(bookings.id, bookingId))
          .returning();

        if (roomUpdateSet.status && currentBooking.roomNumber) {
          await this.dbClient
            .update(rooms)
            .set(roomUpdateSet)
            .where(eq(rooms.roomNumber, currentBooking.roomNumber))
            .execute();
        }
        
        await client.query('COMMIT');
        return updatedBooking;
      } catch (error: any) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateBookingCheckInStatus for ID ${bookingId}`);
      throw new Error("Failed to update booking check-in status.");
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

      // Verify room exists and is available and not under maintenance
      const room = await this.getRoomByNumber(roomNumber);
      if (!room || room.status !== RoomStatus.AVAILABLE) {
        throw new Error("Room not available");
      }

      const activeMaintenance = await this.dbClient.select().from(roomMaintenance).where(
        and(
          eq(roomMaintenance.roomId, room.id),
          eq(roomMaintenance.status, RoomMaintenanceStatus.IN_PROGRESS)
        )
      );

      if (activeMaintenance.length > 0) {
        throw new Error("Room is currently under maintenance and cannot be allocated.");
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
            vfastNotes: notes,
            currentWorkflowStage: WorkflowStage.ALLOCATED
          };
        const [updatedBooking] = await this.dbClient
          .update(bookings)
          .set(bookingUpdateSet)
          .where(eq(bookings.id, bookingId))
          .returning();

        await this.createAuditLog("bookings", updatedBooking.id.toString(), "allocate_room", undefined, `Room ${roomNumber} allocated`);

        // Send email notification
        const user = await this.getUser(updatedBooking.userId);
        if (user) {
          const emailTemplate = await roomAllocatedEmailTemplate(updatedBooking, user, config.frontendLoginUrl);
          sendEmail({
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });
        }

        await client.query('COMMIT');
        return updatedBooking;
      } catch (error: any) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      throw new Error("Failed to allocate room.");
    }
  }

  async allocateMultipleRooms(bookingId: number, roomIds: number[], notes?: string): Promise<Booking | undefined> {
    const client = await this.poolClient.connect();
    try {
      await client.query('BEGIN');

      // Clear existing allocations for this booking
      await this.dbClient.delete(booking_rooms).where(eq(booking_rooms.bookingId, bookingId));

      // Allocate new rooms
      const allocatedRoomNumbers: string[] = [];
      for (const roomId of roomIds) {
        const room = await this.getRoom(roomId);
        if (!room || room.status !== RoomStatus.AVAILABLE) {
          throw new Error(`Room with ID ${roomId} is not available.`);
        }
        await this.dbClient.insert(booking_rooms).values({ bookingId, roomId });
        await this.dbClient.update(rooms).set({ status: RoomStatus.OCCUPIED }).where(eq(rooms.id, roomId));
        allocatedRoomNumbers.push(room.roomNumber);
      }

      // Update booking status and notes
      const bookingUpdateSet = {
        status: BookingStatus.ALLOCATED,
        vfastNotes: notes,
        currentWorkflowStage: WorkflowStage.ALLOCATED,
        roomNumber: allocatedRoomNumbers.join(', '), // For backward compatibility
      };
      const [updatedBooking] = await this.dbClient
        .update(bookings)
        .set(bookingUpdateSet)
        .where(eq(bookings.id, bookingId))
        .returning();

      await this.createAuditLog("bookings", updatedBooking.id.toString(), "allocate_multiple_rooms", undefined, `Rooms ${allocatedRoomNumbers.join(', ')} allocated`);

      // Send email notification
      const user = await this.getUser(updatedBooking.userId);
      if (user) {
        const emailTemplate = await roomAllocatedEmailTemplate(updatedBooking, user, config.frontendLoginUrl);
        sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }

      await client.query('COMMIT');
      return updatedBooking;
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to allocate multiple rooms. Error: ${error.message}`);
    } finally {
      client.release();
    }
  }


  // Guest Operations
  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    try {
      const [guest] = await this.dbClient
        .insert(guests)
        .values(insertGuest)
        .returning();
      return guest;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in createGuest");
      throw new Error("Failed to create guest.");
    }
  }

  async getGuest(guestId: number): Promise<Guest | undefined> {
    try {
      const [guest] = await this.dbClient.select().from(guests).where(eq(guests.id, guestId));
      return guest;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getGuest for ID ${guestId}`);
      throw new Error("Failed to retrieve guest.");
    }
  }

  async getGuestsByBookingId(bookingId: number): Promise<Guest[]> {
    try {
      return await this.dbClient.select({
        id: guests.id,
        bookingId: guests.bookingId,
        name: guests.name,
        contact: guests.contact,
        kycDocumentUrl: guests.kycDocumentUrl,
        isVerified: guests.isVerified,
        checkedIn: guests.checkedIn,
        checkInTime: guests.checkInTime,
        checkOutTime: guests.checkOutTime,
        origin: guests.origin,
        spocName: guests.spocName,
        spocContact: guests.spocContact,
        foodPreferences: guests.foodPreferences,
        otherSpecialRequests: guests.otherSpecialRequests,
        keyHandedOver: guests.keyHandedOver,
        citizenCategory: guests.citizenCategory,
        travelDetails: guests.travelDetails,
        passportNumber: guests.passportNumber,
        nationality: guests.nationality,
        otherNationality: guests.otherNationality,
      }).from(guests).where(eq(guests.bookingId, bookingId));
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getGuestsByBookingId for booking ID ${bookingId}`);
      throw new Error("Failed to retrieve guests for booking.");
    }
  }

  async updateGuest(guestId: number, updates: Partial<Guest>): Promise<Guest | undefined> {
    try {
      const [guest] = await this.dbClient
        .update(guests)
        .set(updates)
        .where(eq(guests.id, guestId))
        .returning();
      return guest;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateGuest for ID ${guestId}`);
      throw new Error("Failed to update guest.");
    }
  }

  async deleteGuest(guestId: number): Promise<void> {
    try {
      await this.dbClient.delete(guests).where(eq(guests.id, guestId));
    } catch (error: any) {
      // logger.error({ err: error }, `Error in deleteGuest for ID ${guestId}`);
      throw new Error("Failed to delete guest.");
    }
  }

  async uploadDocument(file: string): Promise<string> {
    // Mock implementation: In a real application, this would upload the file to a storage service (e.g., S3, Azure Blob Storage)
    // and return the URL. For now, we'll just return a dummy URL.
    // logger.info({ file }, `Mocking document upload for file`);
    return `https://example.com/documents/${Date.now()}-${file.substring(0, 10)}.pdf`;
  }

  async checkOutAllGuests(bookingId: number): Promise<Booking | undefined> {
    const client = await this.poolClient.connect();
    try {
      await client.query('BEGIN');

      // Update all guests to checked-out
      await this.dbClient
        .update(guests)
        .set({ checkedIn: false, checkOutTime: new Date() })
        .where(eq(guests.bookingId, bookingId));

      // Update booking status
      const [booking] = await this.dbClient
        .update(bookings)
        .set({ 
          checkInStatus: GuestCheckInStatus.CHECKED_OUT,
          currentWorkflowStage: WorkflowStage.CHECKED_OUT 
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      // Update room status to available
      if (booking && booking.roomNumber) {
        await this.dbClient
          .update(rooms)
          .set({ status: RoomStatus.AVAILABLE })
          .where(eq(rooms.roomNumber, booking.roomNumber));
      }

      await client.query('COMMIT');
      return booking;
    } catch (error: any) {
      await client.query('ROLLBACK');
      // logger.error({ err: error }, `Error in checkOutAllGuests for booking ID ${bookingId}`);
      throw new Error("Failed to check out all guests.");
    } finally {
      client.release();
    }
  }

  // Guest Note Operations
  async createGuestNote(insertNote: InsertGuestNote): Promise<GuestNote> {
    try {
      const [note] = await this.dbClient
        .insert(guestNotes)
        .values(insertNote)
        .returning();
      return note;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in createGuestNote");
      throw new Error("Failed to create guest note.");
    }
  }

  async getGuestNotesByGuestId(guestId: number): Promise<GuestNote[]> {
    try {
      return await this.dbClient.select().from(guestNotes).where(eq(guestNotes.guestId, guestId)).orderBy(guestNotes.timestamp);
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getGuestNotesByGuestId for guest ID ${guestId}`);
      throw new Error("Failed to retrieve guest notes.");
    }
  }



  // Room Operations
  async getRoom(id: number): Promise<Room | undefined> {
    try {
      const [room] = await this.dbClient.select().from(rooms).where(eq(rooms.id, id));
      return room;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getRoom for ID ${id}`);
      throw new Error("Failed to retrieve room.");
    }
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    try {
      const [room] = await this.dbClient.select().from(rooms).where(eq(rooms.roomNumber, roomNumber));
      return room;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getRoomByNumber for room number ${roomNumber}`);
      throw new Error("Failed to retrieve room by number.");
    }
  }

  async getAllRooms(): Promise<any[]> {
    try {
      return await this.dbClient.select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        type: rooms.type,
        floor: rooms.floor,
        status: rooms.status,
        features: rooms.features,
        reservedBy: rooms.reservedBy,
        reservedAt: rooms.reservedAt,
        reservationNotes: rooms.reservationNotes,
        reservedByName: users.name
      }).from(rooms).leftJoin(users, eq(rooms.reservedBy, users.id));
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getAllRooms");
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
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getAvailableRoomsByType for type ${type}`);
      throw new Error("Failed to retrieve available rooms by type.");
    }
  }
  
  async getAllAvailableRooms(): Promise<Room[]> {
    try {
      const availableRooms = await this.dbClient
        .select()
        .from(rooms)
        .where(eq(rooms.status, RoomStatus.AVAILABLE));
      // logger.info({ availableRooms }, "getAllAvailableRooms result");
      return availableRooms;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getAllAvailableRooms");
      throw new Error("Failed to retrieve all available rooms.");
    }
  }

  async getAllocatedBookings(): Promise<any[]> {
    try {
      const result = await this.dbClient
        .select({
          id: bookings.id,
          userId: bookings.userId,
          purpose: bookings.purpose,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          department_id: bookings.department_id,
          specialRequests: bookings.specialRequests,
          status: bookings.status,
          roomNumber: bookings.roomNumber,
          adminNotes: bookings.adminNotes,
          vfastNotes: bookings.vfastNotes,
          departmentNotes: bookings.departmentNotes,
          departmentApproverId: bookings.departmentApproverId,
          adminApproverId: bookings.adminApproverId,
          departmentApprovalAt: bookings.departmentApprovalAt,
          adminApprovalAt: bookings.adminApprovalAt,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          rejectionHistory: bookings.rejectionHistory,
          isReconsidered: bookings.isReconsidered,
          reconsiderationCount: bookings.reconsiderationCount,
          reconsideredFromId: bookings.reconsideredFromId,
          isDeleted: bookings.isDeleted,
          currentWorkflowStage: bookings.currentWorkflowStage,
          checkInStatus: bookings.checkInStatus,
          documentPath: bookings.documentPath,
          keyHandedOver: bookings.keyHandedOver,
          firstCheckedInGuestName: bookings.firstCheckedInGuestName,
          userName: users.name,
          firstGuestName: sql<string>`(array_agg(${guests.name} ORDER BY ${guests.id}))[1]`.as('firstGuestName'),
          guestCount: sql<number>`count(${guests.id})`.as('guestCount'),
        })
        .from(bookings)
        .where(or(
          eq(bookings.currentWorkflowStage, WorkflowStage.ALLOCATED),
          eq(bookings.currentWorkflowStage, WorkflowStage.CHECKED_IN),
          eq(bookings.currentWorkflowStage, WorkflowStage.CHECKED_OUT)
        ))
        .leftJoin(users, eq(bookings.userId, users.id))
        .leftJoin(rooms, eq(bookings.roomNumber, rooms.roomNumber))
        .leftJoin(guests, eq(bookings.id, guests.bookingId)) // Join with guests table
        .groupBy(bookings.id, users.name, rooms.roomNumber, bookings.firstCheckedInGuestName) // Group by booking details including new column
        .execute(); // Execute the query

      return result;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getAllocatedBookings");
      throw new Error("Failed to retrieve allocated bookings.");
    }
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    try {
      const [room] = await this.dbClient
        .insert(rooms)
        .values(insertRoom)
        .returning();
      return room;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in createRoom");
      throw new Error("Failed to create room.");
    }
  }

  async updateRoomStatus(id: number, status: RoomStatus, notes?: string, userId?: number): Promise<Room | undefined> {
    try {
      const currentRoom = await this.getRoom(id);
      if (!currentRoom) {
        throw new Error("Room not found");
      }

      const updateSet: Partial<Room> = { status };

      if (status === RoomStatus.RESERVED) {
        if (currentRoom.status !== RoomStatus.AVAILABLE) {
          throw new Error("Only available rooms can be reserved.");
        }
        updateSet.reservationNotes = notes;
        updateSet.reservedBy = userId;
        updateSet.reservedAt = new Date();
      } else if (currentRoom.status === RoomStatus.RESERVED && status === RoomStatus.AVAILABLE) {
        updateSet.reservationNotes = null;
        updateSet.reservedBy = null;
        updateSet.reservedAt = null;
      }

      const [room] = await this.dbClient
        .update(rooms)
        .set(updateSet)
        .where(eq(rooms.id, id))
        .returning();
      return room;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateRoomStatus for ID ${id}`);
      throw new Error("Failed to update room status.");
    }
  }

  // Room Maintenance Operations
  async createRoomMaintenance(insertMaintenance: InsertRoomMaintenance): Promise<RoomMaintenance> {
    try {
      const [maintenance] = await this.dbClient
        .insert(roomMaintenance)
        .values(insertMaintenance)
        .returning();

      // Update the room status to RESERVED
      await this.dbClient
        .update(rooms)
        .set({ status: RoomStatus.RESERVED })
        .where(eq(rooms.id, insertMaintenance.roomId))
        .execute();

      return maintenance;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in createRoomMaintenance");
      throw new Error("Failed to create room maintenance entry.");
    }
  }

  async updateRoomMaintenanceStatus(id: number, status: RoomMaintenanceStatus): Promise<RoomMaintenance | undefined> {
    try {
      const [maintenance] = await this.dbClient
        .update(roomMaintenance)
        .set({ status })
        .where(eq(roomMaintenance.id, id))
        .returning();

      if (status === RoomMaintenanceStatus.COMPLETED) {
        // Get the room associated with this maintenance entry
        const room = await this.dbClient.select().from(roomMaintenance).where(eq(roomMaintenance.id, id));
        if (room && room[0]) {
          await this.dbClient
            .update(rooms)
            .set({ status: RoomStatus.AVAILABLE })
            .where(eq(rooms.id, room[0].roomId))
            .execute();
        }
      }

      return maintenance;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in updateRoomMaintenanceStatus for ID ${id}`);
      throw new Error("Failed to update room maintenance status.");
    }
  }

  async getRoomMaintenanceByRoomId(roomId: number): Promise<RoomMaintenance[]> {
    try {
      return await this.dbClient.select().from(roomMaintenance).where(eq(roomMaintenance.roomId, roomId));
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getRoomMaintenanceByRoomId for room ID ${roomId}`);
      throw new Error("Failed to retrieve room maintenance entries.");
    }
  }

  async getActiveRoomMaintenance(): Promise<RoomMaintenance[]> {
    try {
      return await this.dbClient.select().from(roomMaintenance).where(eq(roomMaintenance.status, RoomMaintenanceStatus.IN_PROGRESS));
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getActiveRoomMaintenance");
      throw new Error("Failed to retrieve active room maintenance entries.");
    }
  }

  // Department Operations
  async getAllDepartments(): Promise<Department[]> {
    try {
      return await this.dbClient.select().from(departments);
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getAllDepartments");
      throw new Error("Failed to retrieve all departments.");
    }
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    try {
      const [department] = await this.dbClient.select().from(departments).where(eq(departments.id, id));
      return department;
    } catch (error: any) {
      // logger.error({ err: error }, `Error in getDepartment for ID ${id}`);
      throw new Error("Failed to retrieve department.");
    }
  }

  // Stats
  async getVFastAllocationStats(): Promise<any> {
    try {
      const pendingAllocations = await this.dbClient.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.status, BookingStatus.APPROVED));
      const roomsAvailableToday = await this.dbClient.select({ count: sql<number>`count(*)` }).from(rooms).where(eq(rooms.status, RoomStatus.AVAILABLE));
      const upcomingCheckouts = await this.dbClient.select({ count: sql<number>`count(*)` }).from(bookings).where(and(eq(bookings.status, BookingStatus.ALLOCATED), gte(bookings.checkOutDate, new Date()), lte(bookings.checkOutDate, new Date(new Date().getTime() + 24 * 60 * 60 * 1000))));

      const stats = {
        pendingAllocations: pendingAllocations[0].count,
        roomsAvailableToday: roomsAvailableToday[0].count,
        upcomingCheckouts: upcomingCheckouts[0].count,
      };

      return stats;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getVFastAllocationStats");
      throw new Error("Failed to retrieve VFast allocation stats.");
    }
  }

  async getTotalUsers(): Promise<number> {
    try {
      const [result] = await this.dbClient.select({ count: sql<number>`count(*)` }).from(users);
      return result.count;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getTotalUsers");
      throw new Error("Failed to retrieve total users count.");
    }
  }

  async getTotalDepartments(): Promise<number> {
    try {
      const [result] = await this.dbClient.select({ count: sql<number>`count(*)` }).from(departments);
      return result.count;
    } catch (error: any) {
      // logger.error({ err: error }, "Error in getTotalDepartments");
      throw new Error("Failed to retrieve total departments count.");
    }
  }

  // Audit Log Operations
  async createAuditLog(tableName: string, recordId: string, action: string, userId?: string, details?: string): Promise<void> {
    try {
      await this.dbClient.insert(auditLogs).values({ tableName, recordId, action, userId, details });
    } catch (error: any) {
      // logger.error({ err: error }, "Error in createAuditLog");
      // Do not re-throw the error, as audit logging should not block the main operation
    }
  }
}