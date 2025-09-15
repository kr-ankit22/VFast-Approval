
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus, type Booking } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function PendingAllocations() {
  const { user } = useAuth();

  // Get all approved bookings
  const { data: approvedBookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/approved"],
    onSuccess: (data) => {
      console.log("Approved bookings:", data);
    }
  });

  return (
    <DashboardLayout
      title="Pending Allocations"
      description="View all approved bookings that are pending room allocation."
      role={UserRole.VFAST}
    >
      <Card>
        <CardHeader>
          <CardTitle>Pending Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : approvedBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bookings are pending allocation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Purpose</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Check-in</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {approvedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b">
                      <td className="py-3 px-4">{booking.id}</td>
                      <td className="py-3 px-4">{booking.purpose}</td>
                      <td className="py-3 px-4">{booking.departmentName}</td>
                      <td className="py-3 px-4">{formatDate(new Date(booking.checkInDate))}</td>
                      <td className="py-3 px-4">
                        <Link href={`/vfast/workflow/${booking.id}`}>
                          <Button variant="outline" size="sm">Allocate</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
