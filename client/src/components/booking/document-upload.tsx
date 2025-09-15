import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, File, Download } from "lucide-react";

interface DocumentUploadProps {
  bookingId: number;
}

export default function DocumentUpload({ bookingId }: DocumentUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: booking } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
  });

  const getFileName = (path: string) => {
    return path.split(/[\\/]/).pop();
  };

  const documentUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/bookings/${bookingId}/document`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "Document Uploaded",
        description: "The document has been successfully uploaded.",
      });
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document.",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const documentDeleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/bookings/${bookingId}/document`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete document");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "Document Deleted",
        description: "The document has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      documentUploadMutation.mutate(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {booking?.documentPath ? (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <File className="h-6 w-6" />
            <a href={`/${booking.documentPath}`} download className="text-sm font-medium hover:underline flex items-center space-x-1">
              <span>{getFileName(booking.documentPath)}</span>
              <Download className="h-4 w-4" />
            </a>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => documentDeleteMutation.mutate()}
            disabled={documentDeleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      ) : (
        <div>
          <Button
            onClick={handleUploadClick}
            disabled={documentUploadMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document (ZIP)
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".zip"
          />
          {documentUploadMutation.isPending && (
            <div className="mt-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center mt-1">{uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}