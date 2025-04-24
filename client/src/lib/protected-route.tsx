import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@shared/schema";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
  role?: UserRole;
};

export function ProtectedRoute({ path, component: Component, role }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If a specific role is required, check if the user has that role
  if (role && user.role !== role) {
    let redirectPath;
    
    // Redirect to the appropriate dashboard based on user role
    switch (user.role) {
      case UserRole.BOOKING:
        redirectPath = "/booking";
        break;
      case UserRole.ADMIN:
        redirectPath = "/admin";
        break;
      case UserRole.VFAST:
        redirectPath = "/vfast";
        break;
      default:
        redirectPath = "/auth";
    }
    
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
