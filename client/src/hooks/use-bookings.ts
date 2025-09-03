import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, UpdateBookingStatus, RoomAllocation, Department } from "@shared/schema";

const fetchBookings = async (): Promise<Booking[]> => {
  const response = await fetch("/api/bookings");
  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }
  return response.json();
};

export const useGetBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
  });
};

const fetchMyBookings = async (): Promise<Booking[]> => {
  const response = await fetch("/api/my-bookings");
  if (!response.ok) {
    throw new Error("Failed to fetch my bookings");
  }
  return response.json();
};

export const useGetMyBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["my-bookings"],
    queryFn: fetchMyBookings,
  });
};


const fetchDepartmentApprovals = async (): Promise<Booking[]> => {
  const response = await fetch("/api/department-approvals");
  if (!response.ok) {
    throw new Error("Failed to fetch department approvals");
  }
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
  const response = await fetch(`/api/bookings/${data.id}/department-approval`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to update booking status");
  }
  return response.json();
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Booking, Error, UpdateBookingStatus>({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/department-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    },
  });
};

const allocateRoom = async (data: RoomAllocation): Promise<Booking> => {
  const response = await fetch(`/api/bookings/${data.bookingId}/allocate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to allocate room");
  }
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
  const response = await fetch("/api/bookings/reconsideration");
  if (!response.ok) {
    throw new Error("Failed to fetch reconsideration bookings");
  }
  return response.json();
};

export const useGetReconsiderationBookings = () => {
  return useQuery<Booking[], Error>({
    queryKey: ["reconsideration-bookings"],
    queryFn: fetchReconsiderationBookings,
  });
};

const fetchDepartments = async (): Promise<Department[]> => {
  const response = await fetch("/api/departments");
  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }
  return response.json();
};

export const useGetDepartments = () => {
  return useQuery<Department[], Error>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });
};
