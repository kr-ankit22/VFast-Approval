import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Booking, BookingStatus } from "@shared/schema";

type ReconsiderationButtonProps = {
  booking: Booking;
};

export default function ReconsiderationButton({ booking }: ReconsiderationButtonProps) {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/bookings/${booking.id}/status`, { status: BookingStatus.PENDING_RECONSIDERATION });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to request reconsideration");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-bookings"] });
      toast({
        title: "Reconsideration Requested",
        description: "Your request for reconsideration has been submitted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? "Submitting..." : "Request Reconsideration"}
    </Button>
  );
}
