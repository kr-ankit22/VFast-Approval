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
    <Table className="w-full min-w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Ticket Age</TableHead>
          <TableHead className="whitespace-nowrap">Booking ID</TableHead>
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
            <TableCell className="whitespace-nowrap">{formatDistanceToNow(new Date(booking.departmentApprovalAt), { addSuffix: true })}</TableCell>
            <TableCell className="whitespace-nowrap">{booking.id}</TableCell>
            <TableCell className="whitespace-nowrap">{booking.purpose}</TableCell>
            <TableCell className="whitespace-nowrap">{booking.departmentName}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
            {renderActions && <TableCell className="whitespace-nowrap">{renderActions(booking)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
