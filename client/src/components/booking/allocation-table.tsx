import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@shared/schema";
import { ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";

type AllocationTableProps = {
  bookings: any[];
  renderActions?: (booking: any) => ReactNode;
};

export default function AllocationTable({ bookings, renderActions }: AllocationTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket Age</TableHead>
          <TableHead>Booking ID</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>Check-out</TableHead>
          {renderActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{formatDistanceToNow(new Date(booking.departmentApprovalAt), { addSuffix: true })}</TableCell>
            <TableCell>{booking.id}</TableCell>
            <TableCell>{booking.purpose}</TableCell>
            <TableCell>{booking.departmentName}</TableCell>
            <TableCell>{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
            {renderActions && <TableCell>{renderActions(booking)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
