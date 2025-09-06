import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@shared/schema";
import { ReactNode } from "react";

type BookingTableProps = {
  bookings: Booking[];
  renderActions?: (booking: Booking) => ReactNode;
  showRequestType?: boolean;
};

export default function BookingTable({ bookings, renderActions, showRequestType }: BookingTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest Name</TableHead>
          <TableHead>Check-in</TableHead>
          <TableHead>Check-out</TableHead>
          <TableHead>Status</TableHead>
          {showRequestType && <TableHead>Request Type</TableHead>}
          {renderActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell>{booking.purpose}</TableCell>
            <TableCell>{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge>{booking.status}</Badge>
            </TableCell>
            {showRequestType && (
              <TableCell>
                <Badge variant={booking.isReconsidered ? "secondary" : "default"}>
                  {booking.isReconsidered ? "Reconsidered" : "New"}
                </Badge>
              </TableCell>
            )}
            {renderActions && <TableCell>{renderActions(booking)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}