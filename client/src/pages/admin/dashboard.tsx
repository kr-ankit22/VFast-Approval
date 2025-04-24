import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  BookCheck, 
  Clock, 
  Loader2, 
  HotelIcon, 
  CheckCircle, 
  XCircle,
  Users, 
  ArrowUpRight
} from "lucide-react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Get all bookings
  const { data: allBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/bookings"]
  });
  
  // Get all rooms
  const { data: allRooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ["/api/rooms"]
  });

  // Calculate statistics 
  const pendingRequests = allBookings.filter(b => b.status === BookingStatus.PENDING).length;
  const approvedRequests = allBookings.filter(b => b.status === BookingStatus.APPROVED).length;
  const allocatedRooms = allBookings.filter(b => b.status === BookingStatus.ALLOCATED).length;
  const availableRooms = allRooms.filter(r => r.isAvailable).length;
  const totalRooms = allRooms.length;

  // Function to render the status badge with appropriate color
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING:
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case BookingStatus.APPROVED:
        return <Badge variant="outline" className="border-green-500 text-green-500">Approved</Badge>;
      case BookingStatus.REJECTED:
        return <Badge variant="outline" className="border-red-500 text-red-500">Rejected</Badge>;
      case BookingStatus.ALLOCATED:
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Allocated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <DashboardLayout 
      title="Admin Dashboard" 
      description={`Welcome back, ${user?.name}. Here's an overview of the hostel bookings.`}
      role={UserRole.ADMIN}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests}</div>
            <p className="text-xs text-muted-foreground">Ready for allocation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Rooms</CardTitle>
            <BookCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocatedRooms}</div>
            <p className="text-xs text-muted-foreground">Successfully allocated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Rooms</CardTitle>
            <HotelIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableRooms} / {totalRooms}</div>
            <p className="text-xs text-muted-foreground">Ready for allocation</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Requests</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">View and manage pending booking requests</p>
                <Link href="/admin/requests">
                  <Button className="flex items-center gap-2">
                    <BookCheck className="h-4 w-4" /> 
                    Manage Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Room Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">View and manage hostel rooms</p>
                <Link href="/admin/rooms">
                  <Button className="flex items-center gap-2">
                    <HotelIcon className="h-4 w-4" />
                    Manage Rooms
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Booking Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No booking requests yet</p>
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
                        <th className="text-left py-3 px-4 font-medium text-xs uppercase">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-xs uppercase"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="py-3 px-4">{booking.id}</td>
                          <td className="py-3 px-4">{booking.purpose}</td>
                          <td className="py-3 px-4">{booking.referringDepartment}</td>
                          <td className="py-3 px-4">{formatDate(new Date(booking.checkInDate))}</td>
                          <td className="py-3 px-4">{renderStatusBadge(booking.status)}</td>
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
                <Link href="/admin/requests">
                  <Button variant="outline" size="sm">View All Requests</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">You have {pendingRequests} pending booking requests that need your approval</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Approve All
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Reject All
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Manage system users and their permissions</p>
                <Button className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Users
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Recent Rooms */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRooms ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : allRooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rooms available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {allRooms.slice(0, 10).map((room) => (
                  <div 
                    key={room.id} 
                    className={`p-4 rounded-lg border flex flex-col items-center ${
                      room.isAvailable 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <HotelIcon className={`h-6 w-6 mb-2 ${
                      room.isAvailable ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <div className="text-lg font-semibold">{room.roomNumber}</div>
                    <div className="text-sm text-muted-foreground capitalize">{room.type}</div>
                    <Badge 
                      variant="outline" 
                      className={`mt-2 ${
                        room.isAvailable 
                          ? 'border-green-500 text-green-500' 
                          : 'border-red-500 text-red-500'
                      }`}
                    >
                      {room.isAvailable ? 'Available' : 'Occupied'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-right">
              <Link href="/admin/rooms">
                <Button variant="outline" size="sm">View All Rooms</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}