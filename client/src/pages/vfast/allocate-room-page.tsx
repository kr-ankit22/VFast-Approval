import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Booking, UserRole, User } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, getDaysBetweenDates } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import BookingJourney from "@/components/booking/booking-journey";
import RoomAllocationForm from "@/components/booking/room-allocation-form";
import MinimalRoomCalendar from "@/components/booking/minimal-room-calendar";
import { Calendar, Users, MapPin, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";



const BookingInfoCard: React.FC<{booking: any}> = ({ booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>Booking Details</span>
        <BookingStatusBadge status={booking.status} />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
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
          <p className="text-gray-600">
            Number of Rooms: {booking.numberOfRooms}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DepartmentAndRoomCard: React.FC<{booking: any}> = ({ booking }) => (
  <Card>
    <CardHeader>
      <CardTitle>Department & Rooms</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-start space-x-3">
        <MapPin className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium">Referring Department</p>
          <p className="text-gray-600">
            {booking.departmentName}
          </p>
          {booking.roomNumber && (
            <div className="text-gray-600 mt-2">
              <p className="font-medium">Assigned Rooms:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {booking.roomNumber.split(',').map((room: string) => (
                  <span key={room} className="font-medium bg-gray-100 px-2 py-1 rounded">{room.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const NotesCard: React.FC<{booking: any}> = ({ booking }) => (
  (booking.specialRequests || booking.adminNotes || booking.vfastNotes) && (
    <Card>
      <CardHeader>
        <CardTitle>Notes & Special Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {booking.specialRequests && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Special Requests</p>
              <p className="text-gray-600">{booking.specialRequests}</p>
            </div>
          </div>
        )}
        {booking.adminNotes && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Admin Note</p>
              <p className="text-gray-600">{booking.adminNotes}</p>
            </div>
          </div>
        )}
        {booking.vfastNotes && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">VFast Note</p>
              <p className="text-gray-600">{booking.vfastNotes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
);

export default function AllocateRoomPage() {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");

  const { data: booking, isLoading, isError } = useQuery<Booking>({
    queryKey: [`/api/bookings/${bookingId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bookings/${bookingId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch booking details");
      }
      return res.json();
    },
    enabled: !!bookingId,
  });

  const cancelAllocationMutation = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/cancel-allocation`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "Allocation Canceled",
        description: "The room allocation has been canceled and the booking has been sent for reconsideration.",
      });
      setIsCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel allocation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: userDetails, isLoading: isLoadingUserDetails } = useQuery<User>({
    queryKey: [`/api/users/${booking?.userId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${booking?.userId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch user details");
      }
      return res.json();
    },
    enabled: !!booking?.userId,
  });

  if (isLoading || isLoadingUserDetails) {
    return (
      <DashboardLayout title="Loading..." description="" role={UserRole.VFAST}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </DashboardLayout>
    );
  }

  if (isError || !booking || !userDetails) {
    return (
      <DashboardLayout title="Error" description="" role={UserRole.VFAST}>
        <p className="text-red-500">Failed to load booking details or booking not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Allocate Room for Booking #${booking.id}`}
      description="Assign a room to this approved booking request."
      role={UserRole.VFAST}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Tabs for Booking Details, Guest Details, KYC, Room Availability, Journey */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="booking-details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="booking-details">Booking Details</TabsTrigger>
              <TabsTrigger value="guest-details">Guest Details</TabsTrigger>
              <TabsTrigger value="guest-kyc">Guest KYC</TabsTrigger>
              <TabsTrigger value="room-availability">Room Availability</TabsTrigger>
              <TabsTrigger value="journey">Journey</TabsTrigger>
            </TabsList>

            <TabsContent value="booking-details" className="mt-4 flex-grow overflow-y-auto">
              <div className="space-y-6">
                <BookingInfoCard booking={booking} />
                <DepartmentAndRoomCard booking={booking} />
                <NotesCard booking={booking} />
              </div>
            </TabsContent>

            <TabsContent value="guest-details" className="mt-4 flex-grow overflow-y-auto">
              <Card>
                <CardHeader><CardTitle>Guest Details</CardTitle></CardHeader>
                <CardContent>
                  <p>Guest Name: {userDetails?.name}</p>
                  <p>Guest Email: {userDetails?.email}</p>
                  <p>Guest Phone: {userDetails?.phone}</p>
                  {/* Placeholder for more detailed guest information form */}
                  <p className="text-muted-foreground mt-4">Future: Detailed guest profile management.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guest-kyc" className="mt-4 flex-grow overflow-y-auto">
              <Card>
                <CardHeader><CardTitle>Guest KYC & Documents</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Future: Forms and uploads for KYC documents.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="room-availability" className="mt-4 flex-grow overflow-y-auto">
              <MinimalRoomCalendar 
                checkInDate={new Date(booking.checkInDate)} 
                checkOutDate={new Date(booking.checkOutDate)}
              />
            </TabsContent>

            <TabsContent value="journey" className="mt-4 flex-grow overflow-y-auto">
              <Card className="flex flex-col flex-grow">
                <CardHeader>
                  <CardTitle>Booking Journey</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                  <BookingJourney bookingId={booking.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Allocation Form */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Allocation</CardTitle>
              <CardDescription>Select a room and add notes for the allocation.</CardDescription>
            </CardHeader>
            <CardContent>
              <RoomAllocationForm booking={booking} onSuccess={() => { /* Handle success, e.g., navigate back */ }} />
            </CardContent>
            {booking.status === "allocated" && (
              <CardFooter>
                <Button variant="destructive" onClick={() => setIsCancelDialogOpen(true)}>Cancel Allocation</Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Room Allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the room allocation for this booking? This will send the booking back to the requestor for reconsideration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason for Cancellation (Optional)</label>
            <Textarea
              className="mt-2"
              placeholder="Add any notes for the requestor..."
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelAllocationMutation.mutate({ notes: cancelNotes })}
              disabled={cancelAllocationMutation.isPending}
            >
              {cancelAllocationMutation.isPending ? "Canceling..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
