import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, BookingType } from "@shared/schema";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_ROOMS_PER_BOOKING = 10;

// Modify schema to make department_id optional and force bookingType to PERSONAL
const personalBookingFormSchema = insertBookingSchema.extend({
  purpose: z.string().min(1, "Purpose is required"),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  numberOfRooms: z.coerce.number().min(1, "At least one room is required").max(MAX_ROOMS_PER_BOOKING, `You can book a maximum of ${MAX_ROOMS_PER_BOOKING} rooms`),
  bookingType: z.literal(BookingType.PERSONAL),
}).omit({ userId: true, department_id: true }); // Omit department_id

type FormValues = z.infer<typeof personalBookingFormSchema>;

export default function CreatePersonalBooking() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const defaultValues: Partial<FormValues> = {
    purpose: "",
    guestCount: 1,
    numberOfRooms: 1,
    specialRequests: "",
    checkInDate: undefined,
    checkOutDate: undefined,
    bookingType: BookingType.PERSONAL,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(personalBookingFormSchema),
    defaultValues,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Send as PERSONAL booking, department_id will be null/undefined which is allowed now
      const res = await apiRequest("POST", "/api/bookings", { ...data, bookingType: BookingType.PERSONAL });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create booking");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Personal Booking Created",
        description: "Your personal booking request has been submitted successfully and is pending room allocation.",
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
    createBookingMutation.mutate(values);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create Personal Booking</h1>
        <Button variant="outline" onClick={() => navigate("/booking")}>
          Back to Dashboard
        </Button>
      </div>

      <div className="space-y-6">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 font-semibold">Personal Booking Information</AlertTitle>
          <AlertDescription className="text-blue-700">
            Personal bookings are paid by the guest. These requests are sent directly to the VFast team for room allocation and do not require departmental approval.
          </AlertDescription>
        </Alert>

        <div className="bg-card p-6 rounded-lg shadow">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <SelectItem value="Personal Visit">Personal Visit</SelectItem>
                          <SelectItem value="Family Vacation">Family Vacation</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
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
                            className="w-24"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Rooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={MAX_ROOMS_PER_BOOKING}
                            className="w-24"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                {createBookingMutation.isPending ? "Submitting..." : "Submit Personal Booking"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
