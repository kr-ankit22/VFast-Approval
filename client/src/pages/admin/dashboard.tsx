import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name}</p>
        </div>
        <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and manage pending booking requests</p>
            <Link href="/admin/requests">
              <Button>Manage Requests</Button>
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
              <Button>Manage Rooms</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}