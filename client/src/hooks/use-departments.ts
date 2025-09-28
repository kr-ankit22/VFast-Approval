import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Department } from "@shared/schema";

export const useDepartments = () => {
  return useQuery<Department[]>({ 
    queryKey: ["departments"], 
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/departments");
      return res.json();
    },
  });
};
