import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BookingTable from "@/components/booking/booking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import BookingDetailsModal from "@/components/booking/booking-details-modal";
import { useParams } from "wouter";

export default function VFastAllBookingRequests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const params = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch all bookings
  const { data: bookings, isLoading, isError, error } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number, status: BookingStatus }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update booking status");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error updating the booking status.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (params.id && bookings) {
      const bookingId = parseInt(params.id);
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setIsViewDialogOpen(true);
      }
    }
  }, [params.id, bookings]);

  // Filter bookings based on active tab and search term
  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    let filtered = bookings;
    
    // Filter by status
    switch (activeTab) {
      case "approved":
        filtered = filtered.filter(booking => booking.status === BookingStatus.APPROVED);
        break;
      case "allocated":
        filtered = filtered.filter(booking => booking.status === BookingStatus.ALLOCATED);
        break;
      case "rejected":
        filtered = filtered.filter(booking => booking.status === BookingStatus.REJECTED);
        break;
      case "pending_reconsideration":
        filtered = filtered.filter(booking => booking.status === BookingStatus.PENDING_RECONSIDERATION);
        break;
      // "all" tab doesn't need filtering
    }
    
    // Filter by search term if provided
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

  // Handle view booking details
  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = (bookingId: number, status: BookingStatus) => {
    updateBookingStatusMutation.mutate({ bookingId, status });
  };

  return (
    <DashboardLayout 
      title="All Booking Requests"
      description="View all booking requests across the system"
      role={UserRole.VFAST}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>All Booking Requests</CardTitle>
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
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="allocated">Allocated</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="pending_reconsideration">Reconsideration</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading booking requests...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load bookings: {error?.message}</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No {activeTab !== "all" ? activeTab : ""} booking requests found.</p>
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
              showRequestType={true}
              renderActions={(booking) => {
                const canApprove = user?.role === UserRole.VFAST && booking.status === BookingStatus.PENDING_RECONSIDERATION;
                return (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewBooking(booking)}>View</Button>
                    {canApprove && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">Approve</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will approve the booking request.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUpdateStatus(booking.id, BookingStatus.APPROVED)}>
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Reject</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will reject the booking request.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUpdateStatus(booking.id, BookingStatus.REJECTED)}>
                                Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                )
              }}
            />
          )}

          <div className="mt-4 flex justify-between items-center text-sm">
            <div className="text-gray-500">
              {filteredBookings.length > 0 && `Showing ${filteredBookings.length} ${activeTab !== "all" ? activeTab : ""} requests`}
            </div>
            {/* Pagination can be added here if needed */}
          </div>
        </CardContent>
      </Card>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          userRole={UserRole.VFAST}
        />
      )}
    </DashboardLayout>
  );
}
