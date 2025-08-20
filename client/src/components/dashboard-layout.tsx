import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Bell,
  Search,
  LogOut,
  Settings,
  Calendar,
  Clock,
  Menu,
  X
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  // Fetch current user's employee data for profile image
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
    queryFn: async () => {
      const token = localStorage.getItem("utamahr_token");
      if (!token) throw new Error("Token not found");
      
      const response = await fetch("/api/user/employee", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch employee data");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleToggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out",
        "md:relative fixed z-50",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={handleToggleSidebar} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMobileMenu}
              className="md:hidden text-gray-600"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            {/* Left side - Company name, Date and Time */}
            <div className="flex items-center space-x-3 md:space-x-6">
              <div className="text-base md:text-lg font-semibold text-gray-700">
                UTAMA MEDGROUP
              </div>
              <div className="hidden sm:flex items-center space-x-1 text-xs md:text-sm text-gray-500">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">{new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit',
                  month: 'long', 
                  year: 'numeric',
                  weekday: 'long'
                })}</span>
                <span className="md:hidden">{new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit',
                  month: 'short'
                })}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-1 text-xs md:text-sm text-gray-500">
                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                <span>{new Date().toLocaleTimeString('en-GB', {
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Search - Hidden on small mobile */}
              <Button variant="ghost" size="sm" className="hidden sm:flex text-gray-600">
                <Search className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Bell className="w-4 h-4" />
                </Button>
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
                  3
                </Badge>
              </div>

              {/* Settings - Hidden on small mobile */}
              <Button variant="ghost" size="sm" className="hidden sm:flex text-gray-600">
                <Settings className="w-4 h-4" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-2 md:space-x-3 border-l border-gray-200 pl-2 md:pl-4">
                <div 
                  className="text-right hidden md:block cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                  onClick={() => {
                    if (currentEmployee?.id) {
                      window.location.href = `/employee-details/${currentEmployee.id}`;
                    }
                  }}
                  data-testid="link-header-user-profile"
                >
                  <div className="text-sm font-medium text-gray-900" data-testid="text-header-username">
                    {currentEmployee?.fullName || user?.username || 'UTAMA HR'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.role || currentEmployee?.role || 'Staff'}
                  </div>
                </div>
                
                <Avatar 
                  className="w-7 h-7 md:w-8 md:h-8 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all"
                  onClick={() => {
                    if (currentEmployee?.id) {
                      window.location.href = `/employee-details/${currentEmployee.id}`;
                    }
                  }}
                  data-testid="avatar-header-user-profile"
                >
                  {currentEmployee?.profileImageUrl ? (
                    <AvatarImage 
                      src={currentEmployee.profileImageUrl} 
                      alt={currentEmployee.fullName || user?.username || 'User'}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white text-xs md:text-sm font-medium">
                    {currentEmployee?.fullName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-gray-600 hover:text-red-600"
                  data-testid="button-header-logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;