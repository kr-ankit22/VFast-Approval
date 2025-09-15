import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CheckOutButtonProps {
  guestId: number;
  bookingId: number;
}

export default function CheckOutButton({ guestId, bookingId }: CheckOutButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/guests/${guestId}/check-out`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to check-out guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      toast({
        title: "Guest Checked Out",
        description: "The guest has been successfully checked out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check-out guest.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={() => checkOutMutation.mutate()}
      disabled={checkOutMutation.isPending}
    >
      {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
    </Button>
  );
}
