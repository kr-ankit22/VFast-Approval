import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Booking, BookingStatus, Room, RoomType, RoomAllocation as RoomAllocationSchema } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BookingTable from "@/components/booking/booking-table";
import RoomAllocationForm from "@/components/booking/room-allocation-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X, Filter, SortDesc, Calendar, Users, FileText } from "lucide-react";
import { formatDate, getDaysBetweenDates } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@shared/schema";

export default function RoomAllocationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [sortCriteria, setSortCriteria] = useState<string>("date");
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);

  // Fetch bookings that need allocation (APPROVED status)
  const {
    data: bookings,
    isLoading,
    isError,
    error,
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    select: (data) => data.filter(booking => booking.status === BookingStatus.APPROVED)
  });

  // Filter and sort bookings based on search term and sort criteria
  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    let filtered = [...bookings];
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.id.toString().includes(searchLower) ||
        booking.purpose.toLowerCase().includes(searchLower) ||
        booking.referringDepartment.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort based on criteria
    switch (sortCriteria) {
      case "date":
        filtered.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
        break;
      case "priority":
        // For this example, we'll use guest count as a proxy for priority
        // In a real app, you might have a specific priority field
        filtered.sort((a, b) => b.guestCount - a.guestCount);
        break;
      case "department":
        filtered.sort((a, b) => a.referringDepartment.localeCompare(b.referringDepartment));
        break;
      default:
        // Default is sorting by date
        filtered.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
    }
    
    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Handle allocate room
  const handleAllocateRoom = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsAllocationDialogOpen(true);
  };

  // Handle allocation success
  const handleAllocationSuccess = () => {
    setIsAllocationDialogOpen(false);
    setSelectedBooking(null);
  };

  // No longer need room type display

  // Determine priority display based on booking details
  const getPriorityDisplay = (booking: Booking) => {
    // For demo purposes, we'll use guest count and purpose to determine priority
    // In a real app, you might have specific business logic
    if (booking.purpose.includes("Official") || booking.guestCount > 3) {
      return { label: "High", className: "bg-red-100 text-red-800" };
    } else if (booking.purpose.includes("Academic") || booking.guestCount > 1) {
      return { label: "Medium", className: "bg-yellow-100 text-yellow-800" };
    } else {
      return { label: "Normal", className: "bg-green-100 text-green-800" };
    }
  };

  return (
    <DashboardLayout 
      title="Room Allocation"
      description="Assign rooms to approved booking requests"
      role={UserRole.VFAST}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Allocation Queue</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  className="pl-8"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={sortCriteria} onValueChange={setSortCriteria}>
                <SelectTrigger className="w-[140px]">
                  <div className="flex items-center">
                    <SortDesc size={16} className="mr-2" />
                    <span>Sort by</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Check-in Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading allocation queue...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load bookings: {error?.message}</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No bookings waiting for room allocation.</p>
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
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const priority = getPriorityDisplay(booking);
                    return (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{booking.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          User #{booking.userId} {/* In a real app, you'd show the user's name */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(new Date(booking.checkInDate))} - {formatDate(new Date(booking.checkOutDate))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.referringDepartment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${priority.className}`}>
                            {priority.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            className="bg-primary text-white px-3 py-1 rounded-md text-xs hover:bg-opacity-90"
                            onClick={() => handleAllocateRoom(booking)}
                          >
                            Allocate
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Allocation Dialog */}
      {selectedBooking && (
        <Dialog open={isAllocationDialogOpen} onOpenChange={setIsAllocationDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Allocate Room</DialogTitle>
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
