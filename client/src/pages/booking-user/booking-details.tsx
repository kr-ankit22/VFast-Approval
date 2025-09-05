import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Booking, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X, Calendar, MapPin, Users, FileText } from "lucide-react";
import { formatDate, getDaysBetweenDates } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

import ReconsiderationButton from "@/components/booking/reconsideration-button";
import { BookingStatus } from "@shared/schema";

export default function BookingDetailsPage() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const { data: booking, isLoading, isError, error } = useQuery<Booking>({
    queryKey: [`/api/bookings/${bookingId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bookings/${bookingId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch booking details");
      }
      return res.json();
    },
    enabled: !!bookingId, // Only run query if bookingId is available
  });

  if (isLoading) {
    return (
      <DashboardLayout
        title="Booking Details"
        description="Loading booking details..."
        role={UserRole.BOOKING}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading booking details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to load booking details",
      variant: "destructive",
    });
    return (
      <DashboardLayout
        title="Booking Details"
        description="Error loading booking details"
        role={UserRole.BOOKING}
      >
        <div className="text-center py-8 text-red-500">
          <X className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load booking details: {error?.message}</p>
          <Button asChild className="mt-4">
            <Link href="/booking/history">Back to My Bookings</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout
        title="Booking Details"
        description="Booking not found"
        role={UserRole.BOOKING}
      >
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Booking not found.</p>
          <Button asChild className="mt-4">
            <Link href="/booking/history">Back to My Bookings</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Booking #${booking.id}`}
      description="Detailed view of your booking request"
      role={UserRole.BOOKING}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Booking Request Details</CardTitle>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-gray-500">
            Request #{booking.id} submitted on {booking.createdAt ? formatDate(new Date(booking.createdAt)) : 'N/A'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {booking.status === BookingStatus.PENDING_RECONSIDERATION && (
              <div className="flex justify-end">
                <ReconsiderationButton booking={booking} />
              </div>
            )}
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Date Range</p>
                <p className="text-gray-600">
                  {formatDate(new Date(booking.checkInDate))} - {formatDate(new Date(booking.checkOutDate))}
                </p>
                <p className="text-sm text-gray-500">
                  {getDaysBetweenDates(new Date(booking.checkInDate), new Date(booking.checkOutDate))} days
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Guest Information</p>
                <p className="text-gray-600">
                  User ID: {booking.userId}
                </p>
                <p className="text-gray-600">
                  Purpose: {booking.purpose}
                </p>
                <p className="text-gray-600">
                  Number of Guests: {booking.guestCount}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Referring Department</p>
                <p className="text-gray-600">
                  {booking.departmentName}
                </p>
              </div>
            </div>

            {booking.roomNumber && (
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Room Details</p>
                  <p className="text-gray-600">
                    Assigned Room: <span className="font-medium">{booking.roomNumber}</span>
                  </p>
                </div>
              </div>
            )}

            {booking.specialRequests && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Special Requests</p>
                  <p className="text-gray-600">{booking.specialRequests}</p>
                </div>
              </div>
            )}

            {booking.rejectionHistory && booking.rejectionHistory.length > 0 && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Rejection History</p>
                  {booking.rejectionHistory.map((rejection: any, index: number) => (
                    <div key={index} className="mb-2">
                      <p className="text-xs text-gray-500">Rejected on {formatDate(new Date(rejection.rejectedAt))}</p>
                      <p className="text-gray-600">Reason: {rejection.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(booking.adminNotes || booking.vfastNotes) && (
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Notes</p>
                  {booking.adminNotes && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500">Admin Note:</p>
                      <p className="text-gray-600">{booking.adminNotes}</p>
                    </div>
                  )}
                  {booking.vfastNotes && (
                    <div>
                      <p className="text-xs text-gray-500">VFast Note:</p>
                      <p className="text-gray-600">{booking.vfastNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
