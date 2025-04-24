import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import { Link } from "wouter";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  FileSearch, 
  Filter, 
  Loader2, 
  Search,
  SlidersHorizontal
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function BookingHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch user's bookings
  const { data: bookings = [], isLoading, error } = useQuery<Booking[]>({
    queryKey: ["/api/my-bookings"]
  });
  
  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load bookings",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
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

  // Filter and search bookings
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }
    
    // Search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.purpose.toLowerCase().includes(searchLower) ||
        booking.referringDepartment.toLowerCase().includes(searchLower) ||
        (booking.roomNumber && booking.roomNumber.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  return (
    <DashboardLayout 
      title="My Bookings" 
      description="View and manage all your hostel booking requests"
      role={UserRole.BOOKING}
    >
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search by purpose, department or room"
              className="ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
          </Button>
        </div>
        
        {showFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="allocated">Allocated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8 bg-white rounded-lg shadow">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Error Loading Bookings</h3>
          <p>We encountered a problem loading your bookings. Please try again.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{booking.purpose}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(new Date(booking.checkInDate))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(new Date(booking.checkOutDate))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{booking.guestCount}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{booking.referringDepartment}</td>
                    <td className="px-4 py-4 text-sm">{renderStatusBadge(booking.status as BookingStatus)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {booking.roomNumber || 
                        <span className="text-gray-400 italic">Not assigned</span>
                      }
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <FileSearch className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-lg shadow">
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <FileSearch className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You have no booking requests yet. Create your first booking request to get started."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button asChild>
                <Link href="/booking/create">Create Your First Booking</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}