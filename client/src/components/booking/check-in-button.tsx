import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CheckInButtonProps {
  guestId: number;
  bookingId: number;
}

export default function CheckInButton({ guestId, bookingId }: CheckInButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/guests/${guestId}/check-in`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to check-in guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      toast({
        title: "Guest Checked In",
        description: "The guest has been successfully checked in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check-in guest.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button 
      size="sm" 
      onClick={() => checkInMutation.mutate()}
      disabled={checkInMutation.isPending}
    >
      {checkInMutation.isPending ? "Checking In..." : "Check In"}
    </Button>
  );
}
