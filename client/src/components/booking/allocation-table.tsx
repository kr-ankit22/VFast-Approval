import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Booking, BookingType } from "@shared/schema";
import { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";

type AllocationTableProps = {
  bookings: any[];
  renderActions?: (booking: any) => ReactNode;
};

export default function AllocationTable({ bookings, renderActions }: AllocationTableProps) {
  const renderBookingTypeBadge = (type: string) => {
    return type === BookingType.PERSONAL ? (
      <Badge variant="outline" className="border-purple-500 text-purple-500 bg-purple-50">Personal</Badge>
    ) : (
      <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-50">Official</Badge>
    );
  };

  return (
    <Table className="w-full min-w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Ticket Age</TableHead>
          <TableHead className="whitespace-nowrap">Booking ID</TableHead>
          <TableHead className="whitespace-nowrap">Type</TableHead>
          <TableHead className="whitespace-nowrap">Purpose</TableHead>
          <TableHead className="whitespace-nowrap">Department</TableHead>
          <TableHead className="whitespace-nowrap">Check-in</TableHead>
          <TableHead className="whitespace-nowrap">Check-out</TableHead>
          {renderActions && <TableHead className="whitespace-nowrap">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="whitespace-nowrap">
              {booking.departmentApprovalAt 
                ? formatDistanceToNow(new Date(booking.departmentApprovalAt), { addSuffix: true })
                : booking.createdAt 
                  ? formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })
                  : "N/A"
              }
            </TableCell>
            <TableCell className="whitespace-nowrap">{booking.id}</TableCell>
            <TableCell className="whitespace-nowrap">{renderBookingTypeBadge(booking.bookingType)}</TableCell>
            <TableCell className="whitespace-nowrap">{booking.purpose}</TableCell>
            <TableCell className="whitespace-nowrap">{booking.departmentName || "-"}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
            {renderActions && <TableCell className="whitespace-nowrap">{renderActions(booking)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
