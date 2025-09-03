import { useState } from "react";
import { useGetReconsiderationBookings } from "@/hooks/use-bookings";
import { Booking, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookingTable from "@/components/booking/booking-table";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Reconsideration() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bookings = [], isLoading, isError } = useGetReconsiderationBookings();

  const filteredBookings = bookings?.filter(booking => 
    booking.purpose.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="Reconsideration Requests"
      description="Review and handle requests for booking reconsideration"
      role={UserRole.VFAST}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Pending Requests</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-8"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {isError && <p className="text-red-500">Failed to load booking requests.</p>}
          {filteredBookings && (
            <BookingTable
              bookings={filteredBookings}
              renderActions={(booking) => (
                <Button variant="outline" size="sm">
                  Review
                </Button>
              )}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
