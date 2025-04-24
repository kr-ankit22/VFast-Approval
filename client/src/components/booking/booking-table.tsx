import { Booking, BookingStatus } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BookingStatusBadge from "./booking-status-badge";
import { Button } from "@/components/ui/button";
import { Eye, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BookingTableProps {
  bookings: Booking[];
  role: "booking" | "admin" | "vfast";
  onView?: (booking: Booking) => void;
  onApprove?: (booking: Booking) => void;
  onReject?: (booking: Booking) => void;
  onAllocate?: (booking: Booking) => void;
}

export default function BookingTable({
  bookings,
  role,
  onView,
  onApprove,
  onReject,
  onAllocate,
}: BookingTableProps) {
  // Define columns based on role
  const getColumns = () => {
    const baseColumns = [
      { key: "id", header: role === "booking" ? "Booking ID" : "Request ID" },
      { key: "dates", header: "Date Range" },
      { key: "roomType", header: "Room Type" },
      { key: "status", header: "Status" },
      { key: "actions", header: "Actions" },
    ];

    if (role === "admin" || role === "vfast") {
      baseColumns.splice(1, 0, { key: "requester", header: "Requester" });
    }

    return baseColumns;
  };

  const columns = getColumns();

  // Format date range
  const getDateRange = (booking: Booking) => {
    const checkIn = formatDate(new Date(booking.checkInDate));
    const checkOut = formatDate(new Date(booking.checkOutDate));
    return `${checkIn} - ${checkOut}`;
  };

  // Get room preference display name
  const getRoomTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      "single": "Single Room",
      "double": "Double Room",
      "deluxe": "Deluxe Room",
    };
    return types[type] || type;
  };

  // Define action buttons based on role and booking status
  const renderActions = (booking: Booking) => {
    const actions = [];

    // View button for all roles
    if (onView) {
      actions.push(
        <Button
          key="view"
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary-dark"
          onClick={() => onView(booking)}
        >
          <Eye size={16} className="mr-1" /> View
        </Button>
      );
    }

    // Admin-specific actions
    if (role === "admin" && booking.status === BookingStatus.PENDING) {
      if (onApprove) {
        actions.push(
          <Button
            key="approve"
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-800"
            onClick={() => onApprove(booking)}
          >
            <Check size={16} />
          </Button>
        );
      }
      
      if (onReject) {
        actions.push(
          <Button
            key="reject"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-800"
            onClick={() => onReject(booking)}
          >
            <X size={16} />
          </Button>
        );
      }
    }

    // VFast-specific actions
    if (role === "vfast" && booking.status === BookingStatus.APPROVED && onAllocate) {
      actions.push(
        <Button
          key="allocate"
          variant="default"
          size="sm"
          className="bg-primary text-white text-xs px-3 py-1"
          onClick={() => onAllocate(booking)}
        >
          Allocate
        </Button>
      );
    }

    return <div className="flex space-x-2">{actions}</div>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                No bookings found
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {role === "booking" ? `BK-${booking.id}` : `REQ-${booking.id}`}
                </TableCell>
                {(role === "admin" || role === "vfast") && (
                  <TableCell>{booking.userId}</TableCell> // In a real app, you'd fetch and display the user name
                )}
                <TableCell>{getDateRange(booking)}</TableCell>
                <TableCell>{getRoomTypeDisplay(booking.roomPreference)}</TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell>{renderActions(booking)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
