import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Booking, BookingStatus, User } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCard from "@/components/dashboard/stats-card";
import BookingTable from "@/components/booking/booking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, X, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@shared/schema";

export default function BookingUserDashboard() {
  // Fetch user bookings
  const {
    data: bookings,
    isLoading,
    isError,
    error,
  } = useQuery<Booking[]>({
    queryKey: ["/api/my-bookings"],
  });

  // Count bookings by status
  const getBookingCountByStatus = (status: BookingStatus) => {
    if (!bookings) return 0;
    return bookings.filter((booking) => booking.status === status).length;
  };

  const totalBookings = bookings?.length || 0;
  const approvedBookings = getBookingCountByStatus(BookingStatus.APPROVED) + getBookingCountByStatus(BookingStatus.ALLOCATED);
  const pendingBookings = getBookingCountByStatus(BookingStatus.PENDING);
  const rejectedBookings = getBookingCountByStatus(BookingStatus.REJECTED);

  // Get recent bookings (up to 3)
  const recentBookings = bookings
    ? [...bookings]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
    : [];

  return (
    <DashboardLayout 
      title="Welcome to Your Dashboard"
      description="Manage your hostel bookings and requests"
      role={UserRole.BOOKING}
    >
      {/* Booking Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Bookings"
          value={totalBookings}
          icon={<CalendarCheck size={18} />}
          className="bg-blue-50 border-l-4 border-blue-500"
          iconClassName="bg-blue-100 text-blue-500"
        />
        
        <StatsCard
          title="Approved"
          value={approvedBookings}
          icon={<CalendarCheck size={18} />}
          className="bg-green-50 border-l-4 border-green-500"
          iconClassName="bg-green-100 text-green-500"
        />
        
        <StatsCard
          title="Pending"
          value={pendingBookings}
          icon={<Clock size={18} />}
          className="bg-yellow-50 border-l-4 border-yellow-500"
          iconClassName="bg-yellow-100 text-yellow-500"
        />
      </div>

      {/* Quick Action */}
      <Card className="mb-6 bg-primary text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Need to book a stay?</h3>
              <p className="mb-4 md:mb-0">Create a new booking request for your next visit to BITS Pilani.</p>
            </div>
            <Link href="/booking/create">
              <Button variant="secondary" className="font-medium">
                <PlusCircle size={16} className="mr-2" /> New Booking
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
            <Link href="/booking/history">
              <Button variant="link" className="text-primary">View All</Button>
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
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No bookings found. Create your first booking!</p>
              <Link href="/booking/create">
                <Button variant="outline" className="mt-4">
                  <PlusCircle size={16} className="mr-2" /> Create Booking
                </Button>
              </Link>
            </div>
          ) : (
            <BookingTable 
              bookings={recentBookings} 
              role="booking"
              onView={(booking) => {
                console.log("View booking", booking.id);
                // Implement view booking details functionality
              }}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
