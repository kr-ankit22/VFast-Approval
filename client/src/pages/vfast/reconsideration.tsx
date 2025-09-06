import { useQuery } from "@tanstack/react-query";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import VFastBookingQueue from "@/components/vfast/VFastBookingQueue";

export default function ReconsiderationPage() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const allocationBookings = bookings?.filter(b => b.status === BookingStatus.APPROVED) || [];
  const reconsiderationBookings = bookings?.filter(b => b.status === BookingStatus.PENDING_RECONSIDERATION) || [];

  return (
    <DashboardLayout
      title="V-Fast Queues"
      description="Manage room allocations and reconsideration requests"
      role={UserRole.VFAST}
    >
      <VFastBookingQueue 
        allocationBookings={allocationBookings}
        reconsiderationBookings={reconsiderationBookings}
        isLoading={isLoading}
      />
    </DashboardLayout>
  );
}
