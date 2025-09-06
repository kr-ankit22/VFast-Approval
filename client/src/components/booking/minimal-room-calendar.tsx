import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Booking, Room, BookingStatus } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';

interface MinimalRoomCalendarProps {
  roomType?: string; // Optional: filter by room type
  checkInDate: Date;
  checkOutDate: Date;
}

const getBookingColor = (status: BookingStatus) => {
  switch (status) {
    case BookingStatus.ALLOCATED:
      return "bg-blue-500";
    case BookingStatus.APPROVED:
      return "bg-green-500";
    case BookingStatus.PENDING_DEPARTMENT_APPROVAL:
    case BookingStatus.PENDING_ADMIN_APPROVAL:
      return "bg-yellow-500";
    case BookingStatus.REJECTED:
    case BookingStatus.PENDING_RECONSIDERATION:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export default function MinimalRoomCalendar({ roomType, checkInDate, checkOutDate }: MinimalRoomCalendarProps) {
  const { data: rooms, isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const today = new Date();
  const startCalDate = startOfMonth(checkInDate);
  const endCalDate = endOfMonth(checkOutDate);
  const daysInMonth = eachDayOfInterval({ start: startCalDate, end: endCalDate });

  const filteredRooms = roomType ? rooms?.filter(r => r.type === roomType) : rooms;

  if (isLoadingRooms || isLoadingBookings) {
    return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
  }

  if (!filteredRooms || filteredRooms.length === 0) {
    return <p className="text-muted-foreground">No rooms found for this type.</p>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="grid grid-cols-8 gap-1 text-center text-xs font-medium mb-2">
        <div className="col-span-2">Room</div>
        {daysInMonth.map(day => (
          <div key={format(day, 'yyyy-MM-dd')}>{format(day, 'dd')}<br/>{format(day, 'MMM')}</div>
        ))}
      </div>
      {filteredRooms.map(room => (
        <div key={room.id} className="grid grid-cols-8 gap-1 text-center text-xs">
          <div className="col-span-2 py-2 bg-gray-100 rounded-l-md">{room.roomNumber}</div>
          {daysInMonth.map(day => {
            const dayBookings = bookings?.filter(b => 
              b.roomNumber === room.roomNumber &&
              isWithinInterval(day, { start: new Date(b.checkInDate), end: addDays(new Date(b.checkOutDate), -1) })
            );
            const isBooked = dayBookings && dayBookings.length > 0;
            const isSelectedBookingDate = isWithinInterval(day, { start: checkInDate, end: addDays(checkOutDate, -1) });

            let cellClass = "py-2 rounded-sm";
            if (isBooked) {
              cellClass += ` ${getBookingColor(dayBookings[0].status)}`;
            } else if (isSameDay(day, today)) {
              cellClass += " bg-blue-200";
            } else if (isSelectedBookingDate) {
              cellClass += " bg-purple-200";
            } else {
              cellClass += " bg-gray-50";
            }

            return (
              <div key={format(day, 'yyyy-MM-dd')} className={cellClass}>
                {isBooked ? 'B' : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
