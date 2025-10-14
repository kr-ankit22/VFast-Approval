import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Mail, Briefcase, Phone, Pencil, Calendar, CheckSquare, Settings, Rocket } from "lucide-react";
import { Separator } from "@/components/ui/separator";

async function fetchUserProfile(): Promise<User> {
  const res = await apiRequest("GET", "/api/users/me");
  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return res.json();
}

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileNumberError, setMobileNumberError] = useState("");
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
    if (!/^\d{10}$/.test(mobileNumber)) {
      setMobileNumberError("Mobile number must be 10 digits.");
      return;
    }
    mutation.mutate(mobileNumber);
  };

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMobileNumberError("");
    setMobileNumber(e.target.value);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading profile</div>;
  }

  const roleIcons: { [key in UserRole]: React.ReactNode } = {
    [UserRole.BOOKING]: <Calendar className="w-20 h-20 text-primary" />,
    [UserRole.DEPARTMENT_APPROVER]: <CheckSquare className="w-20 h-20 text-primary" />,
    [UserRole.ADMIN]: <Settings className="w-20 h-20 text-primary" />,
    [UserRole.VFAST]: <Rocket className="w-20 h-20 text-primary" />,
  };

  const ProfileField = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="flex-grow">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex items-center gap-4">
            {user && roleIcons[user.role]}
            <div>
              <CardTitle className="text-2xl font-bold text-primary">{user?.name}</CardTitle>
              <CardDescription className="text-md text-muted-foreground">{user?.role}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField icon={<UserIcon size={20} />} label="Name" value={user?.name ?? ''} />
            <ProfileField icon={<Mail size={20} />} label="Email" value={user?.email ?? ''} />
            <ProfileField icon={<Briefcase size={20} />} label="Role" value={user?.role ?? ''} />
            <div className="md:col-span-2">
              <Separator />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <ProfileField icon={<Phone size={20} />} label="Mobile Number" value={isEditing ? '' : user?.mobileNumber || "Not set"} />
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil size={16} className="mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditing && (
                <div className="mt-2 space-y-2 pl-10">
                  <div className="flex items-center gap-2">
                    <Input
                      type="tel"
                      value={mobileNumber}
                      onChange={handleMobileNumberChange}
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="max-w-xs"
                      placeholder="Enter 10-digit number"
                    />
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                      {mutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                  {mobileNumberError && <p className="text-sm text-destructive">{mobileNumberError}</p>}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
