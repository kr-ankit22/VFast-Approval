import { User, Booking, Room, BookingStatus } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

import { config } from '../shared/env';

export const welcomeEmailTemplate = async (user: User, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'welcome.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{name}}', user.name).replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: "Welcome to VFast Booker!",
    html,
    text: `Welcome, ${user.name}! Your account has been successfully created. You can now log in to the VFast Booker application by visiting: ${loginPageUrl}`,
  };
};

export const newBookingRequestEmailTemplate = async (booking: Booking, approver: User, departmentName: string, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const bookingUrl = `${appBaseUrl}/department/requests`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'new-booking-request.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{approverName}}', approver.name)
             .replace('{{bookingId}}', booking.id.toString())
             .replace('{{departmentName}}', departmentName)
             .replace('{{bookingUrl}}', bookingUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `New Booking Request #${booking.id} for ${departmentName}`,
    html,
    text: `Dear ${approver.name},\n\nA new booking request #${booking.id} has been submitted for your department, ${departmentName}. Please review the request in the VFast Booker application by visiting: ${bookingUrl}`,
  };
};

export const bookingStatusUpdateEmailTemplate = async (booking: Booking, user: User, newStatus: BookingStatus, approverRole: string, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const bookingUrl = `${appBaseUrl}/booking/history`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'booking-status-update.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{userName}}', user.name)
             .replace('{{bookingId}}', booking.id.toString())
             .replace('{{newStatus}}', newStatus)
             .replace('{{approverRole}}', approverRole)
             .replace('{{bookingUrl}}', bookingUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `Your Booking #${booking.id} Status Update: ${newStatus}`,
    html,
    text: `Dear ${user.name},\n\nYour booking request #${booking.id} has been updated to ${newStatus} by ${approverRole}.\n\nYou can view details by visiting: ${bookingUrl}\n\nThank you for using VFast Booker.`,
  };
};

export const roomAllocatedEmailTemplate = async (booking: Booking, user: User, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const bookingUrl = `${appBaseUrl}/booking/history`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'room-allocated.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{userName}}', user.name)
             .replace('{{bookingId}}', booking.id.toString())
             .replace('{{roomNumber}}', booking.roomNumber)
             .replace('{{bookingUrl}}', bookingUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `Your Booking #${booking.id} - Room Allocated!`,
    html,
    text: `Dear ${user.name},\n\nYour booking request #${booking.id} has been successfully allocated a room.\n\nRoom Number: ${booking.roomNumber}\n\nYou can view details by visiting: ${bookingUrl}\n\nThank you for using VFast Booker.`,
  };
};

export const bookingCreatedEmailTemplate = async (booking: Booking, user: User, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const bookingUrl = `${appBaseUrl}/booking/history`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'booking-created.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{name}}', user.name)
             .replace('{{bookingId}}', booking.id.toString())
             .replace('{{bookingUrl}}', bookingUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `Your Booking #${booking.id} has been created!`,
    html,
    text: `Hi ${user.name},\n\nYour booking request #${booking.id} has been successfully created and is now pending approval.\n\nYou can view the status of your request by visiting: ${bookingUrl}`,
  };
};

export const bookingForAllocationEmailTemplate = async (booking: Booking, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const allocationUrl = `${appBaseUrl}/vfast/workflow`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'booking-for-allocation.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{bookingId}}', booking.id.toString())
             .replace('{{allocationUrl}}', allocationUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `New Booking #${booking.id} Ready for Allocation`,
    html,
    text: `Hi VFAST Team,\n\nA new booking request #${booking.id} has been approved and is now ready for room allocation.\n\nPlease allocate a room for this booking by visiting: ${allocationUrl}`,
  };
};

export const bookingRejectedByAdminEmailTemplate = async (booking: Booking, approver: User, departmentName: string, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const bookingUrl = `${appBaseUrl}/department/requests`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'booking-rejected-by-admin.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{approverName}}', approver.name)
             .replace('{{bookingId}}', booking.id.toString())
             .replace('{{departmentName}}', departmentName)
             .replace('{{bookingUrl}}', bookingUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `Booking #${booking.id} Rejected by Admin`,
    html,
    text: `Hi ${approver.name},\n\nA booking request #${booking.id} that you previously approved for the ${departmentName} department has been rejected by the admin.\n\nYou can view the details of the booking by visiting: ${bookingUrl}`,
  };
};

export const bookingResubmittedEmailTemplate = async (booking: Booking, approver: User, departmentName: string, loginUrl: string) => {
  const appBaseUrl = config.frontendAppUrl;
  const loginPageUrl = config.frontendLoginUrl;
  const bookingUrl = `${appBaseUrl}/department/requests`;
  const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'html', 'booking-resubmitted.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  html = html.replace('{{approverName}}', approver.name)
             .replace('{{bookingId}}', booking.id.toString())
             .replace('{{departmentName}}', departmentName)
             .replace('{{bookingUrl}}', bookingUrl)
             .replace('{{loginUrl}}', loginPageUrl);

  return {
    subject: `Booking #${booking.id} Resubmitted for Approval`,
    html,
    text: `Hi ${approver.name},\n\nA booking request #${booking.id} for the ${departmentName} department has been resubmitted for your approval.\n\nPlease review the request by visiting: ${bookingUrl}`,
  };
};