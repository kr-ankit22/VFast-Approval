import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function BookingUserDashboard() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name}</p>
        </div>
        <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create a new hostel booking request</p>
            <Link href="/booking/create">
              <Button>Create Booking</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View your previous booking requests</p>
            <Link href="/booking/history">
              <Button>View History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}