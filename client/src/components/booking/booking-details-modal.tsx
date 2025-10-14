import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Booking, BookingStatus, UserRole } from "@shared/schema";
import { formatDate, getDaysBetweenDates } from "@/lib/utils";
import BookingStatusBadge from "@/components/booking/booking-status-badge";
import BookingJourney from "@/components/booking/booking-journey";
import { Calendar, Users, MapPin, FileText, X } from "lucide-react";

interface BookingDetailsModalProps {
  booking: any;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userRole: UserRole;
  onApprove?: (booking: any) => void;
  onReject?: (booking: any) => void;
  onAllocate?: (booking: any) => void;
}



const BookingInfoCard: React.FC<{booking: any}> = ({ booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>Booking Details</span>
        <BookingStatusBadge status={booking.status} />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-start space-x-3">
        <Calendar className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium">Date Range</p>
          <p className="text-gray-600">
            {formatDate(new Date(booking.checkInDate))} - {formatDate(new Date(booking.checkOutDate))}
          </p>
          <p className="text-sm text-gray-500">
            {getDaysBetweenDates(new Date(booking.checkInDate), new Date(booking.checkOutDate))} days
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <Users className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium">Guest Information</p>
          <p className="text-gray-600">
            User ID: {booking.userId}
          </p>
          <p className="text-gray-600">
            Purpose: {booking.purpose}
          </p>
          <p className="text-gray-600">
            Number of Guests: {booking.guestCount}
          </p>
          <p className="text-gray-600">
            Number of Rooms: {booking.numberOfRooms}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DepartmentAndRoomCard: React.FC<{booking: any}> = ({ booking }) => (
  <Card>
    <CardHeader>
      <CardTitle>Department & Rooms</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-start space-x-3">
        <MapPin className="h-5 w-5 text-primary mt-0.5" />
        <div>
          <p className="font-medium">Referring Department</p>
          <p className="text-gray-600">
            {booking.departmentName}
          </p>
          {booking.departmentNotes && ( // Display department notes here
            <p className="text-gray-600 mt-2">
              Department Note: <span className="font-medium">{booking.departmentNotes}</span>
            </p>
          )}
          {booking.roomNumber && (
            <div className="text-gray-600 mt-2">
              <p className="font-medium">Assigned Rooms:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {booking.roomNumber.split(',').map((room: string) => (
                  <span key={room} className="font-medium bg-gray-100 px-2 py-1 rounded">{room.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const NotesCard: React.FC<{booking: any}> = ({ booking }) => (
  (booking.specialRequests || booking.adminNotes || booking.vfastNotes || booking.rejectionHistory?.length > 0) && (
    <Card>
      <CardHeader>
        <CardTitle>Notes & Special Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {booking.specialRequests && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Special Requests</p>
              <p className="text-gray-600">{booking.specialRequests}</p>
            </div>
          </div>
        )}
        {booking.adminNotes && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Admin Note</p>
              <p className="text-gray-600">{booking.adminNotes}</p>
            </div>
          </div>
        )}
        {booking.vfastNotes && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">VFast Note</p>
              <p className="text-gray-600">{booking.vfastNotes}</p>
            </div>
          </div>
        )}
        
        {booking.rejectionHistory && booking.rejectionHistory.length > 0 && (
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Rejection History</p>
              {booking.rejectionHistory.map((rejection: any, index: number) => (
                <div key={index} className="mb-2">
                  <p className="text-xs text-gray-500">Rejected on {formatDate(new Date(rejection.rejectedAt))}</p>
                  <p className="text-gray-600">Reason: {rejection.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
);

export default function BookingDetailsModal({ 
  booking, 
  isOpen, 
  onOpenChange, 
  userRole, 
  onApprove, 
  onReject, 
  onAllocate
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const canTakeAction = 
    (userRole === UserRole.ADMIN && (booking.status === BookingStatus.PENDING_ADMIN_APPROVAL || booking.status === BookingStatus.PENDING_RECONSIDERATION)) ||
    (userRole === UserRole.DEPARTMENT_APPROVER && booking.status === BookingStatus.PENDING_DEPARTMENT_APPROVAL);

  const canAllocate = userRole === UserRole.VFAST && booking.status === BookingStatus.APPROVED;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Booking Request Details</DialogTitle>
          <DialogDescription>
            Request #{booking.id} submitted on {booking.createdAt ? formatDate(new Date(booking.createdAt)) : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            <BookingInfoCard booking={booking} />
            <DepartmentAndRoomCard booking={booking} />
            <NotesCard booking={booking} />
          </div>

          {/* Right Column */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingJourney bookingId={booking.id} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0">
          {canTakeAction && onReject && onApprove && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => {
                  onOpenChange(false);
                  onReject(booking);
                }}
              >
                Reject
              </Button>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  onApprove(booking);
                }}
              >
                Approve
              </Button>
            </>
          )}
          {canAllocate && onAllocate && (
            <Button 
              onClick={() => {
                onOpenChange(false);
                onAllocate(booking);
              }}
            >
              Allocate Room
            </Button>
          )}
          {!canTakeAction && !canAllocate && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}