import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [readNotifications, setReadNotifications] = useState<Set<number>>(new Set());
  const { user, logoutMutation } = useAuth();

  // Fetch real notification data from APIs
  const { data: announcements } = useQuery({
    queryKey: ["/api/announcements/unread"],
    enabled: !!user?.id,
  });

  const { data: userNotifications } = useQuery({
    queryKey: ["/api/user-notifications/unread"],
    enabled: !!user?.id,
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ["/api/pending-approval-statistics"],
    enabled: !!user?.id,
  });

  const { data: shifts } = useQuery({
    queryKey: ["/api/shifts/user-today"],
    enabled: !!user?.id,
  });

  const { data: userPayslips } = useQuery({
    queryKey: ["/api/payslips/user"],
    enabled: !!user?.id,
  });

  // Handle notification click - mark as read and open detail dialog
  const handleNotificationClick = async (notification: any) => {
    // Mark as read locally
    setReadNotifications(prev => new Set([...prev, notification.id]));
    
    // Mark as read on server if it's a user notification
    if (notification.originalId && notification.type !== "announcement") {
      try {
        await fetch(`/api/user-notifications/${notification.originalId}/mark-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    
    // Open detail dialog
    setSelectedNotification(notification);
    // Close notification popup
    setIsNotificationOpen(false);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    const allNotificationIds = generateNotifications().map(n => n.id);
    setReadNotifications(new Set(allNotificationIds));
  };

  // Generate real notifications based on actual data
  const generateNotifications = () => {
    const notifications = [];
    let id = 1;

    // Clock-in reminders - 30 minutes before shift
    if (shifts && Array.isArray(shifts) && shifts.length > 0) {
      shifts.forEach((shift: any) => {
        const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
        const now = new Date();
        const timeDiff = shiftStart.getTime() - now.getTime();
        const minutesUntilShift = Math.floor(timeDiff / (1000 * 60));

        if (minutesUntilShift <= 30 && minutesUntilShift > 0) {
          const notificationId = id++;
          notifications.push({
            id: notificationId,
            type: "clock_in_reminder",
            title: "Clock-In Reminder",
            message: `Your shift starts in ${minutesUntilShift} minutes at ${shift.startTime}. Don't forget to clock in!`,
            fullDetails: `Shift: ${shift.name}\nStart Time: ${shift.startTime}\nEnd Time: ${shift.endTime}\nDate: ${shift.date}\n\nPlease make sure to clock in on time to avoid any attendance issues.`,
            timestamp: "Now",
            isRead: readNotifications.has(notificationId),
            priority: "high"
          });
        }
      });
    }

    // User Notifications (welcome, system notifications, etc.)
    if (userNotifications && Array.isArray(userNotifications) && userNotifications.length > 0) {
      userNotifications.forEach((notification: any) => {
        const createdDate = new Date(notification.createdAt);
        const timeAgo = getTimeAgo(createdDate);
        const notificationId = id++;
        
        notifications.push({
          id: notificationId,
          type: notification.type || "system",
          title: notification.title || "System Notification",
          message: notification.message || "New notification available",
          fullDetails: notification.fullDetails || `${notification.title || "Notification"}\n\nDate: ${createdDate.toLocaleDateString()}\nTime: ${createdDate.toLocaleTimeString()}\n\n${notification.message || "No details available"}`,
          timestamp: timeAgo,
          isRead: notification.isRead || readNotifications.has(notificationId),
          priority: notification.priority || "medium",
          originalId: notification.id // Store original notification ID for marking as read
        });
      });
    }

    // Announcements
    if (announcements && Array.isArray(announcements) && announcements.length > 0) {
      announcements.forEach((announcement: any) => {
        const createdDate = new Date(announcement.createdAt);
        const timeAgo = getTimeAgo(createdDate);
        const notificationId = id++;
        
        notifications.push({
          id: notificationId,
          type: "announcement",
          title: announcement.title || "New Announcement",
          message: announcement.content || announcement.message || "New announcement available",
          fullDetails: `${announcement.title || "Announcement"}\n\nDate: ${createdDate.toLocaleDateString()}\nTime: ${createdDate.toLocaleTimeString()}\n\n${announcement.content || announcement.message || "No details available"}`,
          timestamp: timeAgo,
          isRead: readNotifications.has(notificationId),
          priority: announcement.priority || "medium"
        });
      });
    }

    // Approval notifications
    if (pendingApprovals && typeof pendingApprovals === 'object') {
      const approvals = pendingApprovals as any;
      
      if (approvals.pendingLeave > 0) {
        const notificationId = id++;
        notifications.push({
          id: notificationId,
          type: "leave_approval",
          title: "Leave Request Pending",
          message: `You have ${approvals.pendingLeave} leave request(s) pending approval.`,
          fullDetails: `Leave Request Status\n\nPending Requests: ${approvals.pendingLeave}\nStatus: Waiting for approval\n\nYour leave request is currently being reviewed by your supervisor. You will be notified once a decision is made.\n\nTo check the status or make changes, please visit the My Records section.`,
          timestamp: "Recent",
          isRead: readNotifications.has(notificationId),
          priority: "medium"
        });
      }

      if (approvals.pendingClaim > 0) {
        const notificationId = id++;
        notifications.push({
          id: notificationId,
          type: "claim_approval",
          title: "Claim Request Pending",
          message: `You have ${approvals.pendingClaim} claim request(s) pending approval.`,
          fullDetails: `Claim Request Status\n\nPending Requests: ${approvals.pendingClaim}\nStatus: Waiting for approval\n\nYour expense claim is currently being reviewed by the finance team. You will be notified once a decision is made.\n\nTo check the status or upload additional documents, please visit the My Records section.`,
          timestamp: "Recent",
          isRead: readNotifications.has(notificationId),
          priority: "medium"
        });
      }

      if (approvals.pendingOvertime > 0) {
        const notificationId = id++;
        notifications.push({
          id: notificationId,
          type: "overtime_approval",
          title: "Overtime Request Pending",
          message: `You have ${approvals.pendingOvertime} overtime request(s) pending approval.`,
          fullDetails: `Overtime Request Status\n\nPending Requests: ${approvals.pendingOvertime}\nStatus: Waiting for approval\n\nYour overtime request is currently being reviewed by your supervisor. You will be notified once a decision is made.\n\nTo check the status or make changes, please visit the My Records section.`,
          timestamp: "Recent",
          isRead: readNotifications.has(notificationId),
          priority: "medium"
        });
      }
    }

    // Payslip notifications - last 3 generated payslips
    if (userPayslips && Array.isArray(userPayslips) && userPayslips.length > 0) {
      userPayslips.slice(0, 3).forEach((payslip: any) => {
        const generatedDate = new Date(payslip.generatedAt || payslip.createdAt);
        const timeAgo = getTimeAgo(generatedDate);
        const notificationId = id++;
        
        notifications.push({
          id: notificationId,
          type: "payslip_ready",
          title: "Payslip Available",
          message: `Your ${payslip.month}/${payslip.year} payslip is ready for download.`,
          fullDetails: `Payslip Ready for Download\n\nMonth: ${payslip.month}/${payslip.year}\nStatus: ${payslip.status}\nGenerated: ${generatedDate.toLocaleDateString()}\n\nGross Pay: RM ${payslip.grossPay || '0.00'}\nNet Pay: RM ${payslip.netPay || '0.00'}\nTotal Deductions: RM ${payslip.totalDeductions || '0.00'}\n\nYour payslip is now available for download. Please visit the Payroll section to download your payslip in PDF or Excel format.`,
          timestamp: timeAgo,
          isRead: readNotifications.has(notificationId),
          priority: "high"
        });
      });
    }

    return notifications;
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const notifications = generateNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "clock_in_reminder":
        return <Clock className="w-4 h-4 text-red-500" />;
      case "announcement":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "welcome":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "reminder":
        return <Bell className="w-4 h-4 text-orange-500" />;
      case "system":
        return <Settings className="w-4 h-4 text-blue-500" />;
      case "approval":
        return <User className="w-4 h-4 text-purple-500" />;
      case "payslip":
        return <User className="w-4 h-4 text-green-500" />;
      case "leave_approval":
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case "claim_approval":
        return <User className="w-4 h-4 text-purple-500" />;
      case "overtime_approval":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "payslip_ready":
        return <User className="w-4 h-4 text-green-500" />;
      case "system_update":
        return <Settings className="w-4 h-4 text-gray-500" />;
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
              <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <PopoverTrigger asChild>
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
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0 mr-4" 
                  align="end"
                  data-testid="popover-notifications"
                >
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <h3 className="font-medium text-sm">Notifications</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {unreadCount} unread
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 px-4">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {notifications.map((notification, index) => (
                          <div key={notification.id} className="mb-2">
                            <div 
                              className={cn(
                                "p-3 rounded-lg border transition-colors hover:bg-gray-50 cursor-pointer",
                                notification.isRead 
                                  ? "bg-white border-gray-100" 
                                  : "bg-blue-50 border-blue-200"
                              )}
                              onClick={() => handleNotificationClick(notification)}
                              data-testid={`notification-item-${notification.id}`}
                            >
                              <div className="flex items-start gap-2">
                                {getNotificationIcon(notification.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <h4 className={cn(
                                      "text-xs font-medium truncate",
                                      !notification.isRead && "text-blue-900"
                                    )}>
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                      {notification.timestamp}
                                    </span>
                                    <span className={cn(
                                      "px-1.5 py-0.5 text-xs rounded-full border",
                                      getPriorityColor(notification.priority)
                                    )}>
                                      {notification.priority}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="border-t p-3 flex justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                      data-testid="button-mark-all-read"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark All Read
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-xs"
                      data-testid="button-close-notifications"
                    >
                      Close
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              

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

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNotification && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {selectedNotification.timestamp}
                  </span>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full border",
                    getPriorityColor(selectedNotification.priority)
                  )}>
                    {selectedNotification.priority} priority
                  </span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-gray-800">
                    {selectedNotification.message}
                  </p>
                  
                  {selectedNotification.fullDetails && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Details:</h4>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                        {selectedNotification.fullDetails}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedNotification(null)}
                    data-testid="button-close-notification-dialog"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardLayout;