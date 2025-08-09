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
  Download
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import utamaMedgroupImage from "@assets/PANEL KLINIK UTAMA_1754579785517.png";

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

const weeklyData = [
  { day: 'Mon', clockIn: 8, onLeave: 2 },
  { day: 'Tue', clockIn: 9, onLeave: 1 },
  { day: 'Wed', clockIn: 8, onLeave: 2 },
  { day: 'Thu', clockIn: 10, onLeave: 0 },
  { day: 'Fri', clockIn: 7, onLeave: 3 },
];

export default function DashboardHome() {
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

  const userName = dashboardData?.user?.username || 'SITI NADIAH SABRI';

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
        <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
                  Hey,
                </h1>
                <h2 className="text-4xl font-bold text-cyan-100 mb-2">
                  {getGreeting()}
                </h2>
                <h3 className="text-2xl font-semibold mb-4">
                  {userName.toUpperCase()}!
                </h3>
                <p className="text-cyan-100 text-lg">
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

        {/* Today Statistics */}
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
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2" data-testid="total-clock-ins">
                      {dashboardStats?.totalClockIns || 0}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-xs text-gray-500">Clock In</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2" data-testid="total-on-leave">
                      {dashboardStats?.totalOnLeave || 0}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-xs text-gray-500">On Leave</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
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

        {/* Your Statistic */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-[#07A3B2] to-[#D9ECC7] text-white rounded-t-lg">
            <CardTitle className="text-xl font-semibold">Your Statistic</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2" data-testid="stat-leave-approved">
                    {userStats?.leaveApproved || 0}
                  </div>
                  <div className="text-sm text-gray-600">Leave Approved</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-md transition-shadow">
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

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-md transition-shadow">
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

        {/* Pending Approval */}
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-800">Team Calendar</CardTitle>
                <p className="text-sm text-gray-600">03 Aug - 09 Aug 2025</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Mon 8/4', 'Tue 8/5', 'Wed 8/6', 'Thu 8/7', 'Fri 8/8', 'Sat 8/9', 'Sun 8/10'].map((day) => (
                  <div key={day} className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2">{day}</div>
                    <div className="h-20 bg-yellow-50 rounded border border-yellow-200"></div>
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
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">31 Aug 2025</div>
                      <div className="text-xs text-gray-600">WUJUD</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Who's off This Week */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg text-gray-800">Who's off This Week</CardTitle>
                <Button variant="link" size="sm" className="text-cyan-600">See More</Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">All present today</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}