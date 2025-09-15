import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus, GuestCheckInStatus } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGetGuestWorklist } from "@/hooks/use-bookings";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GuestManagementCard from "@/components/booking/guest-management-card";
import GuestNotesSection from "@/components/booking/guest-notes-section";
import { useCheckInBooking, useCheckOutBooking } from "@/hooks/use-bookings";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GuestWorklistPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: bookings, isLoading, isError, error } = useGetGuestWorklist();
  const { toast } = useToast();
  const checkInBookingMutation = useCheckInBooking();
  const checkOutBookingMutation = useCheckOutBooking();

  const getFilteredBookings = () => {
    if (!bookings) return [];

    let filtered = bookings;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.id.toString().includes(searchLower) ||
        booking.userName.toLowerCase().includes(searchLower) ||
        (booking.roomNumber && booking.roomNumber.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const handleCheckInBooking = async (bookingId: number) => {
    // Fetch guests for the booking to check KYC status
    const guestsResponse = await fetch(`/api/bookings/${bookingId}/guests`);
    const guests = await guestsResponse.json();

    const allGuestsKycVerified = guests.every((guest: any) => guest.isVerified);

    if (!allGuestsKycVerified) {
      toast({
        title: "KYC Verification Required",
        description: "All guests must have their KYC documents verified before check-in.",
        variant: "destructive",
      });
      return;
    }

    checkInBookingMutation.mutate(bookingId);
  };

  const handleCheckOutBooking = (bookingId: number) => {
    checkOutBookingMutation.mutate(bookingId);
  };

  const filteredBookings = getFilteredBookings();

  return (
    <DashboardLayout
      title="Guest Worklist"
      description="Manage allocated and checked-in bookings and their guests."
      role={UserRole.VFAST}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Guest Worklist</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-8"
                placeholder="Search by Booking ID, Name, Room..."
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest Name</TableHead>
                    <TableHead>Guests</TableHead> {/* New column */}
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <Collapsible asChild key={booking.id}>
                      <>
                        <TableRow className={
                          booking.checkInStatus === GuestCheckInStatus.CHECKED_IN
                            ? 'bg-red-50'
                            : booking.checkInStatus === GuestCheckInStatus.ALLOCATED
                            ? 'bg-green-50'
                            : ''
                        }>
                          <TableCell className="font-medium">{booking.id}</TableCell>
                          <TableCell>{booking.firstCheckedInGuestName || booking.firstGuestName || booking.userName || 'N/A'}</TableCell> {/* Prioritize firstCheckedInGuestName */}
                          <TableCell>{booking.guestCount || 0}</TableCell> {/* Updated to use guestCount */}
                          <TableCell>{format(new Date(booking.checkInDate), "PPP")}</TableCell>
                          <TableCell>{format(new Date(booking.checkOutDate), "PPP")}</TableCell>
                          <TableCell>{booking.roomNumber}</TableCell>
                          <TableCell>
                            {booking.checkInStatus === GuestCheckInStatus.CHECKED_IN ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Checked In</Badge>
                            ) : booking.checkInStatus === GuestCheckInStatus.CHECKED_OUT ? (
                              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Checked Out</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Allocated</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              
                              <CollapsibleTrigger asChild>
                                <Button size="sm">Manage</Button>
                              </CollapsibleTrigger>
                            </div>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={8} className="p-4"> {/* colSpan updated to 8 */}
                              {/* Directly render GuestManagementCard */}
                              <GuestManagementCard bookingId={booking.id} />
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
