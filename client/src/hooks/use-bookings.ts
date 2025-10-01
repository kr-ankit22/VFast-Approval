import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, UpdateBookingStatus, RoomAllocation, Department } from "@shared/schema";

const fetchBookings = async (): Promise<Booking[]> => {
  const response = await apiRequest("GET", "/api/bookings");
  return response.json();
};

export const useGetBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
  });
};

const fetchMyBookings = async (): Promise<Booking[]> => {
  const response = await apiRequest("GET", "/api/my-bookings");
  return response.json();
};

export const useGetMyBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["my-bookings"],
    queryFn: fetchMyBookings,
  });
};


const fetchDepartmentApprovals = async (): Promise<Booking[]> => {
  const response = await apiRequest("GET", "/api/department-approvals");
  const data = await response.json();
  // console.log("Raw response from /api/department-approvals:", data);
  return data;
};
// TODO: Ensure /api/department-approvals returns allocated bookings for the 'Allocated Rooms' metric on the department approver dashboard to function correctly.

export const useDepartmentApprovals = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["/api/department-approvals"],
    queryFn: fetchDepartmentApprovals,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: 5000,
  });
};

const updateBookingStatus = async (data: UpdateBookingStatus): Promise<Booking> => {
  const response = await apiRequest("PATCH", `/api/bookings/${data.id}/department-approval`, data);
  return response.json();
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, UpdateBookingStatus>({
    mutationFn: updateBookingStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ["department-approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/department-approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["reconsideration-bookings"] });
      await queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      await queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
};

const allocateRoom = async (data: RoomAllocation): Promise<Booking> => {
  const response = await apiRequest("PATCH", `/api/bookings/${data.bookingId}/allocate`, data);
  return response.json();
};

export const useAllocateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, RoomAllocation>({
    mutationFn: allocateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
  });
};

const fetchReconsiderationBookings = async (): Promise<Booking[]> => {
  const response = await apiRequest("GET", "/api/bookings/reconsideration");
  return response.json();
};

export const useGetReconsiderationBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["reconsideration-bookings"],
    queryFn: fetchReconsiderationBookings,
  });
};

const fetchDepartments = async (): Promise<Department[]> => {
  const response = await apiRequest("GET", "/api/departments");
  return response.json();
};

export const useGetDepartments = () => {
  return useQuery<Department[], Error>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });
};

const resubmitBooking = async (data: { id: number, booking: Booking }): Promise<Booking> => {
  const response = await apiRequest("POST", `/api/bookings/${data.id}/resubmit`, data.booking);
  return response.json();
};

export const useResubmitBooking = () => {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, { id: number, booking: Booking }>({
    mutationFn: resubmitBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
  });
};

const fetchMyReconsiderationBookings = async (): Promise<Booking[]> => {
  const response = await apiRequest("GET", "/api/my-bookings/reconsider");
  return response.json();
};

export const useGetMyReconsiderationBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["my-reconsideration-bookings"],
    queryFn: fetchMyReconsiderationBookings,
  });
};

const fetchRooms = async (): Promise<Room[]> => {
  const response = await apiRequest("GET", "/api/rooms");
  return response.json();
};

export const useGetRooms = () => {
  return useQuery<Room[], Error>({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });
};

import { apiRequest } from "../lib/queryClient";

const fetchGuestWorklist = async (): Promise<any[]> => {
  console.log("fetchGuestWorklist: Token from localStorage:", localStorage.getItem("token"));
  const response = await apiRequest("GET", "/api/bookings/worklist");
  const data = await response.json();
  console.log("Guest worklist data:", data);
  return data;
};

export const useGetGuestWorklist = () => {
  return useQuery<any[], Error>({
    queryKey: ["guest-worklist"],
    queryFn: fetchGuestWorklist,
  });
};

const checkInBooking = async (bookingId: number): Promise<Booking> => {
  const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/check-in`);
  return response.json();
};

export const useCheckInBooking = () => {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, number>({
    mutationFn: checkInBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-worklist"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

const checkOutBooking = async (bookingId: number): Promise<Booking> => {
  const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/check-out`);
  return response.json();
};

export const useCheckOutBooking = () => {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, number>({
    mutationFn: checkOutBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-worklist"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] }); // Invalidate rooms to reflect availability
    },
  });
};
