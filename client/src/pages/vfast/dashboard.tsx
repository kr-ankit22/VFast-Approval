import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function VFastDashboard() {
  const { user, logoutMutation } = useAuth();
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">VFast Management Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name}</p>
        </div>
        <Button variant="destructive" onClick={() => logoutMutation.mutate()}>
          Logout
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Allocate rooms to approved booking requests</p>
            <Link href="/vfast/allocation">
              <Button>Allocate Rooms</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Reconsideration Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">View and manage reconsideration requests</p>
            <Link href="/vfast/reconsideration">
              <Button>Manage Reconsiderations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}