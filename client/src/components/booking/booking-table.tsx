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
    <Table className="w-full min-w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="whitespace-nowrap">Purpose</TableHead>
          <TableHead className="whitespace-nowrap">Check-in</TableHead>
          <TableHead className="whitespace-nowrap">Check-out</TableHead>
          <TableHead className="whitespace-nowrap">Status</TableHead>
          {showRequestType && <TableHead className="whitespace-nowrap">Request Type</TableHead>}
          {renderActions && <TableHead className="whitespace-nowrap">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="whitespace-nowrap">{booking.purpose}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
            <TableCell className="whitespace-nowrap">{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
            <TableCell className="whitespace-nowrap">
              <Badge>{booking.status}</Badge>
            </TableCell>
            {showRequestType && (
              <TableCell className="whitespace-nowrap">
                <Badge variant={booking.isReconsidered ? "secondary" : "default"}>
                  {booking.isReconsidered ? "Reconsidered" : "New"}
                </Badge>
              </TableCell>
            )}
            {renderActions && <TableCell className="whitespace-nowrap">{renderActions(booking)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}