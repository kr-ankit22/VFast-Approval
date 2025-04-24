import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Booking, BookingStatus } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BookingTable from "@/components/booking/booking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, Calendar, Clock, MapPin, Users, FileText } from "lucide-react";
import { formatDate, getDaysBetweenDates } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { UserRole } from "@shared/schema";

export default function BookingHistory() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch user bookings
  const { data: bookings, isLoading, isError, error } = useQuery<Booking[]>({
    queryKey: ["/api/my-bookings"],
  });

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    switch (activeTab) {
      case "pending":
        return bookings.filter(booking => booking.status === BookingStatus.PENDING);
      case "approved":
        return bookings.filter(booking => 
          booking.status === BookingStatus.APPROVED || 
          booking.status === BookingStatus.ALLOCATED
        );
      case "rejected":
        return bookings.filter(booking => booking.status === BookingStatus.REJECTED);
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  // Handle view booking details
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  // Get room type display name
  const getRoomTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      "single": "Single Room",
      "double": "Double Room",
      "deluxe": "Deluxe Room",
    };
    return types[type] || type;
  };

  return (
    <DashboardLayout 
      title="Booking History"
      description="View and track all your booking requests"
      role={UserRole.BOOKING}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Your Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading your bookings...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load bookings: {error?.message}</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No {activeTab !== "all" ? activeTab : ""} bookings found.</p>
            </div>
          ) : (
            <BookingTable 
              bookings={filteredBookings}
              role="booking"
              onView={handleViewBooking}
            />
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Request #{selectedBooking.id} submitted on {selectedBooking.createdAt ? formatDate(new Date(selectedBooking.createdAt)) : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Status</h3>
                <BookingStatusBadge status={selectedBooking.status as BookingStatus} />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date Range</p>
                    <p className="text-gray-600">
                      {formatDate(new Date(selectedBooking.checkInDate))} - {formatDate(new Date(selectedBooking.checkOutDate))}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getDaysBetweenDates(new Date(selectedBooking.checkInDate), new Date(selectedBooking.checkOutDate))} days
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Guest Information</p>
                    <p className="text-gray-600">
                      Purpose: {selectedBooking.purpose}
                    </p>
                    <p className="text-gray-600">
                      Number of Guests: {selectedBooking.guestCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Referring Department</p>
                    <p className="text-gray-600">
                      {selectedBooking.referringDepartment}
                    </p>
                    {selectedBooking.roomNumber && (
                      <p className="text-gray-600">
                        Assigned Room: <span className="font-medium">{selectedBooking.roomNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Special Requests</p>
                      <p className="text-gray-600">{selectedBooking.specialRequests}</p>
                    </div>
                  </div>
                )}

                {(selectedBooking.adminNotes || selectedBooking.vfastNotes) && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Notes</p>
                      {selectedBooking.adminNotes && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Admin Note:</p>
                          <p className="text-gray-600">{selectedBooking.adminNotes}</p>
                        </div>
                      )}
                      {selectedBooking.vfastNotes && (
                        <div>
                          <p className="text-xs text-gray-500">VFast Note:</p>
                          <p className="text-gray-600">{selectedBooking.vfastNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
