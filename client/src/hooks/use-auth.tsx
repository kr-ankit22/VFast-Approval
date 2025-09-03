import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, LoginUser, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  createdAt: Date;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, any>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Clear any stale query data first
      queryClient.clear();
      
      // Set the user data in cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
        variant: "default",
      });
      
      // Force a hard navigation to ensure state is refreshed
      setTimeout(() => {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = user.role === UserRole.BOOKING 
          ? "/booking" 
          : user.role === UserRole.DEPARTMENT_APPROVER
            ? "/department"
            : user.role === UserRole.ADMIN
            ? "/admin"
            : user.role === UserRole.VFAST
              ? "/vfast"
              : "/";
              
        window.location.href = redirectPath;
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Clear any stale query data first
      queryClient.clear();
      
      // Set the user data in cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Show success toast
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
        variant: "default",
      });
      
      // Force a hard navigation to ensure state is refreshed
      setTimeout(() => {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = user.role === UserRole.BOOKING 
          ? "/booking" 
          : user.role === UserRole.DEPARTMENT_APPROVER
            ? "/department"
            : user.role === UserRole.ADMIN
            ? "/admin"
            : user.role === UserRole.VFAST
              ? "/vfast"
              : "/";
              
        window.location.href = redirectPath;
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all query cache to ensure clean state
      queryClient.clear();
      
      // Force redirect to auth page
      window.location.href = "/auth";
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
