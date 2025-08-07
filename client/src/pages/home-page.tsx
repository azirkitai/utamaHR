import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  CheckCircle, 
  CalendarX, 
  UserPlus, 
  Menu,
  Bell,
  ChevronDown,
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  Calendar,
  DollarSign,
  FileText,
  Award,
  AlertTriangle,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", icon: BarChart3, href: "#", active: true },
  { name: "Employees", icon: Users, href: "#", active: false },
  { name: "Attendance", icon: Calendar, href: "#", active: false },
  { name: "Payroll", icon: DollarSign, href: "#", active: false },
  { name: "Reports", icon: FileText, href: "#", active: false },
  { name: "Settings", icon: Settings, href: "#", active: false },
];

const metrics = [
  {
    title: "Total Employees",
    value: "247",
    change: "+5.2% from last month",
    changeType: "positive" as const,
    icon: Users,
    color: "bg-blue-100 text-primary",
  },
  {
    title: "Present Today", 
    value: "234",
    change: "94.7% attendance rate",
    changeType: "positive" as const,
    icon: CheckCircle,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "On Leave",
    value: "8", 
    change: "3 sick, 5 vacation",
    changeType: "neutral" as const,
    icon: CalendarX,
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "New Hires",
    value: "12",
    change: "This month",
    changeType: "neutral" as const,
    icon: UserPlus,
    color: "bg-purple-100 text-purple-600",
  },
];

const recentActivities = [
  {
    id: 1,
    type: "user-plus",
    title: "Sarah Wilson joined the Marketing department",
    time: "2 hours ago",
    icon: UserPlus,
    color: "bg-green-100 text-green-600",
  },
  {
    id: 2,
    type: "calendar-check", 
    title: "Mike Johnson submitted leave request for next week",
    time: "4 hours ago",
    icon: Calendar,
    color: "bg-blue-100 text-primary",
  },
  {
    id: 3,
    type: "alert",
    title: "System Alert: 3 employees have pending timesheet approvals", 
    time: "6 hours ago",
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: 4,
    type: "award",
    title: "Emma Davis completed certification in Project Management",
    time: "1 day ago", 
    icon: Award,
    color: "bg-purple-100 text-purple-600",
  },
];

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 bg-primary text-white">
        <div className="flex items-center">
          <Users className="h-6 w-6 mr-2" />
          <span className="text-lg font-semibold">HR System</span>
        </div>
      </div>
      
      <nav className="mt-8 flex-1">
        <div className="px-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              data-testid={`nav-${item.name.toLowerCase()}`}
              className={cn(
                "w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                item.active
                  ? "bg-blue-50 text-primary"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-white shadow-lg">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden mr-4"
                    data-testid="button-sidebar-toggle"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              <h1 className="text-2xl font-semibold text-gray-800" data-testid="text-page-title">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  3
                </Badge>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white text-sm font-medium">
                        {user ? getUserInitials(user.username) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block font-medium" data-testid="text-username">
                      {user?.username || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem data-testid="menu-profile">
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-settings">
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    data-testid="button-logout"
                  >
                    {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <Card key={index} className="border-gray-100" data-testid={`card-metric-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium" data-testid={`text-metric-title-${index}`}>
                        {metric.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-800 mt-2" data-testid={`text-metric-value-${index}`}>
                        {metric.value}
                      </p>
                      <p className={cn(
                        "text-sm mt-2 flex items-center",
                        metric.changeType === "positive" ? "text-green-600" :
                        metric.changeType === "negative" ? "text-red-600" :
                        "text-gray-500"
                      )} data-testid={`text-metric-change-${index}`}>
                        {metric.changeType === "positive" && <TrendingUp className="h-4 w-4 mr-1" />}
                        {metric.change}
                      </p>
                    </div>
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", metric.color)}>
                      <metric.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-gray-100" data-testid="card-attendance-chart">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Weekly Attendance
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">Weekly Attendance Chart</p>
                    <p className="text-sm">Chart visualization will be implemented</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100" data-testid="card-department-chart">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Department Distribution
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">Department Distribution</p>
                    <p className="text-sm">Chart visualization will be implemented</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-gray-100" data-testid="card-recent-activities">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Recent Activities
                </CardTitle>
                <Button variant="ghost" className="text-primary hover:text-blue-700 text-sm font-medium">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4" data-testid={`activity-${activity.id}`}>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", activity.color)}>
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800" data-testid={`activity-title-${activity.id}`}>
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1" data-testid={`activity-time-${activity.id}`}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
