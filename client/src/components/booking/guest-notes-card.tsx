import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, PlusCircle, MessageSquare, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GuestNote, InsertGuestNote } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface GuestNotesCardProps {
  guestId: number;
}

const addNoteFormSchema = z.object({
  note: z.string().min(5, "Note must be at least 5 characters.").max(500, "Note cannot exceed 500 characters."),
  type: z.string().optional(),
});

export default function GuestNotesCard({ guestId }: GuestNotesCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);

  const { data: notes, isLoading, isError } = useQuery<GuestNote[]>({
    queryKey: [`/api/guests/${guestId}/notes`],
    refetchInterval: 5000,
  });

  const addNoteForm = useForm<z.infer<typeof addNoteFormSchema>>({
    resolver: zodResolver(addNoteFormSchema),
    defaultValues: {
      note: "",
      type: "general",
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (newNote: InsertGuestNote) => {
      const res = await apiRequest("POST", `/api/guests/${guestId}/notes`, newNote);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add note");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/guests/${guestId}/notes`] });
      toast({
        title: "Note Added",
        description: "New note has been successfully added.",
      });
      setIsAddNoteDialogOpen(false);
      addNoteForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNote = (values: z.infer<typeof addNoteFormSchema>) => {
    addNoteMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Guest Notes</CardTitle>
        <Button size="sm" onClick={() => setIsAddNoteDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading notes...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load notes.</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No notes for this guest yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{note.note}</p>
                    <p className="text-sm text-muted-foreground">Type: {note.type || "General"}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(note.timestamp), "PPP p")}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteDialogOpen} onOpenChange={setIsAddNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
            <DialogDescription>
              Add a new note for this guest.
            </DialogDescription>
          </DialogHeader>
          <Form {...addNoteForm}>
            <form onSubmit={addNoteForm.handleSubmit(handleAddNote)} className="space-y-4">
              <FormField
                control={addNoteForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter note content..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addNoteForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="food_preference">Food Preference</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddNoteDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addNoteMutation.isPending}>
                  {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}