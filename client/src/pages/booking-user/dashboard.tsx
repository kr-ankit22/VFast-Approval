import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { UserRole, BookingStatus, type Booking } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { BookOpen, Clock, CalendarCheck, Hotel } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function BookingUserDashboard() {
  const { user } = useAuth();
  
  // Get basic stats 
  const { data: myBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/my-bookings"]
  });

  const pendingBookings = myBookings.filter(b => 
    b.status === BookingStatus.PENDING_DEPARTMENT_APPROVAL ||
    b.status === BookingStatus.PENDING_ADMIN_APPROVAL ||
    b.status === BookingStatus.PENDING_RECONSIDERATION
  ).length;
  const approvedBookings = myBookings.filter(b => 
    b.status === BookingStatus.APPROVED || b.status === BookingStatus.ALLOCATED
  ).length;
  
  return (
    <DashboardLayout 
      title="Student Dashboard" 
      description={`Welcome back, ${user?.name}. Here's an overview of your hostel bookings.`}
      role={UserRole.BOOKING}
    >
      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myBookings.length}</div>
            <p className="text-xs text-muted-foreground">Total booking requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBookings}</div>
            <p className="text-xs text-muted-foreground">Confirmed bookings</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick actions */}
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create a new hostel booking request for guests</p>
            <Link href="/booking/create">
              <Button>Create Booking</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and track your existing booking requests</p>
            <Link href="/booking/history">
              <Button>View History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}