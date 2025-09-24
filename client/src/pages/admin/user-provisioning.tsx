import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, UploadCloud } from "lucide-react";

export default function UserProvisioningPage() {
  const [file, setFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (csvFile: File) => {
      const formData = new FormData();
      formData.append("file", csvFile);
      const res = await apiRequest("POST", "/api/admin/users/upload", formData);
      return res.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Created ${data.created} users, updated ${data.updated} users.`, 
      });
      setFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Provisioning</CardTitle>
          <CardDescription>Upload a CSV file to create or update user accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="csv-format">CSV Format</Label>
            <Input
              id="csv-format"
              value="email,role,name,phone,department"
              readOnly
              className="font-mono bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Roles: BOOKING, DEPARTMENT_APPROVER, ADMIN, VFAST. Department should be an ID.
            </p>
          </div>

          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <input {...getInputProps()} />
            {uploadMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : isDragActive ? (
              <p>Drop the CSV file here ...</p>
            ) : file ? (
              <p>File selected: {file.name}</p>
            ) : (
              <p className="text-muted-foreground flex flex-col items-center">
                <UploadCloud className="h-8 w-8 mb-2" />
                Drag 'n' drop a CSV file here, or click to select one
              </p>
            )}
          </div>

          {file && !uploadMutation.isPending && (
            <Button onClick={handleUpload} className="w-full">
              Upload CSV
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}