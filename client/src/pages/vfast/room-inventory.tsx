import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useGetRooms } from "@/hooks/use-bookings";
import { Room, RoomStatus, RoomMaintenanceStatus } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Search,
  X,
  Filter,
  Wifi,
  Tv,
  Wind,
  RefrigeratorIcon,
  CalendarDays
} from "lucide-react";
import { UserRole } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const maintenanceFormSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(500, "Reason cannot exceed 500 characters."),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date().optional(),
});

export default function VFastRoomInventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [selectedRoomForMaintenance, setSelectedRoomForMaintenance] = useState<Room | null>(null);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [reservationNotes, setReservationNotes] = useState("");

  const { data: rooms, isLoading, isError, error } = useGetRooms();

  const { data: activeMaintenance, isLoading: isLoadingMaintenance } = useQuery<any[]>({
    queryKey: ["/api/rooms/maintenance/active"],
    refetchInterval: 5000,
  });

  const updateRoomStatusMutation = useMutation({
    mutationFn: async (data: { id: number; status: RoomStatus; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/rooms/${data.id}/status`, { status: data.status, notes: data.notes });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Room status updated",
        description: "The room status has been successfully updated.",
        variant: "default",
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update room status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof maintenanceFormSchema> & { roomId: number }) => {
      const res = await apiRequest("POST", `/api/rooms/${data.roomId}/maintenance`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create maintenance entry");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/maintenance/active"] });
      toast({
        title: "Maintenance Scheduled",
        description: "Room successfully marked for maintenance.",
      });
      setIsMaintenanceDialogOpen(false);
      setSelectedRoomForMaintenance(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule maintenance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceId: number) => {
      const res = await apiRequest("PATCH", `/api/room-maintenance/${maintenanceId}/status`, { status: RoomMaintenanceStatus.COMPLETED });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to complete maintenance");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms/maintenance/active"] });
      toast({
        title: "Maintenance Completed",
        description: "Room maintenance marked as complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete maintenance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMarkAsReserved = (room: Room) => {
    setSelectedRoom(room);
    setIsReserveDialogOpen(true);
  };

  const handleConfirmReserve = () => {
    if (selectedRoom) {
      updateRoomStatusMutation.mutate({ id: selectedRoom.id, status: RoomStatus.RESERVED, notes: reservationNotes });
      setIsReserveDialogOpen(false);
      setReservationNotes("");
      setSelectedRoom(null);
    }
  };

  const handleMarkForMaintenance = (room: Room) => {
    setSelectedRoomForMaintenance(room);
    setIsMaintenanceDialogOpen(true);
  };

  const handleCompleteMaintenance = (maintenanceId: number) => {
    completeMaintenanceMutation.mutate(maintenanceId);
  };

  // Filter rooms based on active tab and search term
  const getFilteredRooms = () => {
    if (!rooms) return [];
    
    let filtered = rooms;
    
    // Filter by room type
    if (activeTab !== "all") {
      filtered = filtered.filter(room => room.type === activeTab);
    }
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(room => 
        room.roomNumber.toLowerCase().includes(searchLower) ||
        room.floor.toString().includes(searchLower)
      );
    }

    // Attach maintenance status
    return filtered.map(room => ({
      ...room,
      isUnderMaintenance: activeMaintenance?.some(m => m.roomId === room.id && m.status === RoomMaintenanceStatus.IN_PROGRESS) || false,
      maintenanceId: activeMaintenance?.find(m => m.roomId === room.id && m.status === RoomMaintenanceStatus.IN_PROGRESS)?.id || null,
    }));
  };

  const filteredRooms = getFilteredRooms();

  const maintenanceForm = useForm<z.infer<typeof maintenanceFormSchema>>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      reason: "",
      startDate: new Date(),
      endDate: undefined,
    },
  });

  const onSubmitMaintenance = (values: z.infer<typeof maintenanceFormSchema>) => {
    if (selectedRoomForMaintenance) {
      createMaintenanceMutation.mutate({ ...values, roomId: selectedRoomForMaintenance.id });
    }
  };

  // Get floor display
  const getFloorDisplay = (floor: number) => {
    if (floor === 1) return "Ground Floor";
    if (floor === 2) return "First Floor";
    if (floor === 3) return "Second Floor";
    return `Floor ${floor}`;
  };

  // Render feature icon
  const renderFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "wi-fi":
      case "wifi":
        return <Wifi size={16} className="text-blue-500" />;
      case "tv":
      case "television":
        return <Tv size={16} className="text-purple-500" />;
      case "ac":
      case "air conditioning":
        return <Wind size={16} className="text-green-500" />;
      case "mini-fridge":
      case "fridge":
        return <RefrigeratorIcon size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Rooms Inventory</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  className="pl-8"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading rooms data...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <X className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load rooms: {error?.message}</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No rooms found matching your criteria.</p>
              {searchTerm && (
                <p className="mt-2">
                  Try a different search term or clear the search.
                  <Button 
                    variant="link" 
                    className="ml-1 p-0" 
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.roomNumber}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>{getFloorDisplay(room.floor)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {room.features && Array.isArray(room.features) && room.features.map((feature, idx) => (
                            <div 
                              key={idx} 
                              className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs"
                              title={feature}
                            >
                              {renderFeatureIcon(feature)}
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {room.isUnderMaintenance ? (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Under Maintenance</Badge>
                        ) : room.status === RoomStatus.AVAILABLE ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
                        ) : room.status === RoomStatus.OCCUPIED ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Occupied</Badge>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Reserved</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reserved by: {room.reservedByName || 'N/A'}</p>
                              <p>Reserved at: {room.reservedAt ? new Date(room.reservedAt).toLocaleString() : 'N/A'}</p>
                              <p>Notes: {room.reservationNotes || 'N/A'}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {room.isUnderMaintenance ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => room.maintenanceId && handleCompleteMaintenance(room.maintenanceId)}
                              disabled={completeMaintenanceMutation.isPending}
                            >
                              {completeMaintenanceMutation.isPending ? "Completing..." : "Complete Maintenance"}
                            </Button>
                          ) : (
                            <>
                              {room.status === RoomStatus.RESERVED ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateRoomStatusMutation.mutate({ id: room.id, status: RoomStatus.AVAILABLE })}
                                >
                                  Mark as Available
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleMarkAsReserved(room)}
                                  disabled={room.status === RoomStatus.OCCUPIED}
                                >
                                  Mark as Reserved
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleMarkForMaintenance(room)}
                                disabled={room.status !== RoomStatus.AVAILABLE}
                              >
                                Mark for Maintenance
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex justify-between items-center text-sm">
            <div className="text-gray-500">
              {filteredRooms.length > 0 && `Showing ${filteredRooms.length} ${activeTab !== "all" ? activeTab : ""} rooms`}
            </div>
            {/* Pagination can be added here if needed */}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Dialog */}
      {selectedRoomForMaintenance && (
        <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>Mark Room {selectedRoomForMaintenance.roomNumber} for Maintenance</DialogTitle>
              <DialogDescription>
                Specify the reason and duration for the maintenance.
              </DialogDescription>
            </DialogHeader>
            <Form {...maintenanceForm}>
              <form onSubmit={maintenanceForm.handleSubmit(onSubmitMaintenance)} className="space-y-4">
                <FormField
                  control={maintenanceForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Maintenance</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Plumbing issue, deep cleaning, broken AC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={maintenanceForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() && date.toDateString() !== new Date().toDateString()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={maintenanceForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() && date.toDateString() !== new Date().toDateString()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsMaintenanceDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMaintenanceMutation.isPending}>
                    {createMaintenanceMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      <AlertDialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reserve Room {selectedRoom?.roomNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for reserving this room. This will be visible to other admins and vfast users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter reservation notes..."
            value={reservationNotes}
            onChange={(e) => setReservationNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReserve}>Reserve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
    </TooltipProvider>
  );
}
