import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, UserPlus, CheckCircle, XCircle, Upload, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Guest, InsertGuest } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface GuestManagementCardProps {
  bookingId: number;
}

const addGuestFormSchema = z.object({
  name: z.string().min(2, "Guest name must be at least 2 characters."),
  contact: z.string().optional(),
  kycDocumentUrl: z.string().optional(),
});

export default function GuestManagementCard({ bookingId }: GuestManagementCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false);

  const { data: guests, isLoading, isError } = useQuery<Guest[]>({
    queryKey: [`/api/bookings/${bookingId}/guests`],
    refetchInterval: 5000,
  });

  const addGuestForm = useForm<z.infer<typeof addGuestFormSchema>>({
    resolver: zodResolver(addGuestFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      kycDocumentUrl: "",
    },
  });

  const addGuestMutation = useMutation({
    mutationFn: async (newGuest: InsertGuest) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/guests`, newGuest);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      toast({
        title: "Guest Added",
        description: "New guest has been successfully added.",
      });
      setIsAddGuestDialogOpen(false);
      addGuestForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add guest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: async ({ guestId, updates }: { guestId: number, updates: Partial<Guest> }) => {
      const res = await apiRequest("PATCH", `/api/guests/${guestId}`, updates);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      toast({
        title: "Guest Updated",
        description: "Guest details updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update guest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddGuest = (values: z.infer<typeof addGuestFormSchema>) => {
    addGuestMutation.mutate(values);
  };

  const handleVerifyKyc = (guest: Guest) => {
    updateGuestMutation.mutate({ guestId: guest.id, updates: { isVerified: true } });
  };

  const handleCheckIn = (guest: Guest) => {
    updateGuestMutation.mutate({ guestId: guest.id, updates: { checkedIn: true, checkInTime: new Date() } });
  };

  const handleCheckOut = (guest: Guest) => {
    updateGuestMutation.mutate({ guestId: guest.id, updates: { checkedIn: false, checkOutTime: new Date() } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Guests</CardTitle>
        <Button size="sm" onClick={() => setIsAddGuestDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Guest
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading guests...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load guests.</p>
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No guests added for this booking yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {guests.map((guest) => (
              <div key={guest.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold">{guest.name}</h4>
                <p className="text-sm">Status: {guest.checkedIn ? "Checked In" : "Not Checked In"}</p>
                <Button size="sm" onClick={() => handleCheckIn(guest)}>Check In</Button>
                <Button size="sm" onClick={() => handleCheckOut(guest)}>Check Out</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Guest Dialog */}
      <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
            <DialogDescription>
              Add details for a new guest associated with this booking.
            </DialogDescription>
          </DialogHeader>
          <Form {...addGuestForm}>
            <form onSubmit={addGuestForm.handleSubmit(handleAddGuest)} className="space-y-4">
              <FormField
                control={addGuestForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +1234567890 or email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="kycDocumentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KYC Document URL (Placeholder)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., https://example.com/kyc-doc.pdf" {...field} />
                    </FormControl>
                    <FormDescription>This is a placeholder for KYC document upload.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddGuestDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addGuestMutation.isPending}>
                  {addGuestMutation.isPending ? "Adding..." : "Add Guest"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}