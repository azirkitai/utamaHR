import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Upload,
  ExternalLink,
  MoreHorizontal 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Dummy data for pending leave applications
const pendingApplications = [
  {
    id: 1,
    applicant: "SITI NADIAH SABRI",
    leaveType: "Annual Leave",
    startDate: "2025-08-10",
    endDate: "2025-08-12",
    startDayType: "Full Day",
    endDayType: "Full Day",
    totalDays: 3,
    reason: "Family vacation",
    status: "Pending",
    appliedDate: "2025-08-05"
  },
  {
    id: 2,
    applicant: "AHMAD ALI BIN HASSAN",
    leaveType: "Medical Leave",
    startDate: "2025-08-15",
    endDate: "2025-08-15",
    startDayType: "Half Day",
    endDayType: "Half Day",
    totalDays: 0.5,
    reason: "Medical checkup",
    status: "Pending",
    appliedDate: "2025-08-07"
  },
  {
    id: 3,
    applicant: "FARAH DIANA BINTI MOHD",
    leaveType: "Compassionate Leave - Maternity",
    startDate: "2025-08-20",
    endDate: "2025-08-22",
    startDayType: "Full Day",
    endDayType: "Half Day",
    totalDays: 2.5,
    reason: "Maternity related appointment",
    status: "Pending",
    appliedDate: "2025-08-06"
  }
];

export default function ApplyLeavePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active leave policies from database
  const { data: activeLeaveTypes = [], isLoading: isLoadingLeaveTypes } = useQuery<string[]>({
    queryKey: ["/api/active-leave-policies"],
  });

  // Fetch all employees for role-based dropdown
  const { data: allEmployees = [] } = useQuery({
    queryKey: ["/api/employees"],
    enabled: !!user
  });

  // Fetch leave applications for pending view
  const { data: leaveApplications = [] } = useQuery({
    queryKey: ["/api/leave-applications"],
    enabled: !!user
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [applicant, setApplicant] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [reason, setReason] = useState("");
  const [startDayType, setStartDayType] = useState("Full Day");
  const [endDayType, setEndDayType] = useState("Full Day");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Check if user can select other employees (role-based)
  const canSelectOtherEmployees = user && (user as any).role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes((user as any).role);

  // Set default applicant based on role and employee data
  useEffect(() => {
    if (user && allEmployees && (allEmployees as any[]).length > 0 && !selectedEmployeeId) {
      if (canSelectOtherEmployees) {
        // Admin roles can select any employee, default to first employee
        const firstEmployee = (allEmployees as any[])[0];
        setApplicant(firstEmployee?.fullName || "");
        setSelectedEmployeeId(firstEmployee?.id || "");
      } else {
        // Regular users can only apply for themselves
        const currentEmployee = (allEmployees as any[]).find((emp: any) => emp.userId === user.id);
        if (currentEmployee) {
          setApplicant(currentEmployee.fullName);
          setSelectedEmployeeId(currentEmployee.id);
        }
      }
    }
  }, [user, allEmployees, canSelectOtherEmployees, selectedEmployeeId]);

  // Create leave application mutation
  const createLeaveApplicationMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      console.log("Frontend: Sending leave application data:", leaveData);
      try {
        const response = await apiRequest("POST", "/api/leave-applications", leaveData);
        console.log("Frontend: Leave application response:", response);
        return await response.json();
      } catch (error) {
        console.error("Frontend: Leave application error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Permohonan cuti telah dihantar",
      });
      // Reset form
      setStartDate("");
      setEndDate("");
      setLeaveType("");
      setReason("");
      setStartDayType("Full Day");
      setEndDayType("Full Day");
      setUploadedFile(null);
      // Keep selected employee for ease of use
      // Refresh leave applications
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal menghantar permohonan cuti",
        variant: "destructive",
      });
    },
  });

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  const daysInMonth = lastDayOfMonth.getDate();
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  // Calculate total days
  const calculateTotalDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Adjust for half days
    if (startDayType === "Half Day" && endDayType === "Half Day") {
      diffDays = diffDays - 1; // Both are half days
    } else if (startDayType === "Half Day" || endDayType === "Half Day") {
      diffDays = diffDays - 0.5; // One is half day
    }
    
    return diffDays;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }
    
    return days;
  };

  // Helper function to check if a date is within the selected range
  const isDateInRange = (dateInfo: { day: number; isCurrentMonth: boolean }) => {
    if (!startDate || !endDate || !dateInfo.isCurrentMonth) return false;
    
    const currentDate = new Date(year, month, dateInfo.day);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return currentDate >= start && currentDate <= end;
  };

  // Helper function to check if a date is the start or end date
  const isStartOrEndDate = (dateInfo: { day: number; isCurrentMonth: boolean }) => {
    if (!dateInfo.isCurrentMonth) return false;
    
    const isStart = startDate && new Date(startDate).getDate() === dateInfo.day;
    const isEnd = endDate && new Date(endDate).getDate() === dateInfo.day;
    
    return isStart || isEnd;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleApply = () => {
    if (!leaveType || !startDate || !endDate || !reason || !selectedEmployeeId) {
      toast({
        title: "Ralat",
        description: "Sila lengkapkan semua maklumat yang diperlukan",
        variant: "destructive",
      });
      return;
    }

    const leaveData = {
      employeeId: selectedEmployeeId,
      applicant: applicant,
      leaveType: leaveType,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      startDayType: startDayType,
      endDayType: endDayType,
      totalDays: calculateTotalDays().toString(),
      reason: reason,
      supportingDocument: uploadedFile?.name || null,
    };

    createLeaveApplicationMutation.mutate(leaveData);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Apply for Leave</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Home</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Leave</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Apply</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6">
          {/* Available Leave Banner */}
          <div className="bg-gradient-to-r from-teal-400 to-blue-600 text-white p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Available Leave</h2>
                <p className="text-teal-100">Track your remaining leave days</p>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                See More <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {months[month]} {year}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="flex border rounded-md">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn("text-xs", viewMode === "list" ? "bg-gray-100" : "")}
                      onClick={() => setViewMode("list")}
                    >
                      list
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn("text-xs", viewMode === "calendar" ? "bg-gray-100" : "")}
                      onClick={() => setViewMode("calendar")}
                    >
                      month
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "calendar" ? (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {daysOfWeek.map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {generateCalendarDays().map((dateInfo, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-12 flex items-center justify-center text-sm cursor-pointer rounded-md",
                          dateInfo.isCurrentMonth 
                            ? "text-gray-900 hover:bg-blue-50" 
                            : "text-gray-400",
                          // Highlight start and end dates
                          isStartOrEndDate(dateInfo)
                            ? "bg-blue-600 text-white"
                            : "",
                          // Highlight dates in range with lighter blue
                          isDateInRange(dateInfo) && !isStartOrEndDate(dateInfo)
                            ? "bg-blue-200 text-blue-800"
                            : ""
                        )}
                        onClick={() => {
                          if (dateInfo.isCurrentMonth) {
                            const clickedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateInfo.day).padStart(2, '0')}`;
                            if (!startDate || (startDate && endDate)) {
                              setStartDate(clickedDate);
                              setEndDate("");
                            } else if (startDate && !endDate) {
                              if (new Date(clickedDate) >= new Date(startDate)) {
                                setEndDate(clickedDate);
                              } else {
                                setEndDate(startDate);
                                setStartDate(clickedDate);
                              }
                            }
                          }
                        }}
                      >
                        {dateInfo.day}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                // List view for pending applications
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Leave Applications</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {(leaveApplications as any[])?.length || 0} Applications
                    </Badge>
                  </div>
                  
                  {(leaveApplications as any[])?.length > 0 ? (
                    (leaveApplications as any[]).map((app: any) => (
                      <div key={app.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {app.applicant.split(' ')[0][0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{app.applicant}</p>
                              <p className="text-sm text-gray-500">{app.leaveType}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              app.status === "Pending" ? "border-yellow-500 text-yellow-700" :
                              app.status === "Approved" ? "border-green-500 text-green-700" :
                              app.status === "Rejected" ? "border-red-500 text-red-700" :
                              "border-gray-500 text-gray-700"
                            )}
                          >
                            {app.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Start:</span>
                            <p className="font-medium">{new Date(app.startDate).toLocaleDateString()} ({app.startDayType})</p>
                          </div>
                          <div>
                            <span className="text-gray-500">End:</span>
                            <p className="font-medium">{new Date(app.endDate).toLocaleDateString()} ({app.endDayType})</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Days:</span>
                            <p className="font-medium">{app.totalDays} day{app.totalDays !== 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Applied:</span>
                            <p className="font-medium">{new Date(app.appliedDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm">Reason:</span>
                          <p className="text-sm text-gray-700 mt-1">{app.reason}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No leave applications found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Right Sidebar - Apply Leave Form */}
          <div className="w-80 p-6 bg-white border-l">
          <Card>
            <CardHeader className="bg-slate-600 text-white rounded-t-lg">
              <CardTitle className="text-center">Apply Leave</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Applicant - Role Based */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Applicant</Label>
                <Select 
                  value={selectedEmployeeId} 
                  onValueChange={(value) => {
                    setSelectedEmployeeId(value);
                    const selectedEmployee = (allEmployees as any[]).find((emp: any) => emp.id === value);
                    setApplicant(selectedEmployee?.fullName || "");
                  }}
                  disabled={!canSelectOtherEmployees && allEmployees.length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih pekerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {canSelectOtherEmployees ? (
                      // Admin roles can see all employees
                      (allEmployees as any[]).map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </SelectItem>
                      ))
                    ) : (
                      // Regular users can only see themselves
                      (allEmployees as any[])
                        .filter((emp: any) => emp.userId === user?.id)
                        .map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName}
                          </SelectItem>
                        ))
                    )}
                    {(allEmployees as any[]).length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No employees found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Categories</Label>
                <Select value={leaveType} onValueChange={setLeaveType} disabled={isLoadingLeaveTypes}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={isLoadingLeaveTypes ? "Loading..." : "Select leave type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLeaveTypes.length > 0 ? (
                      activeLeaveTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No active leave policies found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Start</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={startDayType} onValueChange={setStartDayType}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Day">Full Day</SelectItem>
                      <SelectItem value="Half Day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Finish</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={endDayType} onValueChange={setEndDayType}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Day">Full Day</SelectItem>
                      <SelectItem value="Half Day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Total Days */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Total Day(s)</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                  <span className="text-lg font-semibold">{calculateTotalDays()}</span>
                  <p className="text-xs text-gray-500 mt-1">You currently not select leave</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-sm font-medium text-gray-700">What is/are your reason?</Label>
                <Textarea
                  placeholder="Please specify your reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>

              {/* Supporting Document */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Supporting document</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="relative">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose file
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  <span className="text-sm text-gray-500">
                    {uploadedFile ? uploadedFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {/* Apply Button */}
              <Button 
                onClick={handleApply}
                className="w-full bg-slate-600 hover:bg-slate-700"
                disabled={!startDate || !endDate || !leaveType || !selectedEmployeeId || createLeaveApplicationMutation.isPending}
              >
                {createLeaveApplicationMutation.isPending ? "Submitting..." : "Apply Now"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Leave Application */}
          <Card className="mt-6">
            <CardHeader className="bg-teal-400 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Leave Application</CardTitle>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center text-gray-500 text-sm py-8">
                No recent applications
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}