import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bell,
  Search,
  LogOut,
  Settings,
  Calendar,
  Clock
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, logoutMutation } = useAuth();

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={handleToggleSidebar} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side - Company name, Date and Time */}
            <div className="flex items-center space-x-6">
              <div className="text-lg font-semibold text-gray-700">
                UTAMA MEDGROUP
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit',
                  month: 'long', 
                  year: 'numeric',
                  weekday: 'long'
                })}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleTimeString('en-GB', {
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <Button variant="ghost" size="sm" className="text-gray-600">
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

              {/* Settings */}
              <Button variant="ghost" size="sm" className="text-gray-600">
                <Settings className="w-4 h-4" />
              </Button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900" data-testid="text-header-username">
                    {user?.username || 'UTAMA HR'}
                  </div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-cyan-500 text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
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
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;