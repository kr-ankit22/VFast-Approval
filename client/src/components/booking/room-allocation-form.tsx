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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, User, FileText, HelpCircle, X } from "lucide-react";
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
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);

  const { data: availableRooms, isLoading: isLoadingRooms, isError: isRoomsError } = useQuery<Room[]>({
    queryKey: ['/api/rooms/available'],
  });

  const form = useForm<FormSchema>({
    resolver: zodResolver(roomAllocationSchema),
    defaultValues: {
      bookingId: booking.id,
      roomIds: [],
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
        { roomIds: data.roomIds, notes: data.notes }
      );
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      // Also update the workflow stage of the specific booking
      await queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}`] });
      toast({
        title: "Rooms Allocated",
        description: `The selected rooms have been successfully allocated.`,
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

  const handleRoomSelection = (roomId: number) => {
    const currentRoomIds = form.getValues("roomIds") || [];
    const newRoomIds = currentRoomIds.includes(roomId)
      ? currentRoomIds.filter(id => id !== roomId)
      : [...currentRoomIds, roomId];
    form.setValue("roomIds", newRoomIds);

    const rooms = availableRooms?.filter(r => newRoomIds.includes(r.id)) || [];
    setSelectedRooms(rooms);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <FormLabel>Available Rooms</FormLabel>
                <span className="text-sm text-muted-foreground">
                  Selected {selectedRooms.length} of {booking.numberOfRooms}
                </span>
              </div>
              <div className="h-72 overflow-y-auto border rounded-md p-2 space-y-2">
                {isLoadingRooms ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : isRoomsError ? (
                  <div className="p-2 text-red-500 text-sm">Failed to load rooms</div>
                ) : availableRooms && availableRooms.length > 0 ? (
                  availableRooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.getValues("roomIds")?.includes(room.id)}
                          onChange={() => handleRoomSelection(room.id)}
                          className="h-4 w-4"
                        />
                        <div>
                          <span className="font-medium">{room.roomNumber}</span>
                          <span className="text-xs text-muted-foreground ml-2">({room.type})</span>
                        </div>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 text-sm">No available rooms</div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <FormLabel>Selected Rooms</FormLabel>
                <div className="h-32 overflow-y-auto border rounded-md p-2 mt-2 flex flex-wrap gap-2">
                  {selectedRooms.length > 0 ? (
                    selectedRooms.map(room => (
                      <Badge key={room.id} variant="secondary" className="flex items-center gap-2">
                        <span>{room.roomNumber}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleRoomSelection(room.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No rooms selected</p>
                  )}
                </div>
              </div>
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
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
            <Button type="submit" disabled={allocateRoomMutation.isPending || (form.getValues().roomIds || []).length === 0}>
              {allocateRoomMutation.isPending ? "Allocating..." : "Assign Rooms"}
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}
