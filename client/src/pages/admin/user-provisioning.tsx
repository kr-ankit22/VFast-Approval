import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function UserProvisioningPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiRequest("POST", "/api/admin/users/upload", formData);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload file");
      }

      const result = await res.json();
      toast({
        title: "Upload successful",
        description: `${result.created} users created, ${result.updated} users updated.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout title="User Provisioning" description="Upload a CSV file to provision users." role={UserRole.ADMIN}>
      <Card>
        <CardHeader>
          <CardTitle>Upload User CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p>Upload a CSV file with the following columns: `email` and `role`.</p>
              <p>The `role` can be one of: `booking`, `department_approver`, `admin`, `vfast`.</p>
            </div>
            <div className="flex items-center space-x-2">
              <Input type="file" accept=".csv" onChange={handleFileChange} />
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
