import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Room, RoomType } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  X, 
  Filter, 
  Plus, 
  Wifi, 
  Tv, 
  Wind, 
  RefrigeratorIcon 
} from "lucide-react";
import { UserRole } from "@shared/schema";

export default function RoomManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fetch all rooms
  const {
    data: rooms,
    isLoading,
    isError,
    error,
  } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

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
    
    return filtered;
  };

  const filteredRooms = getFilteredRooms();

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
    <DashboardLayout
      title="Room Management"
      description="View and manage all rooms in the VFast hostel"
      role={UserRole.ADMIN}
    >
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
              <Button>
                <Plus size={16} className="mr-2" /> Add Room
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Rooms</TabsTrigger>
              <TabsTrigger value={RoomType.SINGLE}>Single</TabsTrigger>
              <TabsTrigger value={RoomType.DOUBLE}>Double</TabsTrigger>
              <TabsTrigger value={RoomType.DELUXE}>Deluxe</TabsTrigger>
            </TabsList>
          </Tabs>

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
            <div className="rounded-md border">
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
                      <TableCell>{getRoomTypeDisplay(room.type)}</TableCell>
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
                        {room.isAvailable ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Occupied</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={room.isAvailable ? "text-red-600" : "text-green-600"}
                          >
                            {room.isAvailable ? "Mark Occupied" : "Mark Available"}
                          </Button>
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
    </DashboardLayout>
  );
}
