import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BookingForm from "@/components/booking/booking-form";
import { UserRole } from "@shared/schema";

export default function CreateBooking() {
  return (
    <DashboardLayout 
      title="Create New Booking"
      description="Fill out the form below to submit a new booking request"
      role={UserRole.BOOKING}
    >
      <Card>
        <CardHeader>
          <CardTitle>Booking Request Form</CardTitle>
          <CardDescription>
            Please provide all required information for your upcoming stay at VFast Hostel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
