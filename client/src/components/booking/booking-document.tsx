
import { Upload, File as FileIcon, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface BookingDocumentProps {
  bookingId: number;
  documentPath?: string | null;
}

export default function BookingDocument({ bookingId, documentPath }: BookingDocumentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/upload-document`, formData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload document");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "Document Uploaded",
        description: "The document has been successfully uploaded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
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
        title: "Failed to delete document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
    },
    multiple: false,
  });

  const fileName = documentPath ? documentPath.split(/[\\/]/).pop() : null;

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
      <div className="flex items-center space-x-4">
        <FileIcon className="h-8 w-8 text-gray-500" />
        <div>
          <h4 className="font-semibold">Booking Document</h4>
          {fileName ? (
            <div className="flex items-center space-x-2">
              <a href={`/${documentPath}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {fileName}
              </a>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteDocumentMutation.mutate()}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No document uploaded.</p>
          )}
        </div>
      </div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button variant="outline" size="sm" disabled={uploadMutation.isPending}>
          <Upload className="h-4 w-4 mr-2" />
          {uploadMutation.isPending ? "Uploading..." : "Upload ZIP"}
        </Button>
      </div>
      <p className="text-xs text-gray-500 absolute bottom-1 right-4">Only .zip files are accepted.</p>
    </div>
  );
}
