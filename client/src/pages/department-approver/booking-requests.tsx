import { useState } from "react";
import { useDepartmentApprovals, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { Booking, BookingStatus } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BookingTable from "@/components/booking/booking-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, X, Calendar, MapPin, Users, FileText } from "lucide-react";
import { formatDate, getDaysBetweenDates } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DepartmentBookingRequests() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("pending_department_approval");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [departmentNotes, setDepartmentNotes] = useState("");

  const { data: bookings, isLoading, isError, error } = useDepartmentApprovals();
  const updateBookingStatusMutation = useUpdateBookingStatus();

  const getFilteredBookings = () => {
    if (!bookings) return [];
    
    let filtered = bookings;

    // Filter by status
    switch (activeTab) {
      case "pending_department_approval":
        filtered = filtered.filter(booking => booking.status === BookingStatus.PENDING_DEPARTMENT_APPROVAL);
        break;
      case "approved":
        filtered = filtered.filter(booking => booking.status === BookingStatus.APPROVED);
        break;
      case "rejected":
        filtered = filtered.filter(booking => booking.status === BookingStatus.REJECTED);
        break;
      case "allocated":
        filtered = filtered.filter(booking => booking.status === BookingStatus.ALLOCATED);
        break;
      case "pending_reconsideration":
        filtered = filtered.filter(booking => booking.status === BookingStatus.PENDING_RECONSIDERATION);
        break;
      // "all" tab doesn't need filtering
    }
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.id.toString().includes(searchLower) ||
        booking.purpose.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleApproveBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsApproveDialogOpen(true);
  };

  const handleRejectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsRejectDialogOpen(true);
  };

  const submitApproveBooking = () => {
    if (!selectedBooking) return;
    
    updateBookingStatusMutation.mutate({
      id: selectedBooking.id,
      status: BookingStatus.PENDING_ADMIN_APPROVAL,
      notes: departmentNotes,
    });
  };

  const submitRejectBooking = () => {
    if (!selectedBooking) return;
    
    updateBookingStatusMutation.mutate({
      id: selectedBooking.id,
      status: BookingStatus.REJECTED,
      notes: departmentNotes,
    });
  };

  return (
    <DashboardLayout 
      title="Booking Requests"
      description="Review and manage booking requests for your department"
      role={UserRole.DEPARTMENT_APPROVER}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Pending Approval</CardTitle>
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
          <Tabs defaultValue="pending_department_approval" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending_department_approval">Pending</TabsTrigger>
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
              renderActions={(booking) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewBooking(booking)}>View</Button>
                  {(booking.status === BookingStatus.PENDING_DEPARTMENT_APPROVAL || booking.status === BookingStatus.PENDING_RECONSIDERATION) && (
                    <>
                      <Button size="sm" onClick={() => handleApproveBooking(booking)}>Approve</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRejectBooking(booking)}>Reject</Button>
                    </>
                  )}
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {selectedBooking && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Booking Request Details</DialogTitle>
              <DialogDescription>
                Request #{selectedBooking.id} submitted on {selectedBooking.createdAt ? formatDate(new Date(selectedBooking.createdAt)) : 'N/A'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Status</h3>
                <BookingStatusBadge status={selectedBooking.status} />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date Range</p>
                    <p className="text-gray-600">
                      {formatDate(new Date(selectedBooking.checkInDate))} - {formatDate(new Date(selectedBooking.checkOutDate))}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getDaysBetweenDates(new Date(selectedBooking.checkInDate), new Date(selectedBooking.checkOutDate))} days
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Guest Information</p>
                    <p className="text-gray-600">
                      User ID: {selectedBooking.userId}
                    </p>
                    <p className="text-gray-600">
                      Purpose: {selectedBooking.purpose}
                    </p>
                    <p className="text-gray-600">
                      Number of Guests: {selectedBooking.guestCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Referring Department</p>
                    <p className="text-gray-600">
                      {selectedBooking.referringDepartment}
                    </p>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Special Requests</p>
                      <p className="text-gray-600">{selectedBooking.specialRequests}</p>
                    </div>
                  </div>
                )}

                {(selectedBooking.adminNotes || selectedBooking.vfastNotes) && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Notes</p>
                      {selectedBooking.adminNotes && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Admin Note:</p>
                          <p className="text-gray-600">{selectedBooking.adminNotes}</p>
                        </div>
                      )}
                      {selectedBooking.vfastNotes && (
                        <div>
                          <p className="text-xs text-gray-500">VFast Note:</p>
                          <p className="text-gray-600">{selectedBooking.vfastNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedBooking && (
        <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Booking Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this booking request? This will send the request for admin approval.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                className="mt-2"
                placeholder="Add any notes..."
                value={departmentNotes}
                onChange={(e) => setDepartmentNotes(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={submitApproveBooking}
                disabled={updateBookingStatusMutation.isPending}
              >
                {updateBookingStatusMutation.isPending ? "Approving..." : "Approve Request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {selectedBooking && (
        <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Booking Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reject this booking request? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea
                className="mt-2"
                placeholder="Please provide a reason for rejecting this booking request..."
                value={departmentNotes}
                onChange={(e) => setDepartmentNotes(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={submitRejectBooking}
                className="bg-destructive hover:bg-destructive/90"
                disabled={updateBookingStatusMutation.isPending}
              >
                {updateBookingStatusMutation.isPending ? "Rejecting..." : "Reject Request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </DashboardLayout>
  );
}