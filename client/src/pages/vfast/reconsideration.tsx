import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Search, 
  X, 
  UserCircle, 
  Calendar, 
  MapPin, 
  FileText 
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { Textarea } from "@/components/ui/textarea";

// Mock reconsideration requests data
const mockReconsiderations = [
  {
    id: 1,
    bookingId: 123,
    userId: 456,
    userName: "John Doe",
    reason: "Need a room closer to the conference hall due to mobility issues.",
    status: "pending",
    createdAt: new Date(2023, 11, 15)
  },
  {
    id: 2,
    bookingId: 124,
    userId: 457,
    userName: "Jane Smith",
    reason: "Requesting a room change due to noise issues in current allocation.",
    status: "pending",
    createdAt: new Date(2023, 11, 20)
  },
  {
    id: 3,
    bookingId: 125,
    userId: 458,
    userName: "Amit Kumar",
    reason: "Allocated room doesn't have the requested accessibility features.",
    status: "pending",
    createdAt: new Date(2023, 11, 22)
  },
  {
    id: 4,
    bookingId: 126,
    userId: 459,
    userName: "Sara Johnson",
    reason: "Need to extend my stay by one more day due to travel changes.",
    status: "pending",
    createdAt: new Date(2023, 11, 25)
  },
  {
    id: 5,
    bookingId: 127,
    userId: 460,
    userName: "Michael Brown",
    reason: "Requesting to change from single to double room for family accommodation.",
    status: "pending",
    createdAt: new Date(2023, 11, 28)
  }
];

export default function Reconsideration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Fetch bookings (to get details for reconsideration requests)
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isError: isBookingsError,
  } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Filter reconsideration requests based on search term
  const getFilteredRequests = () => {
    if (searchTerm.trim() === "") return mockReconsiderations;
    
    const searchLower = searchTerm.toLowerCase();
    return mockReconsiderations.filter(request => 
      request.userName.toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower) ||
      request.bookingId.toString().includes(searchLower)
    );
  };

  const filteredRequests = getFilteredRequests();

  // Handle view request details
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    
    // Find the associated booking
    if (bookings) {
      const booking = bookings.find(b => b.id === request.bookingId);
      setSelectedBooking(booking || null);
    }
    
    setIsDialogOpen(true);
  };

  // Handle approve reconsideration
  const handleApproveReconsideration = () => {
    // In a real app, you would call an API to update the reconsideration status
    console.log("Approved reconsideration:", selectedRequest.id, "with note:", responseNote);
    setIsDialogOpen(false);
    setResponseNote("");
  };

  // Handle reject reconsideration
  const handleRejectReconsideration = () => {
    // In a real app, you would call an API to update the reconsideration status
    console.log("Rejected reconsideration:", selectedRequest.id, "with note:", responseNote);
    setIsDialogOpen(false);
    setResponseNote("");
  };

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
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading reconsideration requests...</span>
            </div>
          ) : isBookingsError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load booking data</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No reconsideration requests found.</p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>#{request.bookingId}</TableCell>
                      <TableCell>{request.userName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewRequest(request)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reconsideration Request Dialog */}
      {selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Reconsideration Request #{selectedRequest.id}</DialogTitle>
              <DialogDescription>
                Submitted on {formatDate(selectedRequest.createdAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              <div className="flex items-start space-x-3">
                <UserCircle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Guest Information</p>
                  <p className="text-gray-600">
                    {selectedRequest.userName} (ID: {selectedRequest.userId})
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Reconsideration Reason</p>
                  <p className="text-gray-600">
                    {selectedRequest.reason}
                  </p>
                </div>
              </div>

              {selectedBooking && (
                <div className="rounded border p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Related Booking Information</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Booking ID:</span>
                      <span className="text-sm">#{selectedBooking.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Status:</span>
                      <BookingStatusBadge status={selectedBooking.status} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Dates:</span>
                      <span className="text-sm">
                        {formatDate(new Date(selectedBooking.checkInDate))} - {formatDate(new Date(selectedBooking.checkOutDate))}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Room Type:</span>
                      <span className="text-sm">{selectedBooking.roomPreference}</span>
                    </div>
                    
                    {selectedBooking.roomNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Allocated Room:</span>
                        <span className="text-sm">{selectedBooking.roomNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Response Note
                </label>
                <Textarea
                  placeholder="Add your response or explanation..."
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectReconsideration}
              >
                Reject Request
              </Button>
              <Button 
                onClick={handleApproveReconsideration}
              >
                Approve Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
