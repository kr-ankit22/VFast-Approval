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
      const res = await apiRequest("POST", `/api/bookings/${booking.id}/resubmit`, { ...booking, status: BookingStatus.PENDING_DEPARTMENT_APPROVAL });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to resubmit booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-bookings"] });
      toast({
        title: "Booking Resubmitted",
        description: "Your booking has been resubmitted for approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resubmit booking.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? "Resubmitting..." : "Resubmit Booking"}
    </Button>
  );
}
