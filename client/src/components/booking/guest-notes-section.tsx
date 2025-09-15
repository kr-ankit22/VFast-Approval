import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GuestNotesCard from "@/components/booking/guest-notes-card";
import { Guest } from "@shared/schema";

interface GuestNotesSectionProps {
  bookingId: number;
}

export default function GuestNotesSection({ bookingId }: GuestNotesSectionProps) {
  const { data: guests, isLoading, isError } = useQuery<Guest[]>({
    queryKey: [`/api/bookings/${bookingId}/guests`],
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading guests for notes...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load guests for notes.</p>
      </div>
    );
  }

  if (!guests || guests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No guests found for this booking to add notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Guest Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {guests.map(guest => (
            <div key={guest.id} className="mb-4 last:mb-0">
              <h4 className="font-semibold text-lg mb-2">{guest.name}</h4>
              <GuestNotesCard guestId={guest.id} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}