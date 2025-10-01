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
  loginMutation: UseMutationResult<{ user: User, token: string }, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, any>;
  refetch: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/users/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: { user: User, token: string }) => {
      localStorage.setItem("token", data.token);
      
      // Set the user data in cache
      queryClient.setQueryData(["/api/users/me"], data.user);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
        variant: "default",
      });
      
      // Redirect to appropriate dashboard based on user role
      const redirectPath = data.user.role === UserRole.BOOKING 
        ? "/booking" 
        : data.user.role === UserRole.DEPARTMENT_APPROVER
          ? "/department"
          : data.user.role === UserRole.ADMIN
          ? "/admin"
          : data.user.role === UserRole.VFAST
            ? "/vfast"
            : "/";
            
      setLocation(redirectPath);
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
            
      setLocation(redirectPath);
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
      localStorage.removeItem("token"); // Explicitly remove the JWT token
      // Clear all query cache to ensure clean state
      queryClient.clear();
      
      // Redirect to auth page
      setLocation("/auth");
      
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
        refetch,
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
