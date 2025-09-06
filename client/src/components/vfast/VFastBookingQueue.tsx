import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoomAllocationForm from "@/components/booking/room-allocation-form";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Booking, BookingStatus } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X, Filter, SortDesc } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingTable from "@/components/booking/booking-table";
import BookingDetailsModal from "@/components/booking/booking-details-modal";
import { useAuth } from "@/hooks/use-auth";

interface VFastBookingQueueProps {
  allocationBookings: Booking[];
  reconsiderationBookings: Booking[];
  isLoading: boolean;
}

export default function VFastBookingQueue({ 
  allocationBookings, 
  reconsiderationBookings, 
  isLoading 
}: VFastBookingQueueProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("allocation");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCriteria, setSortCriteria] = useState("checkInDate");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);

  const [, navigate] = useLocation();

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleAllocateRoom = (booking: Booking) => {
    navigate(`/vfast/allocate/${booking.id}`);
  };

  const getFilteredAndSortedBookings = (bookings: Booking[]) => {
    if (!bookings) return [];

    let filtered = [...bookings];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.id.toString().includes(searchLower) ||
        booking.purpose.toLowerCase().includes(searchLower) ||
        (booking.departmentName && booking.departmentName.toLowerCase().includes(searchLower))
      );
    }

    switch (sortCriteria) {
      case "checkInDate":
        filtered.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
        break;
      case "checkOutDate":
        filtered.sort((a, b) => new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime());
        break;
      case "department":
        filtered.sort((a, b) => (a.departmentName || "").localeCompare(b.departmentName || ""));
        break;
      default:
        filtered.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
    }

    return filtered;
  };

  const allocationQueue = getFilteredAndSortedBookings(allocationBookings);
  const reconsiderationQueue = getFilteredAndSortedBookings(reconsiderationBookings);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>V-Fast Queues</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Link href="/vfast/room-availability">
              <Button variant="outline">View Room Availability</Button>
            </Link>
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
              <SelectTrigger className="w-[160px]">
                <div className="flex items-center">
                  <SortDesc size={16} className="mr-2" />
                  <span>Sort by</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkInDate">Check-in Date</SelectItem>
                <SelectItem value="checkOutDate">Check-out Date</SelectItem>
                <SelectItem value="department">Department</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="allocation" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="allocation">Allocation Queue ({allocationQueue.length})</TabsTrigger>
            <TabsTrigger value="reconsideration">Reconsideration Queue ({reconsiderationQueue.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="allocation">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <BookingTable
                bookings={allocationQueue}
                renderActions={(booking) => (
                  <Button variant="outline" size="sm" onClick={() => handleAllocateRoom(booking)}>
                    Allocate
                  </Button>
                )}
              />
            )}
          </TabsContent>
          <TabsContent value="reconsideration">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <BookingTable
                bookings={reconsiderationQueue}
                renderActions={(booking) => (
                  <Button variant="outline" size="sm" onClick={() => handleViewBooking(booking)}>
                    View
                  </Button>
                )}
              />
            )}
          </TabsContent>
        </Tabs>
        {selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            isOpen={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            userRole={user?.role}
            showAllocationForm={activeTab === "allocation"} // Pass this prop
          />
        )}
      </CardContent>
    </Card>
  );
}
