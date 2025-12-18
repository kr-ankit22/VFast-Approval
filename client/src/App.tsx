import { Switch, Route, useLocation } from "wouter";
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
import CreatePersonalBooking from "@/pages/booking-user/create-personal-booking";
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
import ProfilePage from "@/pages/profile-page";
import ReportsPage from "@/pages/reports";

import ReconsiderBookingPage from "@/pages/booking-user/reconsider-booking";

import ReconsiderWorklist from "@/pages/booking-user/reconsider-worklist";


import DashboardLayout from "@/components/layout/dashboard-layout";


import { useEffect, useState } from "react";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Profile Page (accessible by all roles) */}
      <ProtectedRoute path="/profile" role={[UserRole.BOOKING, UserRole.DEPARTMENT_APPROVER, UserRole.ADMIN, UserRole.VFAST]} component={({ user }) => (
        <DashboardLayout title="Profile" description="Manage your profile settings" role={user.role as UserRole}>
          <ProfilePage />
        </DashboardLayout>
      )} />
      
      {/* Booking User Routes */}
      <ProtectedRoute path="/booking" role={UserRole.BOOKING} component={({ user }) => (
        <DashboardLayout title="Booking Dashboard" description="Overview of your bookings" role={user.role as UserRole}>
          <BookingUserDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/create" role={UserRole.BOOKING} component={({ user }) => (
        <DashboardLayout title="New Booking" description="Submit a new booking request" role={user.role as UserRole}>
          <CreateBooking />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/create-personal" role={UserRole.BOOKING} component={({ user }) => (
        <DashboardLayout title="New Personal Booking" description="Submit a new personal booking request" role={user.role as UserRole}>
          <CreatePersonalBooking />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/history" role={UserRole.BOOKING} component={({ user }) => (
        <DashboardLayout title="Booking History" description="View your past and current bookings" role={user.role as UserRole}>
          <BookingHistory />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/:id" role={UserRole.BOOKING} component={({ user, id }) => (
        <DashboardLayout title="Booking Details" description={`Details for Booking #${id}`} role={user.role as UserRole}>
          <BookingDetailsPage id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/reconsider/:id" role={UserRole.BOOKING} component={({ user, id }) => (
        <DashboardLayout title="Reconsider Booking" description={`Reconsider Booking #${id}`} role={user.role as UserRole}>
          <ReconsiderBookingPage id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/booking/reconsider" role={UserRole.BOOKING} component={({ user }) => (
        <DashboardLayout title="Reconsideration Worklist" description="View bookings pending reconsideration" role={user.role as UserRole}>
          <ReconsiderWorklist />
        </DashboardLayout>
      )} />
      
      {/* Department Approver Routes */}
      <ProtectedRoute path="/department" role={UserRole.DEPARTMENT_APPROVER} component={({ user }) => (
        <DashboardLayout title="Department Dashboard" description="Overview of department approvals" role={user.role as UserRole}>
          <DepartmentApproverDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/department/requests" role={UserRole.DEPARTMENT_APPROVER} component={({ user }) => (
        <DashboardLayout title="Booking Requests" description="Review and approve department booking requests" role={user.role as UserRole}>
          <DepartmentBookingRequests />
        </DashboardLayout>
      )} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" role={UserRole.ADMIN} component={({ user }) => (
        <DashboardLayout title="Admin Dashboard" description="Overview of system administration" role={user.role as UserRole}>
          <AdminDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/admin/requests" role={UserRole.ADMIN} component={({ user }) => (
        <DashboardLayout title="Booking Requests" description="Manage all booking requests" role={user.role as UserRole}>
          <BookingRequests />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/admin/rooms" role={UserRole.ADMIN} component={({ user }) => (
        <DashboardLayout title="Room Management" description="Manage hostel rooms and their status" role={user.role as UserRole}>
          <RoomManagement />
        </DashboardLayout>
      )} />

      <ProtectedRoute path="/admin/user-provisioning" role={UserRole.ADMIN} component={({ user }) => (
        <DashboardLayout title="User Management" description="Manage user accounts and roles" role={user.role as UserRole}>
          <UserManagementPage />
        </DashboardLayout>
      )} />
      
      {/* VFast Routes */}
      <ProtectedRoute path="/vfast" role={UserRole.VFAST} component={({ user }) => (
        <DashboardLayout title="VFast Dashboard" description="Overview of VFast operations" role={user.role as UserRole}>
          <VFastDashboard />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/workflow/:id?" role={UserRole.VFAST} component={({ user, id }) => (
        <DashboardLayout title="Booking Workflow" description={`Manage booking workflow for Booking #${id}`} role={user.role as UserRole}>
          <BookingWorkflowPage id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/reconsideration" role={UserRole.VFAST} component={({ user }) => (
        <DashboardLayout title="Reconsideration Requests" description="Review and manage reconsideration requests" role={user.role as UserRole}>
          <Reconsideration />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/all-booking-requests" role={UserRole.VFAST} component={({ user }) => (
        <DashboardLayout title="All Booking Requests" description="View and manage all booking requests" role={user.role as UserRole}>
          <VFastAllBookingRequests />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/all-booking-requests/:id" role={UserRole.VFAST} component={({ user, id }) => (
        <DashboardLayout title="Booking Details" description={`Details for Booking #${id}`} role={user.role as UserRole}>
          <VFastAllBookingRequests id={id} />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/room-inventory" role={UserRole.VFAST} component={({ user }) => (
        <DashboardLayout title="Room Inventory" description="Manage room inventory and maintenance" role={user.role as UserRole}>
          <VFastRoomInventory />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/room-availability" role={UserRole.VFAST} component={({ user }) => (
        <DashboardLayout title="Room Availability" description="View room availability" role={user.role as UserRole}>
          <RoomAvailabilityPage />
        </DashboardLayout>
      )} />
      <ProtectedRoute path="/vfast/guest-worklist" role={UserRole.VFAST} component={({ user }) => (
        <DashboardLayout title="Guest Worklist" description="Manage guest check-ins and check-outs" role={user.role as UserRole}>
          <GuestWorklistPage />
        </DashboardLayout>
      )} />

      {/* Reporting Route */}
      <ProtectedRoute path="/reports" role={[UserRole.ADMIN, UserRole.VFAST, UserRole.DEPARTMENT_APPROVER]} component={({ user }) => (
        <DashboardLayout title="Reporting" description="Generate and export reports" role={user.role as UserRole}>
          <ReportsPage />
        </DashboardLayout>
      )} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}
import { AuthProvider } from "./hooks/use-auth";

function App() {
  const [, setLocation] = useLocation();
  const { refetch, user } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      setIsAuthenticating(true);
      localStorage.setItem("token", token);
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      refetch().then(({ data: fetchedUser }) => {
        if (fetchedUser) {
          const redirectPath = 
            fetchedUser.role === UserRole.ADMIN ? "/admin" :
            fetchedUser.role === UserRole.VFAST ? "/vfast" :
            fetchedUser.role === UserRole.DEPARTMENT_APPROVER ? "/department" :
            "/booking";
          setLocation(redirectPath);
        } else {
          setLocation("/auth?error=authentication_failed");
        }
        setIsAuthenticating(false);
      }).catch((error) => {
        console.error("App.tsx: Error refetching user after Google auth:", error);
        setLocation("/auth?error=refetch_failed");
        setIsAuthenticating(false);
      });
    } else if (user && (window.location.pathname === '/' || window.location.pathname === '/auth')) {
      const redirectPath = 
        user.role === UserRole.ADMIN ? "/admin" :
        user.role === UserRole.VFAST ? "/vfast" :
        user.role === UserRole.DEPARTMENT_APPROVER ? "/department" :
        "/booking";
      setLocation(redirectPath);
    }
  }, [setLocation, refetch, user]);

  if (isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold">Signing in...</p>
        <p className="text-sm text-muted-foreground">Please wait while we authenticate your account.</p>
      </div>
    );
  }

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