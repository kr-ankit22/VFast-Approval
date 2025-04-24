import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus, RoomType, type Booking, type Room } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  BookCheck, 
  Calendar, 
  Loader2, 
  HotelIcon, 
  Bed, 
  Building,
  Users, 
  ArrowUpRight,
  ClipboardList,
  Home,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function VFastDashboard() {
  const { user } = useAuth();
  
  // Get approved bookings that need room allocation
  const { data: approvedBookings = [], isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/approved"]
  });
  
  // Get reconsideration requests
  const { data: reconsiderationRequests = [], isLoading: isLoadingRequests } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/reconsideration"]
  });
  
  // Get rooms availability by type
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"]
  });

  // Calculate allocation statistics
  const pendingAllocation = approvedBookings.filter(b => b.status === BookingStatus.APPROVED).length;
  const allocatedRooms = approvedBookings.filter(b => b.status === BookingStatus.ALLOCATED).length;
  const totalRequests = pendingAllocation + allocatedRooms;
  const allocationPercentage = totalRequests > 0 ? Math.round((allocatedRooms / totalRequests) * 100) : 0;
  
  // Room statistics by type
  const singleRooms = rooms.filter(r => r.type === RoomType.SINGLE);
  const doubleRooms = rooms.filter(r => r.type === RoomType.DOUBLE);
  const deluxeRooms = rooms.filter(r => r.type === RoomType.DELUXE);
  
  const availableSingleRooms = singleRooms.filter(r => r.isAvailable).length;
  const availableDoubleRooms = doubleRooms.filter(r => r.isAvailable).length;
  const availableDeluxeRooms = deluxeRooms.filter(r => r.isAvailable).length;
  
  const roomTypeStats = [
    { 
      type: "Single Rooms", 
      total: singleRooms.length,
      available: availableSingleRooms,
      icon: <Bed className="h-4 w-4 text-blue-500" />,
      color: "bg-blue-100" 
    },
    { 
      type: "Double Rooms", 
      total: doubleRooms.length,
      available: availableDoubleRooms,
      icon: <Building className="h-4 w-4 text-amber-500" />,
      color: "bg-amber-100"
    },
    { 
      type: "Deluxe Rooms", 
      total: deluxeRooms.length,
      available: availableDeluxeRooms,
      icon: <Home className="h-4 w-4 text-purple-500" />,
      color: "bg-purple-100"
    }
  ];
  
  return (
    <DashboardLayout 
      title="VFast Management Dashboard" 
      description={`Welcome back, ${user?.name}. Here's an overview of current room allocations.`}
      role={UserRole.VFAST}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Allocation</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingAllocation}</div>
            <p className="text-xs text-muted-foreground">Approved bookings needing rooms</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocatedRooms}</div>
            <p className="text-xs text-muted-foreground">Successfully allocated bookings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocation Progress</CardTitle>
            <BookCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocationPercentage}%</div>
            <Progress value={allocationPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Of approved requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconsideration Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reconsiderationRequests.length}</div>
            <p className="text-xs text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Room availability stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {roomTypeStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${stat.color} rounded-t-lg`}>
              <CardTitle className="text-sm font-medium">{stat.type}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stat.available} / {stat.total}</div>
                  <p className="text-xs text-muted-foreground">Available rooms</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {stat.total > 0 ? Math.round((stat.available / stat.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Room Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Allocate rooms to approved booking requests</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Select Room Type:</span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Link href="/vfast/allocation">
                <Button className="w-full flex items-center justify-center gap-2">
                  <HotelIcon className="h-4 w-4" />
                  Allocate Rooms
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reconsideration Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Review and respond to reconsideration requests from guests</p>
            
            {isLoadingRequests ? (
              <div className="py-4 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : reconsiderationRequests.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-muted-foreground text-sm">No reconsideration requests</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {reconsiderationRequests.slice(0, 2).map((req, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{req.purpose}</h4>
                        <p className="text-xs text-muted-foreground">{req.referringDepartment}</p>
                      </div>
                      <Badge>Reconsideration</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Link href="/vfast/reconsideration">
              <Button className="w-full flex items-center justify-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Manage Reconsiderations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent pending allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Allocations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : approvedBookings.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No bookings pending allocation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Purpose</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Check-in</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Guests</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-xs uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {approvedBookings.slice(0, 5).map((booking, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4">{booking.id}</td>
                      <td className="py-3 px-4">{booking.purpose}</td>
                      <td className="py-3 px-4">{booking.referringDepartment}</td>
                      <td className="py-3 px-4">{formatDate(new Date(booking.checkInDate))}</td>
                      <td className="py-3 px-4">{booking.guestCount}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="border-amber-500 text-amber-500">
                          {booking.status === BookingStatus.APPROVED ? 'Needs Allocation' : 'Allocated'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 text-right">
            <Link href="/vfast/allocation">
              <Button variant="outline" size="sm">View All Pending Allocations</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}