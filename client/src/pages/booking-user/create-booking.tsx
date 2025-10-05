import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, type Department } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const bookingFormSchema = insertBookingSchema.extend({
  purpose: z.string().min(1, "Purpose is required"),
  department_id: z.coerce.number().min(1, "Department is required"),
  checkInDate: z.date(),
  checkOutDate: z.date(),
}).omit({ userId: true });

type FormValues = z.infer<typeof bookingFormSchema>;

async function fetchDepartments(): Promise<Department[]> {
  const res = await apiRequest("GET", "/api/departments");
  if (!res.ok) {
    throw new Error("Failed to fetch departments");
  }
  return res.json();
}

export default function CreateBooking() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: departments, isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: fetchDepartments,
  });

  const defaultValues: Partial<FormValues> = {
    purpose: "",
    guestCount: 1,
    specialRequests: "",
    department_id: undefined,
    checkInDate: undefined,
    checkOutDate: undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (form.formState.errors) {
      console.log(form.formState.errors);
    }
  }, [form.formState.errors]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/bookings", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create booking");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Created",
        description: "Your booking request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-bookings"] });
      navigate("/booking/history");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error creating your booking.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: FormValues) {
    console.log("onSubmit called with:", values);
    createBookingMutation.mutate(values);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create Booking</h1>
        <Button variant="outline" onClick={() => navigate("/booking")}>
          Back to Dashboard
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg shadow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log("onError", errors))} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Visit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Academic Conference">Academic Conference</SelectItem>
                        <SelectItem value="Alumni Visit">Alumni Visit</SelectItem>
                        <SelectItem value="Parent Visit">Parent Visit</SelectItem>
                        <SelectItem value="Official Work">Official Work</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormDescription>Maximum 5 guests</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => {
                  const [isCheckInPopoverOpen, setIsCheckInPopoverOpen] = React.useState(false);
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Check-in Date</FormLabel>
                      <Popover open={isCheckInPopoverOpen} onOpenChange={setIsCheckInPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setIsCheckInPopoverOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => {
                  const [isCheckOutPopoverOpen, setIsCheckOutPopoverOpen] = React.useState(false);
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Check-out Date</FormLabel>
                      <Popover open={isCheckOutPopoverOpen} onOpenChange={setIsCheckOutPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setIsCheckOutPopoverOpen(false);
                            }}
                            disabled={(date) => {
                              const checkInDate = form.getValues().checkInDate;
                              return (
                                date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                (checkInDate && date <= checkInDate)
                              );
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referring Department</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingDepartments ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SelectValue placeholder="Select department" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((department) => (
                        <SelectItem key={department.id} value={String(department.id)}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Department requesting accommodation</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Mention any special accommodations needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createBookingMutation.isPending}>
              {createBookingMutation.isPending ? "Submitting..." : "Submit Booking Request"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
