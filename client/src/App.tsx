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

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Booking User Routes */}
      <ProtectedRoute path="/booking" component={BookingUserDashboard} role={UserRole.BOOKING} />
      <ProtectedRoute path="/booking/create" component={CreateBooking} role={UserRole.BOOKING} />
      <ProtectedRoute path="/booking/history" component={BookingHistory} role={UserRole.BOOKING} />
      <ProtectedRoute path="/booking/:id" component={BookingDetailsPage} role={UserRole.BOOKING} />
      <ProtectedRoute path="/booking/reconsider/:id" component={ReconsiderBookingPage} role={UserRole.BOOKING} />
      <ProtectedRoute path="/booking/reconsider" component={ReconsiderWorklist} role={UserRole.BOOKING} />
      
      {/* Department Approver Routes */}
      <ProtectedRoute path="/department" component={DepartmentApproverDashboard} role={UserRole.DEPARTMENT_APPROVER} />
      <ProtectedRoute path="/department/requests" component={DepartmentBookingRequests} role={UserRole.DEPARTMENT_APPROVER} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} role={UserRole.ADMIN} />
      <ProtectedRoute path="/admin/requests" component={BookingRequests} role={UserRole.ADMIN} />
      <ProtectedRoute path="/admin/rooms" component={RoomManagement} role={UserRole.ADMIN} />
      
      {/* VFast Routes */}
      <ProtectedRoute path="/vfast" component={VFastDashboard} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/workflow/:id?" component={BookingWorkflowPage} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/reconsideration" component={Reconsideration} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/all-booking-requests" component={VFastAllBookingRequests} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/all-booking-requests/:id" component={VFastAllBookingRequests} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/room-inventory" component={VFastRoomInventory} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/room-availability" component={RoomAvailabilityPage} role={UserRole.VFAST} />
      <ProtectedRoute path="/vfast/guest-worklist" component={GuestWorklistPage} role={UserRole.VFAST} />
      
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
