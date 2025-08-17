import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Clock,
  UserCheck,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import utamaMedgroupImage from "@assets/PANEL KLINIK UTAMA_1755445660449.png";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DashboardData {
  message: string;
  user: {
    id: string;
    username: string;
  };
  timestamp: string;
}

// Custom fetch function dengan JWT token
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem("utamahr_token");
  if (!token) {
    throw new Error("Token tidak ditemui");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("utamahr_token");
      window.location.href = "/auth";
      throw new Error("Token tidak sah");
    }
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

interface EmployeeStats {
  activeCount: number;
  resignedCount: number;
  totalCount: number;
}

interface LeaveApplication {
  id: string;
  employeeId: string;
  applicant: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'First Level Approved';
  reason: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  time?: string;
  selectedEmployee?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  isPublic: boolean;
}

const weeklyData = [
  { day: 'Mon', clockIn: 8, onLeave: 2 },
  { day: 'Tue', clockIn: 9, onLeave: 1 },
  { day: 'Wed', clockIn: 8, onLeave: 2 },
  { day: 'Thu', clockIn: 10, onLeave: 0 },
  { day: 'Fri', clockIn: 7, onLeave: 3 },
];

export default function DashboardHome() {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // August 2025
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [selectedDateLeaves, setSelectedDateLeaves] = useState<LeaveApplication[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: () => authenticatedFetch("/api/dashboard"),
  });

  // Query untuk employee statistics
  const { data: employeeStats, isLoading: isStatsLoading } = useQuery<EmployeeStats>({
    queryKey: ["/api/employee-statistics"],
    queryFn: () => authenticatedFetch('/api/employee-statistics'),
  });

  // Query untuk dashboard statistics (clock in, leave data)
  const { data: dashboardStats, isLoading: isDashboardStatsLoading } = useQuery<{
    totalClockIns: number;
    totalOnLeave: number;
    totalLeaveApproved: number;
  }>({
    queryKey: ["/api/dashboard-statistics"],
    queryFn: () => authenticatedFetch('/api/dashboard-statistics'),
  });

  // Query untuk user statistics (personal stats)
  const { data: userStats, isLoading: isUserStatsLoading } = useQuery<{
    leaveApproved: number;
    claimApproved: number;
    overtimeApproved: number;
    payrollRecord: number;
    paymentVoucher: number;
  }>({
    queryKey: ["/api/user-statistics"],
    queryFn: () => authenticatedFetch('/api/user-statistics'),
  });

  // Query untuk pending approval statistics  
  const { data: pendingStats, isLoading: isPendingStatsLoading } = useQuery<{
    pendingLeave: number;
    pendingClaim: number;
    pendingOvertime: number;
    pendingPayroll: number;
    pendingVoucher: number;
  }>({
    queryKey: ["/api/pending-approval-statistics"],
    queryFn: () => authenticatedFetch('/api/pending-approval-statistics'),
  });

  // Fetch all leave applications for calendar display
  const { data: allLeaveApplications = [] } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/all-for-calendar"],
    queryFn: () => authenticatedFetch('/api/leave-applications/all-for-calendar'),
  });

  // Fetch events for calendar
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => authenticatedFetch('/api/events'),
  });

  // Fetch holidays for calendar
  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays"],
    queryFn: () => authenticatedFetch('/api/holidays'),
  });

  // Fetch unread announcements
  const { data: unreadAnnouncements = [], refetch: refetchUnreadAnnouncements } = useQuery<any[]>({
    queryKey: ["/api/announcements/unread"],
    queryFn: () => authenticatedFetch('/api/announcements/unread'),
  });

  // Convert statistics to pie chart format
  const employeeData = employeeStats ? [
    { name: 'Active', value: employeeStats.activeCount, color: '#0891b2' },
    { name: 'Resign', value: employeeStats.resignedCount, color: '#94a3b8' }
  ] : [
    { name: 'Active', value: 0, color: '#0891b2' },
    { name: 'Resign', value: 0, color: '#94a3b8' }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Helper function to get upcoming leave dates
  const getUpcomingLeaveDates = () => {
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return allLeaveApplications
      .filter(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        return (leave.status === 'Approved' || leave.status === 'Pending' || leave.status === 'First Level Approved') &&
               startDate <= oneWeekFromNow && endDate >= today;
      })
      .slice(0, 5); // Show only 5 upcoming leave dates
  };

  // Calendar helper functions
  const getEventsForDate = (date: number) => {
    if (!events || events.length === 0) return [];
    
    const filteredEvents = events.filter(event => {
      // Parse event dates as strings in YYYY-MM-DD format
      const eventStartParts = event.startDate.split('-');
      const eventEndParts = (event.endDate || event.startDate).split('-');
      
      const eventStartYear = parseInt(eventStartParts[0]);
      const eventStartMonth = parseInt(eventStartParts[1]) - 1; // Month is 0-indexed
      const eventStartDate = parseInt(eventStartParts[2]);
      
      const eventEndYear = parseInt(eventEndParts[0]);
      const eventEndMonth = parseInt(eventEndParts[1]) - 1; // Month is 0-indexed
      const eventEndDate = parseInt(eventEndParts[2]);
      
      // Check if the calendar date falls within the event date range
      const calendarYear = currentDate.getFullYear();
      const calendarMonth = currentDate.getMonth();
      const calendarDate = date;
      
      // Compare year, month, and date
      const isAfterStart = (calendarYear > eventStartYear) || 
                          (calendarYear === eventStartYear && calendarMonth > eventStartMonth) ||
                          (calendarYear === eventStartYear && calendarMonth === eventStartMonth && calendarDate >= eventStartDate);
      
      const isBeforeEnd = (calendarYear < eventEndYear) || 
                         (calendarYear === eventEndYear && calendarMonth < eventEndMonth) ||
                         (calendarYear === eventEndYear && calendarMonth === eventEndMonth && calendarDate <= eventEndDate);
      
      return isAfterStart && isBeforeEnd;
    });
    
    return filteredEvents;
  };

  const getHolidayForDate = (date: number) => {
    const targetDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return holidays.find(holiday => holiday.date === targetDateStr);
  };

  const getLeavesForDate = (date: number) => {
    if (!allLeaveApplications || allLeaveApplications.length === 0) return [];
    
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    
    return allLeaveApplications.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Set time to 00:00:00 for accurate date comparison
      const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return targetDateOnly >= startDateOnly && targetDateOnly <= endDateOnly;
    });
  };

  // Calendar click handlers
  const handleEventClick = (events: Event[]) => {
    if (events.length > 0) {
      setSelectedEvents(events);
      setIsEventModalOpen(true);
    }
  };

  const handleHolidayClick = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsHolidayModalOpen(true);
  };

  const handleLeaveClick = (leaves: LeaveApplication[]) => {
    if (leaves.length > 0) {
      setSelectedDateLeaves(leaves);
      setIsLeaveModalOpen(true);
    }
  };

  // Generate calendar days for current month view (mini calendar)
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isOtherMonth: true });
    }

    // Add days of the current month
    for (let date = 1; date <= daysInMonth; date++) {
      const isToday = year === today.getFullYear() && 
                     month === today.getMonth() && 
                     date === today.getDate();
      
      days.push({ 
        date, 
        isOtherMonth: false, 
        isToday,
        events: getEventsForDate(date),
        holiday: getHolidayForDate(date),
        leaves: getLeavesForDate(date)
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Get current user's employee data for fullName
  const { data: currentEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
    queryFn: () => authenticatedFetch("/api/user/employee"),
    enabled: !!dashboardData?.user?.id,
  });

  const userName = currentEmployee?.fullName || dashboardData?.user?.username || 'User';

  // Check if user has privileged access to view Today Statistic and Pending Approval cards
  const hasPrivilegedAccess = (dashboardData?.user as any)?.role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes((dashboardData?.user as any).role);
  
  // Debug log to check role
  console.log('Current user role:', (dashboardData?.user as any)?.role);
  console.log('Has privileged access:', hasPrivilegedAccess);

  if (isDashboardLoading || isStatsLoading || isDashboardStatsLoading || isUserStatsLoading || isPendingStatsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex justify-center items-center">
          <div>Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Hero Section */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 rounded-2xl p-8 text-white overflow-hidden pt-[4px] pb-[4px]">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="pt-[79px] pb-[79px] text-[48px] font-semibold">
                <h1 className="text-5xl font-bold mt-[-7px] mb-[-7px]" data-testid="text-welcome">
                  Hey,
                </h1>
                <h2 className="font-bold text-cyan-100 mt-[-4px] mb-[-4px] text-[56px]">
                  {getGreeting()}
                </h2>
                <h3 className="font-semibold text-[44px] mt-[-11px] mb-[-11px]">
                  {userName.toUpperCase()}!
                </h3>
                <p className="text-cyan-100 text-2xl">
                  We are delighted to have you here today.
                </p>
              </div>
              
              {/* UTAMA Medgroup Image */}
              <div className="min-w-[300px] flex justify-center items-center">
                <img 
                  src={utamaMedgroupImage} 
                  alt="UTAMA Medgroup - Panel Klinik" 
                  className="w-full max-w-sm h-auto object-contain"
                />
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Today Statistics - Only visible to privileged users */}
        {hasPrivilegedAccess && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Today Statistic</CardTitle>
              <p className="text-sm text-gray-600">Here's your employee statistic so far.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Pie Chart */}
              <div className="lg:col-span-1">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={employeeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {employeeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0891b2' }}></div>
                    <span className="text-xs text-gray-600">
                      Active ({employeeStats?.activeCount || 0}) - {employeeStats?.totalCount > 0 ? Math.round((employeeStats.activeCount / employeeStats.totalCount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#94a3b8' }}></div>
                    <span className="text-xs text-gray-600">
                      Resign ({employeeStats?.resignedCount || 0}) - {employeeStats?.totalCount > 0 ? Math.round((employeeStats.resignedCount / employeeStats.totalCount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="total-clock-ins">
                      {dashboardStats?.totalClockIns || 0}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-xs text-gray-500">Clock In</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-cyan-600 mb-2" data-testid="total-on-leave">
                      {dashboardStats?.totalOnLeave || 0}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-xs text-gray-500">On Leave</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2" data-testid="total-leave-approved">
                      {dashboardStats?.totalLeaveApproved || 0}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total Leave</div>
                    <div className="text-xs text-gray-500">Approved</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Your Statistic */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-t-lg">
            <CardTitle className="text-xl font-semibold">Your Statistic</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-cyan-600 mb-2" data-testid="stat-leave-approved">
                    {userStats?.leaveApproved || 0}
                  </div>
                  <div className="text-sm text-gray-600">Leave Approved</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="stat-claim-approved">
                    {userStats?.claimApproved || 0}
                  </div>
                  <div className="text-sm text-gray-600">Claim Approved</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2" data-testid="stat-overtime-approved">
                    {userStats?.overtimeApproved || 0}
                  </div>
                  <div className="text-sm text-gray-600">Overtime Approve</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2" data-testid="stat-payroll-record">
                    {userStats?.payrollRecord || 0}
                  </div>
                  <div className="text-sm text-gray-600">Payroll Record</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-2" data-testid="stat-payment-voucher">
                    {userStats?.paymentVoucher || 0}
                  </div>
                  <div className="text-sm text-gray-600">Payment Voucher</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval - Only visible to privileged users */}
        {hasPrivilegedAccess && (
          <Card>
            <CardHeader>
            <CardTitle className="text-xl text-gray-800">Pending Approval</CardTitle>
            <p className="text-sm text-gray-600">task(s) waiting for your action.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'Leave', icon: Calendar, count: pendingStats?.pendingLeave || 0 },
                { name: 'Claim', icon: FileText, count: pendingStats?.pendingClaim || 0 },
                { name: 'Overtime', icon: Clock, count: pendingStats?.pendingOvertime || 0 },
                { name: 'Payroll', icon: DollarSign, count: pendingStats?.pendingPayroll || 0 },
                { name: 'Voucher', icon: Users, count: pendingStats?.pendingVoucher || 0 }
              ].map((item) => (
                <Card key={item.name} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <item.icon className="w-8 h-8 text-cyan-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-800 mb-1" data-testid={`pending-${item.name.toLowerCase()}-count`}>
                      {item.count}
                    </div>
                    <div className="text-sm text-gray-600">{item.name}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Announcement Widget */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pengumuman
                {unreadAnnouncements.length > 0 && (
                  <Badge className="bg-red-500 text-white ml-2 animate-pulse">
                    {unreadAnnouncements.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {unreadAnnouncements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Tiada pengumuman baru</p>
                </div>
              ) : (
                unreadAnnouncements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-blue-900">{announcement.title}</h3>
                          <Badge className="bg-blue-500 text-white text-xs">BARU</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {announcement.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Dari: {announcement.announcerName}</span>
                          <span>{new Date(announcement.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await authenticatedFetch(`/api/announcements/${announcement.id}/acknowledge`, {
                              method: 'POST'
                            });
                            refetchUnreadAnnouncements();
                          } catch (error) {
                            console.error('Error acknowledging announcement:', error);
                          }
                        }}
                        className="text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        data-testid={`button-acknowledge-${announcement.id}`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Baca
                      </Button>
                    </div>
                  </div>
                ))
              )}
              
              {unreadAnnouncements.length > 3 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    +{unreadAnnouncements.length - 3} pengumuman lagi
                  </p>
                </div>
              )}
              
              <div className="text-center pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/announcement'}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  data-testid="button-view-all-announcements"
                >
                  Lihat Semua Pengumuman
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-800">Team Calendar</CardTitle>
                <p className="text-sm text-gray-600">{currentMonthName} {currentYear}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center py-2">
                    <div className="text-xs font-medium text-gray-600">{day}</div>
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <div key={index} className={cn(
                    "min-h-[80px] p-1 border border-gray-100 rounded relative",
                    day.isOtherMonth && "opacity-30",
                    day.isToday && "bg-blue-50 border-slate-200"
                  )}>
                    {day.date && (
                      <div className="text-xs font-medium text-gray-900 mb-1">
                        {day.date}
                      </div>
                    )}
                    
                    {/* Holiday indicator */}
                    {day.holiday && (
                      <div 
                        className="text-xs px-1 py-1 bg-red-100 text-red-800 rounded mb-1 truncate cursor-pointer hover:bg-red-200 transition-colors"
                        onClick={() => handleHolidayClick(day.holiday!)}
                        title={`Holiday: ${day.holiday.name} - Klik untuk maklumat lengkap`}
                      >
                        🏛️ {day.holiday.name.length > 8 ? day.holiday.name.substring(0, 8) + '...' : day.holiday.name}
                      </div>
                    )}

                    {/* Event indicators */}
                    {day.events && day.events.length > 0 && (
                      <div 
                        className="text-xs px-1 py-1 bg-green-100 text-green-800 rounded mb-1 truncate cursor-pointer hover:bg-green-200 transition-colors"
                        onClick={() => handleEventClick(day.events!)}
                        title={`Events: ${day.events!.map(e => e.title).join(', ')} - Klik untuk maklumat lengkap`}
                      >
                        📅 {day.events.length > 1 ? `${day.events.length} events` : day.events[0].title.length > 6 ? day.events[0].title.substring(0, 6) + '...' : day.events[0].title}
                      </div>
                    )}

                    {/* Leave indicators */}
                    {day.leaves && day.leaves.length > 0 && (
                      <div 
                        className="text-xs px-1 py-1 bg-yellow-100 text-yellow-800 rounded mb-1 truncate cursor-pointer hover:bg-yellow-200 transition-colors"
                        onClick={() => handleLeaveClick(day.leaves!)}
                        title={`Leaves: ${day.leaves!.map(l => l.applicant).join(', ')} - Klik untuk maklumat lengkap`}
                      >
                        🏖️ {day.leaves.length} leave{day.leaves.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Announcement */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg text-gray-800">Announcement</CardTitle>
                <Button variant="link" size="sm" className="text-cyan-600">See More</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">31 Aug 2025</div>
                      <div className="text-xs text-gray-600">WUJUD</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Calendar Widget */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Leave Calendar
                </CardTitle>
                <Button variant="link" size="sm" className="text-cyan-600">See More</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {getUpcomingLeaveDates().length === 0 ? (
                  <div className="text-sm text-gray-600">No upcoming leave this week</div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingLeaveDates().map((leave, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          leave.status === 'Approved' ? 'bg-green-500' :
                          leave.status === 'Pending' ? 'bg-yellow-500' :
                          leave.status === 'First Level Approved' ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800' :
                          'bg-red-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{leave.applicant}</div>
                          <div className="text-xs text-gray-600">
                            {new Date(leave.startDate).toLocaleDateString('en-GB')} - {new Date(leave.endDate).toLocaleDateString('en-GB')}
                          </div>
                          <div className="text-xs text-gray-500">{leave.leaveType}</div>
                        </div>
                        <Badge 
                          className={`text-xs ${
                            leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            leave.status === 'First Level Approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {leave.status === 'First Level Approved' ? 'Level 1' : leave.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Details Modal */}
        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent className="max-w-lg" aria-describedby="event-details-description">
            <DialogHeader>
              <DialogTitle>Maklumat Event</DialogTitle>
            </DialogHeader>
            <p id="event-details-description" className="sr-only">
              Details about the selected events.
            </p>
            
            <div className="space-y-4">
              {selectedEvents.map((event, index) => (
                <div key={event.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">📅</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-green-800">{event.title}</h3>
                      <p className="text-sm text-green-600">Event {index + 1}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Keterangan:</p>
                      <p className="text-base bg-white p-2 rounded border">{event.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tarikh Mula:</p>
                        <p className="text-base">{new Date(event.startDate).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tarikh Tamat:</p>
                        <p className="text-base">{new Date(event.endDate || event.startDate).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    
                    {event.time && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Masa:</p>
                        <p className="text-base">{event.time}</p>
                      </div>
                    )}
                    
                    {event.selectedEmployee && event.selectedEmployee !== "everyone" && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Kakitangan Terlibat:</p>
                        <p className="text-base">{event.selectedEmployee}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => setIsEventModalOpen(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-close-event-modal"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Holiday Details Modal */}
        <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
          <DialogContent className="max-w-md" aria-describedby="holiday-details-description">
            <DialogHeader>
              <DialogTitle>Maklumat Hari Kelepasan</DialogTitle>
            </DialogHeader>
            <p id="holiday-details-description" className="sr-only">
              Details about the selected holiday.
            </p>
            
            {selectedHoliday && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">🏛️</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-red-800">{selectedHoliday.name}</h3>
                      <p className="text-sm text-red-600">Hari Kelepasan Awam</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tarikh:</p>
                      <p className="text-base bg-white p-2 rounded border">
                        {new Date(selectedHoliday.date).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-close-holiday-modal"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave Details Modal */}
        <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="leave-details-description">
            <DialogHeader>
              <DialogTitle>Maklumat Cuti</DialogTitle>
            </DialogHeader>
            <p id="leave-details-description" className="sr-only">
              Details about leave applications for the selected date.
            </p>
            
            <div className="space-y-4">
              {selectedDateLeaves.map((leave) => (
                <div key={leave.id} className="flex items-start space-x-4 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">🏖️</div>
                      <div>
                        <h3 className="font-semibold text-lg text-yellow-800">{leave.applicant}</h3>
                        <p className="text-sm text-yellow-600">Permohonan Cuti</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Jenis Cuti:</p>
                        <p className="text-sm">{leave.leaveType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tempoh:</p>
                        <p className="text-sm">{leave.totalDays} hari</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tarikh Mula:</p>
                        <p className="text-sm">{new Date(leave.startDate).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tarikh Tamat:</p>
                        <p className="text-sm">{new Date(leave.endDate).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    
                    {leave.reason && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">Sebab:</p>
                        <p className="text-sm bg-white p-2 rounded">{leave.reason}</p>
                      </div>
                    )}
                  </div>
                  
                  <Badge 
                    className={cn(
                      "ml-4",
                      leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      leave.status === 'First Level Approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    )}
                  >
                    {leave.status === 'First Level Approved' ? 'Level 1 Approved' : leave.status}
                  </Badge>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                data-testid="button-close-leave-modal"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}