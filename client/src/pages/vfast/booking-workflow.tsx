import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus, WorkflowStage } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AllocationTable from "@/components/booking/allocation-table";
import RoomAllocationForm from "@/components/booking/room-allocation-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import BookingDetailsModal from "@/components/booking/booking-details-modal";

export default function BookingWorkflowPage() {
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 5000,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ["/api/stats/vfast-allocation"],
    refetchInterval: 5000,
  });

  const handleAllocateRoom = (booking: any) => {
    setSelectedBooking(booking);
    setIsAllocationDialogOpen(true);
  };

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleAllocationSuccess = () => {
    setIsAllocationDialogOpen(false);
    setSelectedBooking(null);
    queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/vfast-allocation"] });
  };

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, notes }: { bookingId: number, status: BookingStatus, notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status, notes, approverId: 1 });
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

  const handleRejectBooking = async (bookingId: number) => {
    await updateBookingStatusMutation.mutateAsync({ bookingId, status: BookingStatus.REJECTED, notes: "Rejected by VFast user during allocation." });
  };

  const allocationBookings = bookings?.filter(b => b.status === BookingStatus.APPROVED) || [];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.pendingAllocations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Available Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.roomsAvailableToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Check-outs (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.upcomingCheckouts || 0}</div>
          </CardContent>
        </Card>
      </div>

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
            <div className="overflow-x-auto">
              <AllocationTable
                bookings={allocationBookings}
                renderActions={(booking) => (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewBooking(booking)}>View</Button>
                    <Button size="sm" onClick={() => handleAllocateRoom(booking)}>Allocate</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRejectBooking(booking.id)}>Reject</Button>
                  </div>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="w-full max-w-full sm:max-w-md md:max-w-lg p-4">
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

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          userRole={UserRole.VFAST}
          onAllocate={(booking) => {
            setIsViewModalOpen(false);
            handleAllocateRoom(booking);
          }}
        />
      )}
    </>
  );
}
