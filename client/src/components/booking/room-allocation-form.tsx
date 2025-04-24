import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Booking, Room, RoomType, roomAllocationSchema } from "@shared/schema";
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
import { Loader2 } from "lucide-react";

interface RoomAllocationFormProps {
  booking: Booking;
  onSuccess?: () => void;
}

type FormSchema = z.infer<typeof roomAllocationSchema>;

export default function RoomAllocationForm({ booking, onSuccess }: RoomAllocationFormProps) {
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Fetch all available rooms - we no longer filter by room preference
  const {
    data: availableRooms,
    isLoading: isLoadingRooms,
    isError: isRoomsError,
  } = useQuery<Room[]>({
    queryKey: ['/api/rooms/available'],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string);
      if (!res.ok) throw new Error("Failed to fetch available rooms");
      return res.json();
    },
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
      const res = await apiRequest(
        "PATCH",
        `/api/bookings/${booking.id}/allocate`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      // Aggressively invalidate all queries to ensure fresh state
      queryClient.invalidateQueries();
      
      toast({
        title: "Room Allocated",
        description: `Room ${form.getValues().roomNumber} has been successfully allocated to booking #${booking.id}.`,
        variant: "default",
      });
      
      // Use a short delay to ensure UI has time to update
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to allocate room",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle room selection
  const handleRoomSelection = (roomNumber: string) => {
    const selectedRoom = availableRooms?.find(room => room.roomNumber === roomNumber) || null;
    setSelectedRoom(selectedRoom);
    form.setValue("roomNumber", roomNumber);
  };

  function onSubmit(data: FormSchema) {
    allocateRoomMutation.mutate(data);
  }

  // Get room type display name
  const getRoomTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      [RoomType.SINGLE]: "Single Room",
      [RoomType.DOUBLE]: "Double Room",
      [RoomType.DELUXE]: "Deluxe Room",
    };
    return types[type] || type;
  };

  // Get floor display
  const getFloorDisplay = (floor: number) => {
    if (floor === 1) return "Ground Floor";
    if (floor === 2) return "First Floor";
    if (floor === 3) return "Second Floor";
    return `Floor ${floor}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bookingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking ID</FormLabel>
                <FormControl>
                  <div className="h-10 px-3 py-2 rounded-md border border-gray-300 bg-gray-100 flex items-center">
                    {booking.id}
                  </div>
                </FormControl>
                <FormDescription>
                  Cannot be changed
                </FormDescription>
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel>Referring Department</FormLabel>
            <div className="h-10 px-3 py-2 rounded-md border border-gray-300 bg-gray-100 flex items-center">
              {booking.referringDepartment}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Department that made this request
            </p>
          </div>

          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Number</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleRoomSelection(value);
                  }}
                  value={field.value}
                >
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
                          {room.roomNumber} ({getRoomTypeDisplay(room.type)})
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
        </div>

        {selectedRoom && (
          <Card className="border-dashed border-primary border-2">
            <CardHeader className="pb-2">
              <CardTitle>Room Details</CardTitle>
              <CardDescription>
                Information about the selected room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Room Number</p>
                  <p className="text-lg">{selectedRoom.roomNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-lg">{getRoomTypeDisplay(selectedRoom.type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Floor</p>
                  <p className="text-lg">{getFloorDisplay(selectedRoom.floor)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Features</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRoom.features && Array.isArray(selectedRoom.features) ? (
                      selectedRoom.features.map((feature, index) => (
                        <span key={index} className="text-xs bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No features listed</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocation Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any relevant notes about this room allocation..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes about special arrangements or instructions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={allocateRoomMutation.isPending || !form.getValues().roomNumber}
          >
            {allocateRoomMutation.isPending ? "Allocating..." : "Assign Room"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
