import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Bell,
  Search,
  LogOut,
  Settings,
  Calendar,
  Clock,
  Menu,
  X,
  MessageSquare,
  User,
  CheckCircle
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  // Sample notification data - this would come from API in real implementation
  const notifications = [
    {
      id: 1,
      type: "leave_approval",
      title: "Leave Request Pending",
      message: "Your annual leave request for March 15-17 is awaiting supervisor approval.",
      timestamp: "2 hours ago",
      isRead: false,
      priority: "medium"
    },
    {
      id: 2,
      type: "system_update",
      title: "System Maintenance",
      message: "Scheduled maintenance will occur this Saturday from 2:00 AM to 4:00 AM.",
      timestamp: "1 day ago",
      isRead: true,
      priority: "low"
    },
    {
      id: 3,
      type: "payslip_ready",
      title: "Payslip Available",
      message: "Your February 2025 payslip is now ready for download.",
      timestamp: "3 days ago",
      isRead: false,
      priority: "high"
    },
    {
      id: 4,
      type: "policy_update",
      title: "Updated HR Policy",
      message: "New attendance policy has been implemented. Please review the changes.",
      timestamp: "1 week ago",
      isRead: true,
      priority: "medium"
    },
    {
      id: 5,
      type: "training_reminder",
      title: "Training Session Reminder",
      message: "Monthly safety training is scheduled for tomorrow at 10:00 AM.",
      timestamp: "2 weeks ago",
      isRead: false,
      priority: "high"
    }
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave_approval":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "system_update":
        return <Settings className="w-4 h-4 text-gray-500" />;
      case "payslip_ready":
        return <User className="w-4 h-4 text-green-500" />;
      case "policy_update":
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case "training_reminder":
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Helper function to get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
              {/* Notifications */}
              <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <DialogTrigger asChild>
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-600 hover:text-blue-600"
                      data-testid="button-notifications"
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[600px]" data-testid="dialog-notifications">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications ({unreadCount} unread)
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No notifications available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((notification, index) => (
                          <div key={notification.id}>
                            <div 
                              className={cn(
                                "p-4 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer",
                                notification.isRead 
                                  ? "bg-white border-gray-200" 
                                  : "bg-blue-50 border-blue-200"
                              )}
                              data-testid={`notification-item-${notification.id}`}
                            >
                              <div className="flex items-start gap-3">
                                {getNotificationIcon(notification.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={cn(
                                      "text-sm font-medium truncate",
                                      !notification.isRead && "text-blue-900"
                                    )}>
                                      {notification.title}
                                    </h4>
                                    <span className={cn(
                                      "px-2 py-1 text-xs rounded-full border",
                                      getPriorityColor(notification.priority)
                                    )}>
                                      {notification.priority}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {notification.timestamp}
                                    </span>
                                    {!notification.isRead && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {index < notifications.length - 1 && (
                              <Separator className="my-3" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="border-t pt-4 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Mark all as read functionality would go here
                        console.log("Mark all as read");
                      }}
                      data-testid="button-mark-all-read"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark All Read
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsNotificationOpen(false)}
                      data-testid="button-close-notifications"
                    >
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              

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