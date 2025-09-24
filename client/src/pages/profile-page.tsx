import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { User, UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

async function fetchUserProfile(): Promise<User> {
  const res = await apiRequest("GET", "/api/users/me");
  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return res.json();
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const { data: user, isLoading, isError } = useQuery<User>({ 
    queryKey: ["user-profile"], 
    queryFn: fetchUserProfile 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setMobileNumber(user.mobileNumber || "");
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (newMobileNumber: string) => {
      return apiRequest("PATCH", "/api/users/me", { mobileNumber: newMobileNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Success",
        description: "Your mobile number has been updated.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your mobile number.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    mutation.mutate(mobileNumber);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading profile</div>;
  }

  return (
    <DashboardLayout title="Profile" description="View and edit your profile." role={authUser?.role as UserRole || UserRole.BOOKING}>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              <div>
                <Label>Role</Label>
                <p className="text-lg font-semibold">{user.role}</p>
              </div>
              <div>
                <Label>Mobile Number</Label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-semibold">{user.mobileNumber || "Not set"}</p>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
