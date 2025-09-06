import { Button } from "@/components/ui/button";
import { Booking } from "@shared/schema";
import { Link } from "wouter";

type ReconsiderationButtonProps = {
  booking: Booking;
};

export default function ReconsiderationButton({ booking }: ReconsiderationButtonProps) {
  return (
    <Button asChild size="sm">
      <Link href={`/booking/reconsider/${booking.id}`}>
        Resubmit Booking
      </Link>
    </Button>
  );
}
