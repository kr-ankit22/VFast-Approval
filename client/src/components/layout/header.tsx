import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X } from "lucide-react";
import { UserRole } from "@shared/schema";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-primary">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-white text-2xl font-bold font-poppins cursor-pointer">VFast Hostel</h1>
            </Link>
            <span className="text-white text-sm ml-2 px-2 py-1 bg-secondary text-primary rounded-md">BITS Pilani</span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <span className={`nav-link ${location === "/" ? "active" : ""}`}>Home</span>
            </Link>
            <Link href="/#facilities">
              <span className="nav-link">Facilities</span>
            </Link>
            <Link href="/#about">
              <span className="nav-link">About</span>
            </Link>
            
            {!user ? (
              <Link href="/auth">
                <Button variant="secondary" className="font-medium">Sign In</Button>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href={
                  user.role === UserRole.BOOKING ? "/booking" :
                  user.role === UserRole.ADMIN ? "/admin" :
                  "/vfast"
                }>
                  <Button variant="ghost" className="text-white hover:text-white hover:bg-primary-foreground">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="secondary"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </div>
            )}
          </div>
          <div className="md:hidden">
            <button className="text-white" onClick={toggleMenu}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary pb-4">
          <div className="container mx-auto px-4 space-y-2">
            <Link href="/">
              <span className={`nav-link block ${location === "/" ? "active" : ""}`}>Home</span>
            </Link>
            <Link href="/#facilities">
              <span className="nav-link block" onClick={() => setIsMenuOpen(false)}>Facilities</span>
            </Link>
            <Link href="/#about">
              <span className="nav-link block" onClick={() => setIsMenuOpen(false)}>About</span>
            </Link>
            
            {!user ? (
              <Link href="/auth">
                <Button variant="secondary" className="w-full mt-3" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Button>
              </Link>
            ) : (
              <>
                <Link href={
                  user.role === UserRole.BOOKING ? "/booking" :
                  user.role === UserRole.ADMIN ? "/admin" :
                  "/vfast"
                }>
                  <span className="nav-link block" onClick={() => setIsMenuOpen(false)}>Dashboard</span>
                </Link>
                <Button 
                  variant="secondary"
                  className="w-full mt-3"
                  onClick={() => {
                    logoutMutation.mutate();
                    setIsMenuOpen(false);
                  }}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
