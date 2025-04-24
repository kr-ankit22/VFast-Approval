import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Booking, BookingStatus } from "@shared/schema";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function BookingHistory() {
  const { toast } = useToast();
  
  // Fetch user's bookings
  const { data: bookings, isLoading, error } = useQuery<Booking[]>({
    queryKey: ["/api/my-bookings"],
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to load bookings",
        variant: "destructive",
      });
    },
  });
  
  // Function to render the status badge with appropriate color
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      case BookingStatus.APPROVED:
        return <Badge variant="outline" className="border-green-500 text-green-500">Approved</Badge>;
      case BookingStatus.REJECTED:
        return <Badge variant="outline" className="border-red-500 text-red-500">Rejected</Badge>;
      case BookingStatus.ALLOCATED:
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Allocated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Booking History</h1>
        <Button variant="outline" asChild>
          <Link href="/booking">Back to Dashboard</Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Failed to load your bookings. Please try again.
        </div>
      ) : bookings && bookings.length > 0 ? (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Purpose</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Check-in</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Check-out</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Guests</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{booking.purpose}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(new Date(booking.checkInDate))}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(new Date(booking.checkOutDate))}</td>
                    <td className="px-4 py-3 text-sm">{booking.guestCount}</td>
                    <td className="px-4 py-3 text-sm">{booking.referringDepartment}</td>
                    <td className="px-4 py-3 text-sm">{renderStatusBadge(booking.status as BookingStatus)}</td>
                    <td className="px-4 py-3 text-sm">{booking.roomNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-muted p-8 text-center rounded-lg">
          <p className="text-muted-foreground mb-4">You have no booking requests yet</p>
          <Button asChild>
            <Link href="/booking/create">Create Your First Booking</Link>
          </Button>
        </div>
      )}
    </div>
  );
}