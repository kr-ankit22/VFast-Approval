import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/lib/protected-route";
import { UserRole } from "@shared/schema";

// Booking User Pages
import BookingUserDashboard from "@/pages/booking-user/dashboard";
import CreateBooking from "@/pages/booking-user/create-booking";
import BookingHistory from "@/pages/booking-user/booking-history";
import BookingDetailsPage from "@/pages/booking-user/booking-details";

// Department Approver Pages
import DepartmentApproverDashboard from "@/pages/department-approver/dashboard";
import DepartmentBookingRequests from "@/pages/department-approver/booking-requests";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import BookingRequests from "@/pages/admin/booking-requests";
import RoomManagement from "@/pages/admin/room-management";
import UserManagementPage from "@/pages/admin/user-management";

// VFast Pages
import VFastDashboard from "@/pages/vfast/dashboard";
import BookingWorkflowPage from "@/pages/vfast/booking-workflow";
import Reconsideration from "@/pages/vfast/reconsideration";
import VFastAllBookingRequests from "@/pages/vfast/all-booking-requests";
import VFastRoomInventory from "@/pages/vfast/room-inventory";
import RoomAvailabilityPage from "@/pages/vfast/room-availability";
import GuestWorklistPage from "@/pages/vfast/guest-worklist";

import ReconsiderBookingPage from "@/pages/booking-user/reconsider-booking";

import ReconsiderWorklist from "@/pages/booking-user/reconsider-worklist";


import DashboardLayout from "@/components/layout/dashboard-layout";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Profile Page (accessible by all roles) */}
      <ProtectedRoute path="/profile" role={UserRole.BOOKING} component={() => (
        <DashboardLayout title="Profile" description="Manage your profile settings" role={UserRole.BOOKING}>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/profile" role={UserRole.DEPARTMENT_APPROVER} component={() => (
        <DashboardLayout title="Profile" description="Manage your profile settings" role={UserRole.DEPARTMENT_APPROVER}>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/profile" role={UserRole.ADMIN} component={() => (
        <DashboardLayout title="Profile" description="Manage your profile settings" role={UserRole.ADMIN}>
          <ProfilePage />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/profile" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="Profile" description="Manage your profile settings" role={UserRole.VFAST}>
          <ProfilePage />
        </DashboardLayout>
      )} />
      
      {/* Booking User Routes */}
      <ProtectedRoute path="/booking" role={UserRole.BOOKING} component={() => (
        <DashboardLayout title="Booking Dashboard" description="Overview of your bookings" role={UserRole.BOOKING}>
          <BookingUserDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/create" role={UserRole.BOOKING} component={() => (
        <DashboardLayout title="New Booking" description="Submit a new booking request" role={UserRole.BOOKING}>
          <CreateBooking />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/history" role={UserRole.BOOKING} component={() => (
        <DashboardLayout title="Booking History" description="View your past and current bookings" role={UserRole.BOOKING}>
          <BookingHistory />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/:id" role={UserRole.BOOKING} component={({ id }) => (
        <DashboardLayout title="Booking Details" description={`Details for Booking #${id}`} role={UserRole.BOOKING}>
          <BookingDetailsPage id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/reconsider/:id" role={UserRole.BOOKING} component={({ id }) => (
        <DashboardLayout title="Reconsider Booking" description={`Reconsider Booking #${id}`} role={UserRole.BOOKING}>
          <ReconsiderBookingPage id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/reconsider" role={UserRole.BOOKING} component={() => (
        <DashboardLayout title="Reconsideration Worklist" description="View bookings pending reconsideration" role={UserRole.BOOKING}>
          <ReconsiderWorklist />
        </DashboardLayout>
      )} />
      
      {/* Department Approver Routes */}
      <ProtectedRoute path="/department" role={UserRole.DEPARTMENT_APPROVER} component={() => (
        <DashboardLayout title="Department Dashboard" description="Overview of department approvals" role={UserRole.DEPARTMENT_APPROVER}>
          <DepartmentApproverDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/department/requests" role={UserRole.DEPARTMENT_APPROVER} component={() => (
        <DashboardLayout title="Booking Requests" description="Review and approve department booking requests" role={UserRole.DEPARTMENT_APPROVER}>
          <DepartmentBookingRequests />
        </DashboardLayout>
      )} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" role={UserRole.ADMIN} component={() => (
        <DashboardLayout title="Admin Dashboard" description="Overview of system administration" role={UserRole.ADMIN}>
          <AdminDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/admin/requests" role={UserRole.ADMIN} component={() => (
        <DashboardLayout title="Booking Requests" description="Manage all booking requests" role={UserRole.ADMIN}>
          <BookingRequests />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/admin/rooms" role={UserRole.ADMIN} component={() => (
        <DashboardLayout title="Room Management" description="Manage hostel rooms and their status" role={UserRole.ADMIN}>
          <RoomManagement />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/admin/user-provisioning" role={UserRole.ADMIN} component={() => (
        <DashboardLayout title="User Management" description="Manage user accounts and roles" role={UserRole.ADMIN}>
          <UserManagementPage />
        </DashboardLayout>
      )} />
      
      {/* VFast Routes */}
      <ProtectedRoute path="/vfast" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="VFast Dashboard" description="Overview of VFast operations" role={UserRole.VFAST}>
          <VFastDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/workflow/:id?" role={UserRole.VFAST} component={({ id }) => (
        <DashboardLayout title="Booking Workflow" description={`Manage booking workflow for Booking #${id}`} role={UserRole.VFAST}>
          <BookingWorkflowPage id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/reconsideration" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="Reconsideration Requests" description="Review and manage reconsideration requests" role={UserRole.VFAST}>
          <Reconsideration />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/all-booking-requests" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="All Booking Requests" description="View and manage all booking requests" role={UserRole.VFAST}>
          <VFastAllBookingRequests />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/all-booking-requests/:id" role={UserRole.VFAST} component={({ id }) => (
        <DashboardLayout title="Booking Details" description={`Details for Booking #${id}`} role={UserRole.VFAST}>
          <VFastAllBookingRequests id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/room-inventory" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="Room Inventory" description="Manage room inventory and maintenance" role={UserRole.VFAST}>
          <VFastRoomInventory />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/room-availability" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="Room Availability" description="View room availability" role={UserRole.VFAST}>
          <RoomAvailabilityPage />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/guest-worklist" role={UserRole.VFAST} component={() => (
        <DashboardLayout title="Guest Worklist" description="Manage guest check-ins and check-outs" role={UserRole.VFAST}>
          <GuestWorklistPage />
        </DashboardLayout>
      )} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}
import { AuthProvider } from "./hooks/use-auth";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
