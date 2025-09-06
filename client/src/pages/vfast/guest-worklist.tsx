import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, WorkflowStage } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BookingTable from "@/components/booking/booking-table";
import { Link } from "wouter";

export default function GuestWorklistPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bookings, isLoading, isError, error } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    refetchInterval: 5000, // Keep data fresh
  });

  const getFilteredBookings = () => {
    if (!bookings) return [];

    let filtered = bookings.filter(b => 
      b.currentWorkflowStage === WorkflowStage.ALLOCATED || 
      b.currentWorkflowStage === WorkflowStage.CHECKED_IN
    );

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.id.toString().includes(searchLower) ||
        booking.purpose.toLowerCase().includes(searchLower) ||
        (booking.roomNumber && booking.roomNumber.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  return (
    <DashboardLayout
      title="Guest Management Worklist"
      description="Manage allocated and checked-in bookings and their guests."
      role={UserRole.VFAST}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Active Guest Bookings</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-8"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading bookings...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load bookings: {error?.message}</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No allocated or checked-in bookings found.</p>
              {searchTerm && (
                <p className="mt-2">
                  Try a different search term or clear the search.
                  <Button 
                    variant="link" 
                    className="ml-1 p-0" 
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                </p>
              )}
            </div>
          ) : (
            <BookingTable
              bookings={filteredBookings}
              renderActions={(booking) => (
                <Link href={`/vfast/workflow/${booking.id}`}>
                  <Button size="sm">Manage Workflow</Button>
                </Link>
              )}
            />
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}