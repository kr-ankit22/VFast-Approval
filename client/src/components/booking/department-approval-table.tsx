import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BookingTable from "./booking-table";
import DepartmentApprovalActions from "./department-approval-actions";
import { Booking, BookingStatus } from "@shared/schema";

type DepartmentApprovalTableProps = {
  bookings: Booking[];
};

export default function DepartmentApprovalTable({ bookings }: DepartmentApprovalTableProps) {
  const { toast } = useToast();

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: BookingStatus }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/department-approval`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update booking status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/department-approvals"] });
      toast({
        title: "Booking status updated",
        description: "The booking has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (bookingId: number) => {
    updateBookingStatusMutation.mutate({ bookingId, status: BookingStatus.PENDING_ADMIN_APPROVAL });
  };

  const handleReject = (bookingId: number) => {
    updateBookingStatusMutation.mutate({ bookingId, status: BookingStatus.REJECTED });
  };

  return (
    <BookingTable
      bookings={bookings}
      renderActions={(booking) => (
        <DepartmentApprovalActions
          onApprove={() => handleApprove(booking.id)}
          onReject={() => handleReject(booking.id)}
        />
      )}
    />
  );
}
