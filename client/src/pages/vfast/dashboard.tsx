import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCard from "@/components/dashboard/stats-card";
import BookingTable from "@/components/booking/booking-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  Clock, 
  Bed, 
  RefreshCw, 
  X, 
  ChevronRight 
} from "lucide-react";

export default function VFastDashboard() {
  // Fetch approved bookings that need allocation
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

  const approvedBookings = getBookingCountByStatus(BookingStatus.APPROVED);
  const allocatedBookings = getBookingCountByStatus(BookingStatus.ALLOCATED);
  const pendingReconsiderations = 5; // Mock data for demonstration

  // Get bookings that need allocation (approved but not allocated)
  const bookingsToAllocate = bookings
    ? bookings
        .filter((booking) => booking.status === BookingStatus.APPROVED)
        .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime())
        .slice(0, 3)
    : [];

  return (
    <DashboardLayout 
      title="VFast Management Dashboard"
      description="Manage room allocations and handle reconsideration requests"
      role={UserRole.VFAST}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Approved Bookings"
          value={approvedBookings}
          icon={<CheckCircle2 size={18} />}
          className="bg-green-50 border-l-4 border-green-500"
          iconClassName="bg-green-100 text-green-500"
        />
        
        <StatsCard
          title="Rooms Allocated"
          value={allocatedBookings}
          icon={<Bed size={18} />}
          className="bg-blue-50 border-l-4 border-blue-500"
          iconClassName="bg-blue-100 text-blue-500"
        />
        
        <StatsCard
          title="Reconsiderations"
          value={pendingReconsiderations}
          icon={<RefreshCw size={18} />}
          className="bg-yellow-50 border-l-4 border-yellow-500"
          iconClassName="bg-yellow-100 text-yellow-500"
        />
      </div>

      {/* Allocation Queue */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Room Allocation Queue</CardTitle>
            <Link href="/vfast/allocation">
              <Button variant="ghost" className="text-primary font-normal">
                View All <ChevronRight size={16} className="ml-1" />
              </Button>
            </Link>
          </div>
          <CardDescription>
            Bookings that need room allocation
          </CardDescription>
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
          ) : bookingsToAllocate.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No bookings waiting for room allocation.</p>
            </div>
          ) : (
            <BookingTable 
              bookings={bookingsToAllocate} 
              role="vfast"
              onView={(booking) => {
                console.log("View booking", booking.id);
                // Implement view booking details functionality
              }}
              onAllocate={(booking) => {
                console.log("Allocate room", booking.id);
                // Implement room allocation functionality
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Allocation Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Allocation Statistics</CardTitle>
          <CardDescription>
            Overview of room allocation by type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-xs text-gray-500">Occupied</div>
                </div>
              </div>
              <h3 className="mt-4 font-medium text-center">Single Rooms</h3>
              <p className="text-sm text-gray-500 text-center">17/20 allocated</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full border-4 border-secondary flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">70%</div>
                  <div className="text-xs text-gray-500">Occupied</div>
                </div>
              </div>
              <h3 className="mt-4 font-medium text-center">Double Rooms</h3>
              <p className="text-sm text-gray-500 text-center">14/20 allocated</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full border-4 border-green-500 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">60%</div>
                  <div className="text-xs text-gray-500">Occupied</div>
                </div>
              </div>
              <h3 className="mt-4 font-medium text-center">Deluxe Rooms</h3>
              <p className="text-sm text-gray-500 text-center">6/10 allocated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
