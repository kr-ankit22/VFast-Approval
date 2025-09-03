import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole, BookingStatus, type Booking, type Room } from "@shared/schema";
import { useDepartmentApprovals } from "@/hooks/use-bookings";
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

export default function DepartmentApproverDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: bookings = [], isLoading: isLoadingBookings } = useDepartmentApprovals();
  

  const pendingRequests = bookings.filter(b => b.status === BookingStatus.PENDING_DEPARTMENT_APPROVAL).length;
  const approvedRequests = bookings.filter(b => b.status === BookingStatus.PENDING_ADMIN_APPROVAL).length;
  const allocatedRooms = bookings.filter(b => b.status === BookingStatus.ALLOCATED).length;
  

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING_DEPARTMENT_APPROVAL:
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending Department Approval</Badge>;
      case BookingStatus.PENDING_ADMIN_APPROVAL:
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Pending Admin Approval</Badge>;
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
      title="Department Approver Dashboard" 
      description={`Welcome back, ${user?.name}. Here's an overview of the hostel bookings for your department.`}
      role={UserRole.DEPARTMENT_APPROVER}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests}</div>
            <p className="text-xs text-muted-foreground">Sent for admin approval</p>
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
        
      </div>
      
      {/* Tabs for content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">View and manage pending booking requests</p>
                <Link href="/department/requests">
                  <Button className="flex items-center gap-2">
                    <BookCheck className="h-4 w-4" /> 
                    Manage Requests
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
              ) : bookings.length === 0 ? (
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
                        <th className="text-left py-3 px-4 font-medium text-xs uppercase">Check-in</th>
                        <th className="text-left py-3 px-4 font-medium text-xs uppercase">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-xs uppercase"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="py-3 px-4">{booking.id}</td>
                          <td className="py-3 px-4">{booking.purpose}</td>
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
                <Link href="/department/requests">
                  <Button variant="outline" size="sm">View All Requests</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

