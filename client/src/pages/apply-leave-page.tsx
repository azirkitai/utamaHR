import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  // Fetch active leave policies from database
  const { data: activeLeaveTypes = [], isLoading: isLoadingLeaveTypes } = useQuery<string[]>({
    queryKey: ["/api/active-leave-policies"],
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [applicant, setApplicant] = useState("SITI NADIAH SABRI");
  const [reason, setReason] = useState("");
  const [startDayType, setStartDayType] = useState("Full Day");
  const [endDayType, setEndDayType] = useState("Full Day");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

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
    // Handle form submission
    console.log({
      applicant,
      leaveType,
      startDate,
      endDate,
      startDayType,
      endDayType,
      reason,
      uploadedFile,
      totalDays: calculateTotalDays()
    });
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
                    <h3 className="font-semibold text-gray-900">Pending Applications</h3>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {pendingApplications.length} Pending
                    </Badge>
                  </div>
                  
                  {pendingApplications.length > 0 ? (
                    pendingApplications.map((app) => (
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
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
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
                      No pending applications found
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
              {/* Applicant */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Applicant</Label>
                <Select value={applicant} onValueChange={setApplicant}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SITI NADIAH SABRI">SITI NADIAH SABRI</SelectItem>
                    <SelectItem value="AHMAD ALI BIN HASSAN">AHMAD ALI BIN HASSAN</SelectItem>
                    <SelectItem value="FARAH DIANA BINTI MOHD">FARAH DIANA BINTI MOHD</SelectItem>
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
                disabled={!startDate || !endDate || !leaveType}
              >
                Apply Now
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