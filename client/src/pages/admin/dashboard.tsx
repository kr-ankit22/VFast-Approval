import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCard from "@/components/dashboard/stats-card";
import BookingTable from "@/components/booking/booking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck, 
  Clock, 
  X, 
  DoorOpen, 
  Users, 
  BarChart, 
  ChevronRight 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Sample chart data for room occupancy
const RoomOccupancyCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Room Occupancy Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Single Rooms</p>
            <div className="flex items-center justify-center mt-2">
              <div className="w-16 h-16 rounded-full border-4 border-primary relative flex items-center justify-center">
                <span className="text-lg font-bold">85%</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-500">17/20 occupied</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Double Rooms</p>
            <div className="flex items-center justify-center mt-2">
              <div className="w-16 h-16 rounded-full border-4 border-secondary relative flex items-center justify-center">
                <span className="text-lg font-bold">70%</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-500">14/20 occupied</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">Deluxe Rooms</p>
            <div className="flex items-center justify-center mt-2">
              <div className="w-16 h-16 rounded-full border-4 border-green-500 relative flex items-center justify-center">
                <span className="text-lg font-bold">60%</span>
              </div>
            </div>
            <p className="text-xs mt-2 text-gray-500">6/10 occupied</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  // Fetch all bookings
  const {
    data: bookings,
    isLoading,
    isError,
    error,
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Count bookings by status
  const getBookingCountByStatus = (status: BookingStatus) => {
    if (!bookings) return 0;
    return bookings.filter((booking) => booking.status === status).length;
  };

  const totalBookings = bookings?.length || 0;
  const pendingBookings = getBookingCountByStatus(BookingStatus.PENDING);
  const approvedBookings = getBookingCountByStatus(BookingStatus.APPROVED);
  const allocatedBookings = getBookingCountByStatus(BookingStatus.ALLOCATED);

  // Get pending bookings for the table
  const pendingBookingsList = bookings
    ? bookings
        .filter((booking) => booking.status === BookingStatus.PENDING)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    : [];

  return (
    <DashboardLayout 
      title="Admin Dashboard"
      description="Manage bookings, rooms, and system settings"
      role={UserRole.ADMIN}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Bookings"
          value={totalBookings}
          icon={<CalendarCheck size={18} />}
          trend={{ value: "12% from last month", positive: true }}
        />
        
        <StatsCard
          title="Pending Requests"
          value={pendingBookings}
          icon={<Clock size={18} />}
          trend={{ value: "5 new since yesterday", positive: false }}
          iconClassName="bg-yellow-100 text-yellow-500"
        />
        
        <StatsCard
          title="Available Rooms"
          value="42"
          icon={<DoorOpen size={18} />}
          trend={{ value: "75% occupancy rate" }}
          iconClassName="bg-green-100 text-green-500"
        />
        
        <StatsCard
          title="Active Users"
          value="289"
          icon={<Users size={18} />}
          trend={{ value: "8% from last month", positive: true }}
          iconClassName="bg-purple-100 text-purple-500"
        />
      </div>

      {/* Pending Booking Requests */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Pending Booking Requests</CardTitle>
            <Link href="/admin/requests">
              <Button variant="ghost" className="text-primary font-normal">
                View All <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load bookings: {error?.message}</p>
            </div>
          ) : pendingBookingsList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending booking requests at this time.</p>
            </div>
          ) : (
            <BookingTable 
              bookings={pendingBookingsList} 
              role="admin"
              onView={(booking) => {
                console.log("View booking", booking.id);
                // Implement view booking details functionality
              }}
              onApprove={(booking) => {
                console.log("Approve booking", booking.id);
                // Implement approve booking functionality
              }}
              onReject={(booking) => {
                console.log("Reject booking", booking.id);
                // Implement reject booking functionality
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Occupancy Chart */}
      <RoomOccupancyCard />
    </DashboardLayout>
  );
}
