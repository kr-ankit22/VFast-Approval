import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Booking, Room, RoomType, roomAllocationSchema, RoomStatus, WorkflowStage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, User, FileText, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import BookingJourney from "@/components/booking/booking-journey";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RoomAllocationFormProps {
  booking: Booking;
  onSuccess?: () => void;
}

type FormSchema = z.infer<typeof roomAllocationSchema>;

export default function RoomAllocationForm({ booking, onSuccess }: RoomAllocationFormProps) {
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: availableRooms, isLoading: isLoadingRooms, isError: isRoomsError } = useQuery<Room[]>({
    queryKey: ['/api/rooms/available'],
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(roomAllocationSchema),
    defaultValues: {
      bookingId: booking.id,
      roomNumber: "",
      notes: "",
    },
  });

  const allocateRoomMutation = useMutation({
    mutationFn: async (data: FormSchema) => {
      const url = `/api/bookings/${booking.id}/allocate`;
      console.log("[RoomAllocationForm] Sending PATCH request to URL:", url, "with data:", data);
      const res = await apiRequest(
        "PATCH",
        url,
        data
      );
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      // Also update the workflow stage of the specific booking
      await queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}`] });
      // Manually update the workflow stage in the backend
      await apiRequest("PATCH", `/api/bookings/${booking.id}/workflow-stage`, { stage: WorkflowStage.ALLOCATED });
      toast({
        title: "Room Allocated",
        description: `Room ${form.getValues().roomNumber} has been successfully allocated.`,
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to allocate room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoomSelection = (roomNumber: string) => {
    const room = availableRooms?.find(r => r.roomNumber === roomNumber) || null;
    setSelectedRoom(room);
    form.setValue("roomNumber", roomNumber);
  };

  function onSubmit(data: FormSchema) {
    console.log("[RoomAllocationForm] onSubmit triggered, data:", data);
    allocateRoomMutation.mutate(data);
  }

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Requestor:</p>
                  <p className="font-medium">{booking.userName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purpose:</p>
                  <p className="font-medium">{booking.purpose}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guests:</p>
                  <p className="font-medium">{booking.guestCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department:</p>
                  <p className="font-medium">{booking.departmentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in Date:</p>
                  <p className="font-medium">{formatDate(new Date(booking.checkInDate))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out Date:</p>
                  <p className="font-medium">{formatDate(new Date(booking.checkOutDate))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Rooms</FormLabel>
                <Select onValueChange={handleRoomSelection} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingRooms ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : isRoomsError ? (
                      <div className="p-2 text-red-500 text-sm">Failed to load rooms</div>
                    ) : availableRooms && availableRooms.length > 0 ? (
                      availableRooms.map((room) => (
                        <SelectItem key={room.roomNumber} value={room.roomNumber}>
                          {room.roomNumber} ({room.type}) - {room.status}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500 text-sm">No available rooms</div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedRoom && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle>Selected Room Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Type:</strong> {selectedRoom.type}</p>
                <p><strong>Floor:</strong> {selectedRoom.floor}</p>
                <p className="break-words"><strong>Features:</strong> {selectedRoom.features?.join(", ")}</p>
              </CardContent>
            </Card>
          )}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-1">
                  <FormLabel>Allocation Notes</FormLabel>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add any special instructions for check-in, room features, or other relevant details for the guest or VFast team.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Add any relevant notes..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
            <Button type="submit" disabled={allocateRoomMutation.isPending || !form.getValues().roomNumber}>
              {allocateRoomMutation.isPending ? "Allocating..." : "Assign Room"}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}
