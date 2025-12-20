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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const MAX_ROOMS_PER_BOOKING = 10;

const bookingFormSchema = insertBookingSchema.extend({
  purpose: z.string().min(1, "Purpose is required"),
  department_id: z.coerce.number().min(1, "Department is required"),
  checkInDate: z.date(),
  checkOutDate: z.date(),
  numberOfRooms: z.coerce.number().min(1, "At least one room is required").max(MAX_ROOMS_PER_BOOKING, `You can book a maximum of ${MAX_ROOMS_PER_BOOKING} rooms`),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
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
    numberOfRooms: 1,
    specialRequests: "",
    department_id: undefined,
    checkInDate: undefined,
    checkOutDate: undefined,
    acceptTerms: false,
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

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the <Dialog>
                        <DialogTrigger asChild>
                          <span className="text-primary underline cursor-pointer hover:text-primary/80 font-medium">conditions apply</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-primary">VFast Booking Rules & Conduct</DialogTitle>
                            <DialogDescription>
                              Please review the stay guidelines before proceeding.
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[400px] mt-4 pr-4">
                            <div className="space-y-6 text-sm">
                              <section>
                                <h4 className="font-bold text-primary mb-2">Guest Conduct & Responsibility</h4>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                  <li>The host/requester is responsible for the conduct of their guests.</li>
                                  <li>Any damage to property or loss of items will be charged to the requester.</li>
                                  <li>Quiet hours must be observed between 10:00 PM and 7:00 AM.</li>
                                  <li>Guests are expected to maintain decorum and respect the campus environment.</li>
                                </ul>
                              </section>

                              <section>
                                <h4 className="font-bold text-primary mb-2">Eco-Friendly & Green Campus</h4>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                  <li>Switch off all electrical appliances (lights, AC, geysers) when leaving the room.</li>
                                  <li>Conserve water and avoid littering on campus.</li>
                                  <li>Plastic-free campus guidelines must be followed.</li>
                                </ul>
                              </section>

                              <section>
                                <h4 className="font-bold text-primary mb-2">Prohibited Activities</h4>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600 font-medium text-red-600">
                                  <li>Strictly NO Smoking or Alcohol consumption.</li>
                                  <li>No pets allowed.</li>
                                  <li>No outside eatables in the dining area.</li>
                                  <li>Commercial activities or unauthorized gatherings.</li>
                                </ul>
                              </section>

                              <section>
                                <h4 className="font-bold text-primary mb-2">Dining & Services</h4>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                  <li>Pure Vegetarian meals only.</li>
                                  <li>Adhere to specified dining timings.</li>
                                  <li>Laundry and room service requests follow the hostel schedule.</li>
                                </ul>
                              </section>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createBookingMutation.isPending} className="w-full md:w-auto px-8">
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : "Submit Booking Request"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
