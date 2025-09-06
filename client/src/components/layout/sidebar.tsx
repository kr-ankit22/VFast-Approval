import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { 
  Home, 
  PlusCircle, 
  History, 
  ClipboardList, 
  Hotel, 
  ChartBar, 
  Settings, 
  UserCog, 
  DoorOpen, 
  RefreshCw, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  // Get the first letter of first and last name for the avatar
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Determine navigation links based on user role
  const getNavLinks = () => {
    switch (userRole) {
      case UserRole.BOOKING:
        return [
          { href: "/booking", icon: <Home size={18} />, label: "Dashboard" },
          { href: "/booking/create", icon: <PlusCircle size={18} />, label: "New Booking" },
          { href: "/booking/history", icon: <History size={18} />, label: "Booking History" },
          { href: "/booking/reconsider", icon: <RefreshCw size={18} />, label: "Reconsideration" },
          { href: "/profile", icon: <UserCog size={18} />, label: "Profile Settings" }
        ];
      case UserRole.ADMIN:
        return [
          { href: "/admin", icon: <Home size={18} />, label: "Dashboard" },
          { href: "/admin/requests", icon: <ClipboardList size={18} />, label: "Booking Requests" },
          { href: "/admin/rooms", icon: <Hotel size={18} />, label: "Room Management" },
          { href: "/admin/reports", icon: <ChartBar size={18} />, label: "Reports" },
          { href: "/admin/settings", icon: <Settings size={18} />, label: "Settings" }
        ];
      case UserRole.DEPARTMENT_APPROVER:
        return [
          { href: "/department", icon: <Home size={18} />, label: "Dashboard" },
          { href: "/department/requests", icon: <ClipboardList size={18} />, label: "Booking Requests" },
          { href: "/profile", icon: <UserCog size={18} />, label: "Profile Settings" }
        ];
      case UserRole.VFAST:
        return [
          { href: "/vfast", icon: <Home size={18} />, label: "Dashboard" },
          { href: "/vfast/workflow", icon: <DoorOpen size={18} />, label: "Booking Workflow" },
          { href: "/vfast/guest-worklist", icon: <ClipboardList size={18} />, label: "Guest Management" },
          { href: "/vfast/reconsideration", icon: <RefreshCw size={18} />, label: "Reconsideration Requests" },
          { href: "/vfast/all-booking-requests", icon: <ClipboardList size={18} />, label: "All Booking Requests" },
          { href: "/vfast/room-inventory", icon: <Hotel size={18} />, label: "Room Inventory" },
          { href: "/vfast/settings", icon: <Settings size={18} />, label: "Settings" }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  // Role-specific colors
  const getBadgeColor = () => {
    switch (userRole) {
      case UserRole.BOOKING:
        return "bg-blue-500";
      case UserRole.ADMIN:
        return "bg-purple-500";
      case UserRole.DEPARTMENT_APPROVER:
        return "bg-teal-500";
      case UserRole.VFAST:
        return "bg-green-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
      <div className="flex items-center space-x-3 mb-6">
        <div className={`w-12 h-12 rounded-full ${getBadgeColor()} text-white flex items-center justify-center font-bold`}>
          {getInitials(user.name)}
        </div>
        <div>
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{userRole} User</p>
        </div>
      </div>
      
      <nav className="space-y-2">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <a className={cn(
              "flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors",
              location === link.href && "bg-primary bg-opacity-10 text-primary font-medium"
            )}>
              <span className="mr-2">{link.icon}</span> {link.label}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="mt-6 pt-6 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut size={18} className="mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
