import { ReactNode } from "react";
import Header from "./header";
import Footer from "./footer";
import Sidebar from "./sidebar";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  role: UserRole;
}

export default function DashboardLayout({ children, title, description, role }: DashboardLayoutProps) {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <aside className="md:w-1/4">
              <Sidebar userRole={role} />
            </aside>

            {/* Main Content Area */}
            <div className="md:w-3/4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold font-poppins text-primary">{title}</h1>
                {description && <p className="text-gray-600">{description}</p>}
              </div>

              {children}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
