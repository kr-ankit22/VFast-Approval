import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import { useQuery } from "@tanstack/react-query";
import { Booking, Room, UserRole, BookingStatus } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const getEventColor = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.ALLOCATED:
      return "#3b82f6"; // blue-500
    case BookingStatus.APPROVED:
      return "#22c55e"; // green-500
    default:
      return "#a1a1aa"; // zinc-400
  }
};

export default function RoomAvailabilityPage() {
  const { data: rooms, isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const events = bookings
    ?.filter(booking => booking.roomNumber)
    .map(booking => ({
      title: `${booking.purpose} (${booking.departmentName})`,
      start: new Date(booking.checkInDate),
      end: new Date(booking.checkOutDate),
      resourceId: booking.roomNumber,
      backgroundColor: getEventColor(booking.status),
      borderColor: getEventColor(booking.status),
    }));

  const resources = rooms?.map(room => ({
    id: room.roomNumber,
    title: `Room ${room.roomNumber}`,
  }));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Room Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoadingRooms || isLoadingBookings ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimelinePlugin]}
              initialView="resourceTimelineMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "resourceTimelineMonth,resourceTimelineWeek,dayGridMonth",
              }}
              events={events}
              resources={resources}
              resourceAreaHeaderContent="Rooms"
              schedulerLicenseKey="GPL-TO-REMOVE"
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}