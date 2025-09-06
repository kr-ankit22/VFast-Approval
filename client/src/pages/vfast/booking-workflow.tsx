import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus, WorkflowStage, GuestCheckInStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import BookingTable from "@/components/booking/booking-table";
import RoomAllocationForm from "@/components/booking/room-allocation-form";
import GuestManagementCard from "@/components/booking/guest-management-card";
import GuestNotesCard from "@/components/booking/guest-notes-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function BookingWorkflowPage() {
  const [activeTab, setActiveTab] = useState<WorkflowStage>(WorkflowStage.ALLOCATION_PENDING);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const params = useParams();
  const bookingIdFromUrl = params.id ? parseInt(params.id) : null;

  const { data: bookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
  });

  const { data: singleBooking, isLoading: isLoadingSingleBooking } = useQuery<any>({
    queryKey: bookingIdFromUrl ? [`/api/bookings/${bookingIdFromUrl}`] : [],
    enabled: !!bookingIdFromUrl,
  });

  useEffect(() => {
    if (singleBooking) {
      setSelectedBooking(singleBooking);
      if (singleBooking.currentWorkflowStage === WorkflowStage.ALLOCATED) {
        setActiveTab(WorkflowStage.ALLOCATED);
      } else if (singleBooking.currentWorkflowStage === WorkflowStage.CHECKED_IN) {
        setActiveTab(WorkflowStage.CHECKED_IN);
      } else if (singleBooking.currentWorkflowStage === WorkflowStage.CHECKED_OUT) {
        setActiveTab(WorkflowStage.CHECKED_OUT);
      }
    }
  }, [singleBooking]);

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, notes }: { bookingId: number, status: BookingStatus, notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status, notes, approverId: 1 }); // Assuming admin user for now
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update booking status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Status Updated",
        description: "Booking status updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking status.",
        variant: "destructive",
      });
    },
  });

  const handleAllocateRoom = (booking: any) => {
    setSelectedBooking(booking);
    setIsAllocationDialogOpen(true);
  };

  const handleAllocationSuccess = () => {
    setIsAllocationDialogOpen(false);
    setSelectedBooking(null);
    // After allocation, move to Guest Management tab
    setActiveTab(WorkflowStage.ALLOCATED);
  };

  const handleRejectBooking = async (bookingId: number) => {
    await updateBookingStatusMutation.mutateAsync({ bookingId, status: BookingStatus.REJECTED, notes: "Rejected by VFast user during allocation." });
  };

  const handleCheckInGuest = async (guestId: number) => {
    // Implement API call to update guest check-in status
    toast({
      title: "Guest Check-in",
      description: `Guest ${guestId} checked in (simulated).`,
    });
    // Invalidate guests query for this booking
    queryClient.invalidateQueries({ queryKey: [`/api/bookings/${selectedBooking.id}/guests`] });
  };

  const handleCheckOutGuest = async (guestId: number) => {
    // Implement API call to update guest check-out status
    toast({
      title: "Guest Check-out",
      description: `Guest ${guestId} checked out (simulated).`,
    });
    // Invalidate guests query for this booking
    queryClient.invalidateQueries({ queryKey: [`/api/bookings/${selectedBooking.id}/guests`] });
  };

  const handleMarkBookingCheckedIn = async (bookingId: number) => {
    await updateWorkflowStageMutation.mutateAsync({ bookingId, stage: WorkflowStage.CHECKED_IN, checkInStatus: GuestCheckInStatus.CHECKED_IN });
  };

  const handleMarkBookingCheckedOut = async (bookingId: number) => {
    await updateWorkflowStageMutation.mutateAsync({ bookingId, stage: WorkflowStage.CHECKED_OUT, checkInStatus: GuestCheckInStatus.CHECKED_OUT });
    // Also need to update room status to AVAILABLE here
  };

  const allocationBookings = bookings?.filter(b => b.currentWorkflowStage === WorkflowStage.ALLOCATION_PENDING) || [];
  const allocatedBookings = bookings?.filter(b => b.currentWorkflowStage === WorkflowStage.ALLOCATED) || [];
  const checkedInBookings = bookings?.filter(b => b.currentWorkflowStage === WorkflowStage.CHECKED_IN) || [];
  const checkedOutBookings = bookings?.filter(b => b.currentWorkflowStage === WorkflowStage.CHECKED_IN && new Date(b.checkOutDate) <= new Date()) || [];

  return (
    <DashboardLayout
      title="Booking Workflow Management"
      description="Manage bookings through allocation, guest check-in, and check-out."
      role={UserRole.VFAST}
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkflowStage)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value={WorkflowStage.ALLOCATION_PENDING}>Allocation</TabsTrigger>
          <TabsTrigger value={WorkflowStage.ALLOCATED}>Guest Management & Check-in</TabsTrigger>
          <TabsTrigger value={WorkflowStage.CHECKED_IN}>Stay Experience</TabsTrigger>
          <TabsTrigger value={WorkflowStage.CHECKED_OUT}>Check-out</TabsTrigger>
        </TabsList>

        {/* Allocation Tab */}
        <TabsContent value={WorkflowStage.ALLOCATION_PENDING} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings Pending Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading bookings...</span>
                </div>
              ) : allocationBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No bookings currently pending allocation.</p>
                </div>
              ) : (
                <BookingTable
                  bookings={allocationBookings}
                  renderActions={(booking) => (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAllocateRoom(booking)}>Allocate</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRejectBooking(booking.id)}>Reject</Button>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guest Management & Check-in Tab */}
        <TabsContent value={WorkflowStage.ALLOCATED} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Allocated Bookings - Guest Management & Check-in</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || isLoadingSingleBooking ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading bookings...</span>
                </div>
              ) : allocatedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No bookings currently allocated.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allocatedBookings.map(booking => (
                    <Card key={booking.id}>
                      <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Booking #{booking.id} - {booking.purpose}</CardTitle>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setSelectedBooking(booking)}>View Details</Button>
                          <Button size="sm" onClick={() => handleMarkBookingCheckedIn(booking.id)}>Mark Checked In</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <GuestManagementCard bookingId={booking.id} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stay Experience Tab */}
        <TabsContent value={WorkflowStage.CHECKED_IN} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Checked-in Bookings - Stay Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || isLoadingSingleBooking ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading bookings...</span>
                </div>
              ) : checkedInBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No bookings currently checked in.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkedInBookings.map(booking => (
                    <Card key={booking.id}>
                      <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Booking #{booking.id} - {booking.purpose}</CardTitle>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setSelectedBooking(booking)}>View Details</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <GuestManagementCard bookingId={booking.id} />
                        {/* Display notes for each guest in this booking */}
                        {/* This would require fetching guests for this booking and then notes for each guest */}
                        {/* For now, we'll just show a placeholder */}
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Guest Notes (Placeholder)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">Notes for guests in this booking will appear here.</p>
                            {/* Example of how to use GuestNotesCard if we had guest IDs */}
                            {/* {booking.guests.map(guest => (
                              <GuestNotesCard key={guest.id} guestId={guest.id} />
                            ))} */}
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-out Tab */}
        <TabsContent value={WorkflowStage.CHECKED_OUT} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings Ready for Check-out</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || isLoadingSingleBooking ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading bookings...</span>
                </div>
              ) : checkedOutBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No bookings currently ready for check-out.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkedOutBookings.map(booking => (
                    <Card key={booking.id}>
                      <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle>Booking #{booking.id} - {booking.purpose}</CardTitle>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setSelectedBooking(booking)}>View Details</Button>
                          <Button size="sm" onClick={() => handleMarkBookingCheckedOut(booking.id)}>Mark Checked Out</Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <GuestManagementCard bookingId={booking.id} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Room Allocation Dialog */}
      {selectedBooking && (
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Allocate Room for Booking #{selectedBooking.id}</DialogTitle>
            </DialogHeader>
            <RoomAllocationForm 
              booking={selectedBooking} 
              onSuccess={handleAllocationSuccess} 
            />
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}