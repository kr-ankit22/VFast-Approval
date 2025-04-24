import { ReactNode } from "react";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Calendar,
  HomeIcon,
  LayoutDashboard,
  LogOut,
  Settings,
  Hotel,
  BookOpen,
  Users,
  BookCheck,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  role: UserRole;
}

export default function DashboardLayout({
  children,
  title,
  description,
  role,
}: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  // Common navigation items
  const commonNavItems = [
    {
      name: "Home",
      href: "/",
      icon: HomeIcon,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Help",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  // Role-specific navigation items
  const roleSpecificNavItems = {
    [UserRole.BOOKING]: [
      {
        name: "Dashboard",
        href: "/booking",
        icon: LayoutDashboard,
      },
      {
        name: "New Booking",
        href: "/booking/create",
        icon: BookOpen,
      },
      {
        name: "My Bookings",
        href: "/booking/history",
        icon: Clock,
      },
    ],
    [UserRole.ADMIN]: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        name: "Booking Requests",
        href: "/admin/requests",
        icon: BookCheck,
      },
      {
        name: "Room Management",
        href: "/admin/rooms",
        icon: Hotel,
      },
    ],
    [UserRole.VFAST]: [
      {
        name: "Dashboard",
        href: "/vfast",
        icon: LayoutDashboard,
      },
      {
        name: "Room Allocation",
        href: "/vfast/allocation",
        icon: Calendar,
      },
      {
        name: "Reconsideration",
        href: "/vfast/reconsideration",
        icon: Users,
      },
    ],
  };

  const navItems = [...roleSpecificNavItems[role], ...commonNavItems];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <img
              className="h-8 w-auto"
              src="https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/1200px-BITS_Pilani-Logo.svg.png"
              alt="BITS Pilani"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">VFast Hostel</span>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-100",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive(item.href)
                          ? "text-primary"
                          : "text-gray-400 group-hover:text-gray-500",
                        "mr-3 flex-shrink-0 h-5 w-5"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 md:hidden flex items-center justify-between px-4 py-2 bg-white shadow-sm">
          <div className="flex items-center">
            <img
              className="h-8 w-auto"
              src="https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/BITS_Pilani-Logo.svg/1200px-BITS_Pilani-Logo.svg.png"
              alt="BITS Pilani"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">VFast Hostel</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Page header */}
        <header className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} BITS Pilani VFast Hostel. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}