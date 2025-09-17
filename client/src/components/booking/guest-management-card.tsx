import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, UserPlus, CheckCircle, XCircle, Upload, UserCheck, UserX, Edit, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Guest, InsertGuest, Booking, User, Department } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CheckOutButton from "./check-out-button";
import DocumentUpload from "./document-upload";
import { Switch } from "@/components/ui/switch";
import CheckInDialog from "./check-in-dialog";
import SectionHeader from "@/components/ui/section-header";
import GuestNotesSection from "./guest-notes-section";

interface GuestManagementCardProps {
  bookingId: number;
}

const guestFormSchema = z.object({
  name: z.string().min(2, "Guest name must be at least 2 characters."),
  contact: z.string().min(1, "Contact is required."),
  kycDocumentUrl: z.string().min(1, "KYC document is required."),
  origin: z.string().min(1, "Origin is required."),
  spocName: z.string().min(1, "SPOC name is required."),
  spocContact: z.string().min(1, "SPOC contact is required."),
  foodPreferences: z.string().optional(),
  otherSpecialRequests: z.string().optional(),
  keyHandedOver: z.boolean(),
  citizenCategory: z.enum(["Indian", "NRI", "Foreign National"]),
  travelDetails: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  otherNationality: z.string().optional(),
});

const editGuestFormSchema = z.object({
  name: z.string().min(2, "Guest name must be at least 2 characters."),
  contact: z.string().min(1, "Contact is required."),
  kycDocumentUrl: z.string().min(1, "KYC document is required."),
  origin: z.string().min(1, "Origin is required."),
  spocName: z.string().min(1, "SPOC name is required."),
  spocContact: z.string().min(1, "SPOC contact is required."),
  foodPreferences: z.string().optional(),
  otherSpecialRequests: z.string().optional(),
  keyHandedOver: z.boolean(),
  citizenCategory: z.enum(["Indian", "NRI", "Foreign National"]),
  travelDetails: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().optional(),
  otherNationality: z.string().optional(),
});

export default function GuestManagementCard({ bookingId }: GuestManagementCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddGuestDialogOpen, setIsAddGuestDialogOpen] = useState(false);
  const [isEditGuestDialogOpen, setIsEditGuestDialogOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [guestToCheckIn, setGuestToCheckIn] = useState<Guest | null>(null);

  const { data: booking } = useQuery<Booking>({
    queryKey: [`/api/bookings/${bookingId}`],
  });

  const { data: department } = useQuery<Department>({
    queryKey: [`/api/departments/${booking?.department_id}`],
    enabled: !!booking?.department_id,
  });

  const { data: departmentApprover } = useQuery<User>({
    queryKey: [`/api/users/${booking?.departmentApproverId}`],
    enabled: !!booking?.departmentApproverId,
  });

  const { data: guests, isLoading, isError } = useQuery<Guest[]>({
    queryKey: [`/api/bookings/${bookingId}/guests`],
    refetchInterval: 5000,
  });

  const addGuestForm = useForm<z.infer<typeof guestFormSchema>>({
    resolver: zodResolver(guestFormSchema.refine(data => {
      if (data.citizenCategory === 'Foreign National') {
        return !!data.passportNumber && !!data.nationality;
      }
      return true;
    }, {
      message: "Passport number and nationality are required for foreign nationals.",
      path: ["passportNumber"],
    })),
    defaultValues: {
      name: "",
      contact: "",
      kycDocumentUrl: "",
      origin: "",
      spocName: "",
      spocContact: "",
      foodPreferences: "",
      otherSpecialRequests: "",
      citizenCategory: undefined,
      travelDetails: "",
    },
  });

  const editGuestForm = useForm<z.infer<typeof editGuestFormSchema>>({
    resolver: zodResolver(editGuestFormSchema),
    defaultValues: {
      name: "",
      contact: "",
      kycDocumentUrl: "",
      origin: "",
      spocName: "",
      spocContact: "",
      foodPreferences: "",
      otherSpecialRequests: "",
      keyHandedOver: false,
      citizenCategory: undefined,
      travelDetails: "",
    },
  });

  const addGuestMutation = useMutation({
    mutationFn: async (newGuest: InsertGuest) => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/guests`, newGuest);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      toast({
        title: "Guest Added",
        description: "New guest has been successfully added.",
      });
      setIsAddGuestDialogOpen(false);
      addGuestForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add guest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: async ({ guestId, updates }: { guestId: number, updates: Partial<Guest> }) => {
      const res = await apiRequest("PATCH", `/api/guests/${guestId}`, updates);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      toast({
        title: "Guest Updated",
        description: "Guest details updated successfully.",
      });
      setIsEditGuestDialogOpen(false);
      setGuestToEdit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update guest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, updates }: { bookingId: number, updates: Partial<Booking> }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}`, updates);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "Booking Updated",
        description: "Booking details updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async (guestId: number) => {
      const res = await apiRequest("POST", `/api/guests/${guestId}/check-in`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to check-in guest");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "Guest Checked-in",
        description: "Guest has been successfully checked-in.",
      });
      setIsCheckInDialogOpen(false);
      setGuestToCheckIn(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to check-in guest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkOutAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/checkout-all`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to check out all guests");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/guests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}`] });
      toast({
        title: "All Guests Checked-out",
        description: "All guests have been successfully checked-out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to check out all guests",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddGuest = (values: z.infer<typeof guestFormSchema>) => {
    addGuestMutation.mutate(values);
  };

  const handleEditGuest = (guest: Guest) => {
    setGuestToEdit(guest);
    editGuestForm.reset(guest);
    setIsEditGuestDialogOpen(true);
  };

  const handleUpdateGuest = (values: z.infer<typeof guestFormSchema>) => {
    if (guestToEdit) {
      updateGuestMutation.mutate({ guestId: guestToEdit.id, updates: values });
    }
  };

  const areGuestDetailsComplete = (guests: Guest[]) => {
    if (!guests || guests.length === 0) {
      return false;
    }
    return guests.every((guest) => {
      return (
        guest.name &&
        guest.contact &&
        guest.origin &&
        guest.spocName &&
        guest.spocContact &&
        guest.citizenCategory
      );
    });
  };

  const isStayExperienceComplete = booking?.keyHandedOver;

  const areAllGuestsCheckedOut = (guests: Guest[]) => {
    if (!guests || guests.length === 0) {
      return false;
    }
    return guests.every((guest) => !guest.checkedIn);
  };

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="guest-details">
          <TabsList>
            <TabsTrigger value="guest-details" className={areGuestDetailsComplete(guests) ? 'text-green-600' : ''}>
              {areGuestDetailsComplete(guests) && <CheckCircle className="h-4 w-4 mr-2" />} Guest Details & Docs
            </TabsTrigger>
            <TabsTrigger value="stay-experience" className={isStayExperienceComplete ? 'text-green-600' : ''}>
              {isStayExperienceComplete && <CheckCircle className="h-4 w-4 mr-2" />} Stay Experience
            </TabsTrigger>
            <TabsTrigger value="checkout-operations" className={areAllGuestsCheckedOut(guests) ? 'text-green-600' : ''}>
              {areAllGuestsCheckedOut(guests) && <CheckCircle className="h-4 w-4 mr-2" />} Checkout Operations
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guest-details">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsAddGuestDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading guests...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-red-500">
                <XCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load guests.</p>
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No guests added for this booking yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {guests.map((guest) => (
                  <Collapsible key={guest.id} className={`border rounded-lg overflow-hidden ${guest.checkedIn ? 'bg-green-50' : ''}`}>
                    <CollapsibleTrigger className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${guest.name}`} />
                          <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow text-right"> {/* Added flex-grow and text-right */}
                          <h4 className="font-semibold text-lg">{guest.name}</h4> {/* Removed text-right from h4 */}
                          <div className="flex items-center space-x-2 justify-end"> {/* Added justify-end */}
                            <Badge variant={guest.citizenCategory === 'Indian' ? 'default' : 'secondary'}>{guest.citizenCategory}</Badge>
                            {department && <Badge variant="outline">{department.name}</Badge>}
                            {departmentApprover && <Badge variant="outline">Approver: {departmentApprover.name}</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!guest.checkedIn ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGuestToCheckIn(guest);
                              setIsCheckInDialogOpen(true);
                            }}
                            disabled={!booking?.documentPath || !guest.name}
                          >
                            Check-in
                          </Button>
                        ) : (
                          <CheckOutButton guestId={guest.id} bookingId={bookingId} />
                        )}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditGuest(guest); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div>
                          <p className="text-sm text-gray-600"><strong>Contact:</strong> {guest.contact || 'N/A'}</p>
                          <p className="text-sm text-gray-600"><strong>Origin:</strong> {guest.origin || 'N/A'}</p>
                          <p className="text-sm text-gray-600"><strong>SPOC:</strong> {guest.spocName || 'N/A'} ({guest.spocContact || 'N/A'})</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600"><strong>Food Prefs:</strong> {guest.foodPreferences || 'N/A'}</p>
                          <p className="text-sm text-gray-600"><strong>Other Requests:</strong> {guest.otherSpecialRequests || 'N/A'}</p>
                          <p className="text-sm text-gray-600"><strong>Travel Details:</strong> {guest.travelDetails ? JSON.stringify(guest.travelDetails) : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-sm font-medium">KYC Document</h5>
                        <DocumentUpload bookingId={bookingId} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="stay-experience">
            <div className="flex flex-col space-y-4 p-4"> {/* Changed to flex-col to stack elements */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="key-handed-over">Key Handed Over</Label>
                <Switch
                  id="key-handed-over"
                  checked={booking?.keyHandedOver}
                  onCheckedChange={(checked) => {
                    updateBookingMutation.mutate({ bookingId, updates: { keyHandedOver: checked } });
                  }}
                />
              </div>
              <GuestNotesSection bookingId={bookingId} /> {/* Added GuestNotesSection */}
            </div>
          </TabsContent>
          <TabsContent value="checkout-operations">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">Approved Check-out Date</p>
                <p className="text-lg font-semibold">{booking ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <Button
                size="sm"
                onClick={() => checkOutAllMutation.mutate()}
                disabled={!guests || guests.length === 0 || areAllGuestsCheckedOut(guests) || checkOutAllMutation.isPending}
              >
                {checkOutAllMutation.isPending ? "Checking Out..." : "Check Out All"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Add Guest Dialog */}
      <Dialog open={isAddGuestDialogOpen} onOpenChange={setIsAddGuestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
            <DialogDescription>
              Add details for a new guest associated with this booking.
            </DialogDescription>
          </DialogHeader>
          <Form {...addGuestForm}>
            <form onSubmit={addGuestForm.handleSubmit(handleAddGuest)} className="space-y-4">
              <FormField
                control={addGuestForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guest name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="citizenCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Citizen Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="NRI">NRI</SelectItem>
                        <SelectItem value="Foreign National">Foreign National</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {addGuestForm.watch("citizenCategory") === "Foreign National" && (
                <>
                  <FormField
                    control={addGuestForm.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter passport number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addGuestForm.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Add a list of countries here */}
                            <SelectItem value="USA">United States</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {addGuestForm.watch("nationality") === "Other" && (
                    <FormField
                      control={addGuestForm.control}
                      name="otherNationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please specify nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={addGuestForm.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin (City/Country) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter origin (City/Country)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="spocName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPOC Name (On Campus) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SPOC name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="spocContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPOC Contact *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SPOC contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="foodPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Preferences/Dietary Needs</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Vegetarian, Gluten-free, No nuts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="otherSpecialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Special Requests</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Wheelchair access, extra pillow" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addGuestForm.control}
                name="travelDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Details (Notes)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Arriving by flight AI123 at 10 AM on Jan 1st."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>General notes about guest's travel arrangements.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddGuestDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addGuestMutation.isPending}>
                  {addGuestMutation.isPending ? "Adding..." : "Add Guest"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Guest Dialog */}
      <Dialog open={isEditGuestDialogOpen} onOpenChange={setIsEditGuestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guest: {guestToEdit?.name}</DialogTitle>
            <DialogDescription>
              Update details for this guest.
            </DialogDescription>
          </DialogHeader>
          <Form {...editGuestForm}>
            <form onSubmit={editGuestForm.handleSubmit(handleUpdateGuest)} className="space-y-4">
              <FormField
                control={editGuestForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter guest name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="citizenCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Citizen Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="NRI">NRI</SelectItem>
                        <SelectItem value="Foreign National">Foreign National</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editGuestForm.watch("citizenCategory") === "Foreign National" && (
                <>
                  <FormField
                    control={editGuestForm.control}
                    name="passportNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter passport number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editGuestForm.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Add a list of countries here */}
                            <SelectItem value="USA">United States</SelectItem>
                            <SelectItem value="UK">United Kingdom</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {editGuestForm.watch("nationality") === "Other" && (
                    <FormField
                      control={editGuestForm.control}
                      name="otherNationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please specify nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              <FormField
                control={editGuestForm.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin (City/Country) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter origin (City/Country)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="spocName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPOC Name (On Campus) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SPOC name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="spocContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SPOC Contact *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SPOC contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="foodPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Preferences/Dietary Needs</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Vegetarian, Gluten-free, No nuts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="otherSpecialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Special Requests</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Wheelchair access, extra pillow" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editGuestForm.control}
                name="travelDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Details (Notes)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., Arriving by flight AI123 at 10 AM on Jan 1st."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>General notes about guest's travel arrangements.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditGuestDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateGuestMutation.isPending}>
                  {updateGuestMutation.isPending ? "Updating..." : "Update Guest"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CheckInDialog
        open={isCheckInDialogOpen}
        onOpenChange={setIsCheckInDialogOpen}
        onCheckIn={() => {
          if (guestToCheckIn) {
            checkInMutation.mutate(guestToCheckIn.id);
          }
        }}
        isCheckingIn={checkInMutation.isPending}
      />
    </Card>
  );
}