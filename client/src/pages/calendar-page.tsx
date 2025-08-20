import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight,
  Search,
  Plus,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Clock,
  Users,
  User,
  Save,
  Trash2,
  Calendar as CalendarIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface Holiday {
  id: string;
  name: string;
  date: string;
  isPublic: boolean;
  importToCalendar?: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  assignedEmployee: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  id: number;
  name: string;
  department: string;
  shifts: ShiftDay[];
}

interface ShiftDay {
  date: string;
  shift: string;
  type: 'Default Shift' | 'Off Day';
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

const predefinedHolidays: Holiday[] = [
  { id: "1", name: "Federal Territory Day (regional holiday)", date: "01-02-2025", isPublic: true, importToCalendar: true },
  { id: "2", name: "Harvest Festival (regional holiday)", date: "30-05-2025", isPublic: true, importToCalendar: true },
  { id: "3", name: "Valentine's Day", date: "14-02-2025", isPublic: true, importToCalendar: true },
  { id: "4", name: "Good Friday (regional holiday)", date: "18-04-2025", isPublic: true, importToCalendar: true },
  { id: "5", name: "Easter Sunday", date: "20-04-2025", isPublic: true, importToCalendar: true }
];

const employees: Employee[] = [
  {
    id: 1,
    name: "SITI NADIAH SABRI",
    department: "Human Resource",
    shifts: [
      { date: "4 M", shift: "Default Shift", type: "Default Shift" },
      { date: "5 T", shift: "Default Shift", type: "Default Shift" },
      { date: "6 W", shift: "Default Shift", type: "Default Shift" },
      { date: "7 T", shift: "Default Shift", type: "Default Shift" },
      { date: "8 F", shift: "Default Shift", type: "Default Shift" },
      { date: "9 S", shift: "Default Shift", type: "Default Shift" },
      { date: "10 S", shift: "Off Day", type: "Off Day" }
    ]
  },
  {
    id: 2,
    name: "madihah samsi",
    department: "Human Resource",
    shifts: [
      { date: "4 M", shift: "Default Shift", type: "Default Shift" },
      { date: "5 T", shift: "Default Shift", type: "Default Shift" },
      { date: "6 W", shift: "Default Shift", type: "Default Shift" },
      { date: "7 T", shift: "Default Shift", type: "Default Shift" },
      { date: "8 F", shift: "Default Shift", type: "Default Shift" },
      { date: "9 S", shift: "Default Shift", type: "Default Shift" },
      { date: "10 S", shift: "Off Day", type: "Off Day" }
    ]
  }
];

// Shift Compliance Cell Component
function ShiftComplianceCell({ employee, shift, date }: { employee: any; shift: any; date: Date }) {
  // Fetch attendance record for this employee on this date
  const { data: attendanceRecord } = useQuery({
    queryKey: [`/api/attendance-records/${employee.id}/${date.toISOString().split('T')[0]}`],
    enabled: !!employee.id,
  });

  // Check if shift compliance is enabled
  const isComplianceEnabled = shift.enableStrictClockIn;

  // Helper function to compare times
  const isTimeAfter = (time1: string, time2: string) => {
    if (!time1 || !time2) return false;
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);
    return hours1 > hours2 || (hours1 === hours2 && minutes1 > minutes2);
  };

  // Check compliance status
  const getComplianceStatus = () => {
    if (!isComplianceEnabled || !attendanceRecord) {
      return { isCompliant: true, remarks: [] };
    }

    const remarks = [];
    let isCompliant = true;

    // Check clock in compliance
    if (attendanceRecord.clockInTime && shift.clockIn) {
      const clockInTime = new Date(attendanceRecord.clockInTime).toTimeString().slice(0, 5);
      if (isTimeAfter(clockInTime, shift.clockIn)) {
        isCompliant = false;
        remarks.push(`Clock In Late: ${clockInTime} (Should be ${shift.clockIn})`);
      }
    }

    // Check break out compliance (only if break time is set and not "none")
    if (attendanceRecord.breakOutTime && shift.breakTimeOut && shift.breakTimeOut !== "none") {
      const breakOutTime = new Date(attendanceRecord.breakOutTime).toTimeString().slice(0, 5);
      if (isTimeAfter(breakOutTime, shift.breakTimeOut)) {
        isCompliant = false;
        remarks.push(`Break Out Late: ${breakOutTime} (Should be ${shift.breakTimeOut})`);
      }
    }

    return { isCompliant, remarks };
  };

  const complianceStatus = getComplianceStatus();

  return (
    <div 
      className={`px-3 py-2 rounded-lg text-xs font-medium text-white shadow-sm relative ${
        !complianceStatus.isCompliant ? 'ring-2 ring-red-400' : ''
      }`}
      style={{ backgroundColor: shift.color || '#3B82F6' }}
      title={`${shift.name} (${shift.startTime} - ${shift.endTime})${
        complianceStatus.remarks.length > 0 ? '\n\nCompliance Issues:\n' + complianceStatus.remarks.join('\n') : ''
      }`}
    >
      {/* Compliance warning indicator */}
      {!complianceStatus.isCompliant && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      )}
      
      <div className="font-semibold">{shift.name}</div>
      <div className="text-xs opacity-90">
        {shift.startTime}-{shift.endTime}
      </div>
      
      {/* Show compliance status */}
      {isComplianceEnabled && attendanceRecord && (
        <div className="mt-1 text-xs">
          {attendanceRecord.clockInTime && (
            <div className={`${
              attendanceRecord.isLateClockIn ? 'text-red-200 font-bold' : 'text-green-200'
            }`}>
              In: {new Date(attendanceRecord.clockInTime).toTimeString().slice(0, 5)}
              {attendanceRecord.isLateClockIn && ' ⚠️'}
            </div>
          )}
          {attendanceRecord.breakOutTime && (
            <div className={`${
              attendanceRecord.isLateBreakOut ? 'text-red-200 font-bold' : 'text-yellow-200'
            }`}>
              Break: {new Date(attendanceRecord.breakOutTime).toTimeString().slice(0, 5)}
              {attendanceRecord.isLateBreakOut && ' ⚠️'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Shift Calendar View Component (read-only version without edit button)
function ShiftCalendarView() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  // Get dates based on view mode
  const getDatesForView = (date: Date) => {
    if (viewMode === "week") {
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        weekDates.push(currentDate);
      }
      return weekDates;
    } else if (viewMode === "month") {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const monthDates = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        monthDates.push(currentDate);
      }
      return monthDates;
    }
    return [];
  };

  const viewDates = getDatesForView(currentWeek);

  const formatDateRange = () => {
    if (viewMode === "week") {
      const startDate = viewDates[0];
      const endDate = viewDates[6];
      
      const formatOptions: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric'
      };
      
      const start = startDate.toLocaleDateString('en-US', formatOptions);
      const end = endDate.toLocaleDateString('en-US', formatOptions);
      const year = endDate.getFullYear();
      
      return `${start} – ${end}, ${year}`;
    } else if (viewMode === "month") {
      const formatOptions: Intl.DateTimeFormatOptions = { 
        month: 'long', 
        year: 'numeric'
      };
      
      return currentWeek.toLocaleDateString('en-US', formatOptions);
    }
    return "";
  };

  const getDayHeaders = () => {
    if (viewMode === "week") {
      const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      return viewDates.map((date, index) => ({
        dayName: dayNames[index],
        dayNumber: date.getDate(),
        fullDate: date
      }));
    } else if (viewMode === "month") {
      return viewDates.map((date) => ({
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })[0], // Just first letter
        dayNumber: date.getDate(),
        fullDate: date
      }));
    }
    return [];
  };

  const navigateView = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    
    if (viewMode === "week") {
      newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === "month") {
      newDate.setMonth(currentWeek.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentWeek(newDate);
  };

  // Fetch data
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['/api/shifts'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time sync
  });

  const { data: employeeShifts = [] } = useQuery({
    queryKey: ['/api/employee-shifts'],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time sync
  });

  // Debug logging for employee shifts and shifts
  React.useEffect(() => {
    if (employeeShifts.length > 0) {
      console.log('=== EMPLOYEE SHIFTS DATA ===');
      console.log('Total employee shifts:', employeeShifts.length);
      console.log('Sample employee shifts:', employeeShifts.slice(0, 3));
    } else {
      console.log('No employee shifts found');
    }
  }, [employeeShifts]);

  React.useEffect(() => {
    if (shifts.length > 0) {
      console.log('=== SHIFTS DATA ===');
      console.log('Total shifts:', shifts.length);
      console.log('Sample shifts:', shifts.slice(0, 3));
    } else {
      console.log('No shifts found');
    }
  }, [shifts]);

  // Group employees by department
  const employeesByDepartment = employees.reduce((acc: any, employee: any) => {
    const dept = employee.employment?.department || 'No Department';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(employee);
    return acc;
  }, {});

  // Get shift assignment for employee on specific date
  const getShiftForEmployeeDate = (employeeId: string, date: Date) => {
    // Format date as YYYY-MM-DD to match database format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Debug logging
    console.log(`Looking for shift assignment for employee ${employeeId} on ${dateStr}`);
    
    const assignment = employeeShifts.find((es: any) => {
      // Handle both date formats - ensure we compare dates properly
      if (!es.assignedDate) return false;
      
      let esDateStr = es.assignedDate;
      if (typeof esDateStr === 'string' && esDateStr.includes('T')) {
        // If it's ISO format, extract just the date part
        esDateStr = esDateStr.split('T')[0];
      }
      
      const matches = es.employeeId === employeeId && esDateStr === dateStr;
      if (matches) {
        console.log(`Found assignment:`, es);
      }
      return matches;
    });
    
    if (assignment) {
      const shift = shifts.find((s: any) => s.id === assignment.shiftId);
      console.log(`Found shift for assignment ${assignment.shiftId}:`, shift);
      if (shift) {
        // Use shift's own color if available, otherwise use a default color
        const shiftWithColor = { 
          ...shift, 
          color: shift.color || assignment.color || '#3B82F6',
          startTime: shift.clockIn || shift.startTime,
          endTime: shift.clockOut || shift.endTime
        };
        console.log(`Final shift with color and times:`, {
          name: shiftWithColor.name,
          color: shiftWithColor.color,
          startTime: shiftWithColor.startTime,
          endTime: shiftWithColor.endTime
        });
        return shiftWithColor;
      }
    }
    return null;
  };

  const dayHeaders = getDayHeaders();

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-t-lg">
        <CardTitle>Shift Calendar</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateView('prev')}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-prev-view"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateView('next')}
              className="bg-black text-white hover:bg-gray-800"
              data-testid="button-next-view"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white hover:opacity-90"
              data-testid="button-today"
            >
              Today
            </Button>
          </div>

          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="text-xl font-bold text-gray-900 border-gray-300 hover:bg-gray-50 h-auto py-2 px-4"
                data-testid="button-date-picker"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentWeek}
                onSelect={(date) => {
                  if (date) {
                    setCurrentWeek(date);
                    setShowDatePicker(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
              className={viewMode === "week" ? "bg-black text-white" : ""}
              data-testid="button-week-view"
            >
              week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
              className={viewMode === "month" ? "bg-black text-white" : ""}
              data-testid="button-month-view"
            >
              month
            </Button>
          </div>
        </div>

        {/* Shift Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-800 bg-gray-50 min-w-[200px]">
                  Employee
                </th>
                {dayHeaders.map((day) => {
                  // Check if this date is today for highlighting
                  const today = new Date();
                  const isToday = day.fullDate.toDateString() === today.toDateString();
                  
                  return (
                    <th 
                      key={day.fullDate.toISOString()} 
                      className={`text-center py-3 px-2 font-semibold min-w-[120px] ${
                        isToday 
                          ? 'bg-blue-100 text-blue-800 border-blue-300' 
                          : 'text-gray-800 bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${isToday ? 'text-blue-900' : ''}`}>
                          {day.dayNumber}
                        </span>
                        <span className={`text-xs ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                          {day.dayName}
                        </span>
                        {isToday && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(employeesByDepartment).map(([department, deptEmployees]: [string, any[]]) => (
                <React.Fragment key={department}>
                  {/* Department Header */}
                  <tr className="border-b bg-gray-100">
                    <td colSpan={dayHeaders.length + 1} className="py-3 px-4">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (expandedDepartments.includes(department)) {
                              setExpandedDepartments(prev => prev.filter(d => d !== department));
                            } else {
                              setExpandedDepartments(prev => [...prev, department]);
                            }
                          }}
                          className="p-0 h-auto text-left font-semibold text-gray-800"
                        >
                          {expandedDepartments.includes(department) ? (
                            <ChevronDown className="w-4 h-4 mr-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 mr-2" />
                          )}
                          {department} ({deptEmployees.length})
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Employee Rows */}
                  {expandedDepartments.includes(department) && deptEmployees.map((employee: any) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employment?.designation}
                            </div>
                          </div>
                        </div>
                      </td>
                      {dayHeaders.map((day) => {
                        const shift = getShiftForEmployeeDate(employee.id, day.fullDate);
                        return (
                          <td key={day.fullDate.toISOString()} className="py-2 px-2 text-center">
                            {shift ? (
                              <ShiftComplianceCell 
                                employee={employee} 
                                shift={shift} 
                                date={day.fullDate} 
                              />
                            ) : (
                              <div className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-200 text-gray-600">
                                Off Day
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CalendarPage() {
  const { user } = useAuth();

  // Fetch current logged-in user data for role-based access control
  const { data: currentUser } = useQuery<{ id: string; role?: string }>({
    queryKey: ["/api/user"],
  });

  // Fetch current user's employee data to get role
  const { data: currentUserEmployee } = useQuery<{ id: string; role?: string }>({
    queryKey: ["/api/user/employee"],
    enabled: !!currentUser?.id,
  });
  const [activeTab, setActiveTab] = useState("team");
  const [calendarView, setCalendarView] = useState("month");
  const [activityTab, setActivityTab] = useState("holiday");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // August 2025
  const [currentWeek, setCurrentWeek] = useState("Aug 4 – 10, 2025");
  const [selectedDateLeaves, setSelectedDateLeaves] = useState<LeaveApplication[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Fetch all leave applications for calendar display
  const { data: allLeaveApplications = [] } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications/all-for-calendar"],
    queryFn: async () => {
      const response = await fetch('/api/leave-applications/all-for-calendar', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch leave applications');
      }
      return response.json();
    },
  });

  // Fetch holidays from database
  const { data: holidays = [], refetch: refetchHolidays } = useQuery({
    queryKey: ["/api/holidays"],
    queryFn: async () => {
      const response = await fetch('/api/holidays', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      return response.json();
    },
  });

  // User role is available from useAuth hook
  
  // Modal states
  const [isGenerateHolidayOpen, setIsGenerateHolidayOpen] = useState(false);
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  // Fetch events from database
  const { data: events = [], refetch: refetchEvents } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      return response.json();
    },
  });

  // Holiday form
  const [holidayDescription, setHolidayDescription] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  
  // Event form
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDateStart, setEventDateStart] = useState("");
  const [eventDateEnd, setEventDateEnd] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // Inline add holiday states
  const [showAddHolidayRow, setShowAddHolidayRow] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayPublic, setNewHolidayPublic] = useState(true); // All holidays are public by default

  // Holiday mutations
  const createHolidayMutation = useMutation({
    mutationFn: async (holiday: { name: string; date: string }) => {
      return apiRequest('POST', '/api/holidays', holiday);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
    },
    onError: (error) => {
      console.error('Error creating holiday:', error);
    },
  });

  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      return apiRequest('PUT', `/api/holidays/${id}`, { isPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
    },
    onError: (error) => {
      console.error('Error updating holiday:', error);
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
    },
    onError: (error) => {
      console.error('Error deleting holiday:', error);
    },
  });

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: async (event: { title: string; description: string; startDate: string; endDate: string; time: string; selectedEmployee: string }) => {
      return apiRequest('POST', '/api/events', event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEventTitle("");
      setEventDescription("");
      setEventDateStart("");
      setEventDateEnd("");
      setEventTime("");
      setSelectedEmployee("");
      setIsAddEventOpen(false);
    },
    onError: (error) => {
      console.error('Error creating event:', error);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
    },
  });

  // Role-based access control functions
  const canAccessHolidayButtons = () => {
    const currentUserRole = currentUserEmployee?.role || currentUser?.role || '';
    const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC'];
    const hasAccess = privilegedRoles.includes(currentUserRole);
    
    // Debug logging for troubleshooting deployment issues
    console.log("Calendar page - Current user role:", currentUserRole);
    console.log("Calendar page - Has holiday access:", hasAccess);
    
    return hasAccess;
  };

  const canAccessAddEvent = () => {
    const currentUserRole = currentUserEmployee?.role || currentUser?.role || '';
    const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Manager/Supervisor'];
    const hasAccess = privilegedRoles.includes(currentUserRole);
    
    // Debug logging for troubleshooting deployment issues
    console.log("Calendar page - Current user role (events):", currentUserRole);
    console.log("Calendar page - Has event access:", hasAccess);
    
    return hasAccess;
  };

  // Helper function to check if date has leave applications
  const getLeaveApplicationsForDate = (date: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    
    return allLeaveApplications.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      return targetDate >= startDate && targetDate <= endDate && 
             (leave.status === 'Approved' || leave.status === 'Pending' || leave.status === 'First Level Approved');
    });
  };

  // Helper function to check if date has events
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

  // Helper function to check if date is a public holiday
  const getHolidayForDate = (date: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    
    return holidays.find(holiday => {
      // Holiday date format is "DD-MM-YYYY" or "YYYY-MM-DD"
      let holidayDate;
      if (holiday.date.includes('-')) {
        const parts = holiday.date.split('-');
        if (parts[0].length === 4) {
          // Format: YYYY-MM-DD
          holidayDate = new Date(holiday.date);
        } else {
          // Format: DD-MM-YYYY
          holidayDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
        }
      } else {
        holidayDate = new Date(holiday.date);
      }
      
      return holidayDate.getFullYear() === targetDate.getFullYear() &&
             holidayDate.getMonth() === targetDate.getMonth() &&
             holidayDate.getDate() === targetDate.getDate() &&
             holiday.isPublic;
    });
  };

  // Get month name and year for display
  const getMonthDisplay = () => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Handle click on date with leave applications
  const handleDateClick = (leaves: LeaveApplication[]) => {
    if (leaves.length > 0) {
      setSelectedDateLeaves(leaves);
      setIsLeaveModalOpen(true);
    }
  };

  // Handle click on holiday
  const handleHolidayClick = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsHolidayModalOpen(true);
  };

  // Handle click on events
  const handleEventClick = (events: Event[]) => {
    if (events.length > 0) {
      setSelectedEvents(events);
      setIsEventModalOpen(true);
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and calculate how many days from previous month to show
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week for first day (0=Sunday, 1=Monday, etc)
    // Convert to Monday=0 format
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Get previous month info
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    // Add days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      days.push({
        number: dayNum,
        isCurrentMonth: false,
        leaveApplications: []
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const leaveApplications = getLeaveApplicationsForDate(day);
      days.push({
        number: day,
        isCurrentMonth: true,
        leaveApplications
      });
    }
    
    // Add days from next month to fill the grid
    const totalCells = 42; // 6 weeks × 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        number: day,
        isCurrentMonth: false,
        leaveApplications: []
      });
    }
    
    return days;
  };

  const handleGenerateHolidays = () => {
    const selectedHolidays = holidays.filter(h => h.importToCalendar);
    console.log("Generated holidays:", selectedHolidays);
    setIsGenerateHolidayOpen(false);
  };

  const handleAddHoliday = () => {
    if (!holidayDescription || !holidayDate) return;
    
    createHolidayMutation.mutate({
      name: holidayDescription,
      date: holidayDate
    });
    
    setHolidayDescription("");
    setHolidayDate("");
    setIsPublicHoliday(false);
    setIsAddHolidayOpen(false);
  };

  const handleAddEvent = () => {
    if (!eventTitle || !eventDescription || !eventDateStart) return;
    
    createEventMutation.mutate({
      title: eventTitle,
      description: eventDescription,
      startDate: eventDateStart,
      endDate: eventDateEnd || eventDateStart, // Use start date if end date is not provided
      time: eventTime || "00:00", // Default time if not provided
      selectedEmployee: selectedEmployee || "everyone"
    });
  };

  const updateHolidayImport = (id: string, isPublic: boolean) => {
    updateHolidayMutation.mutate({ id, isPublic });
  };

  const updateHolidayPublic = (id: string, isPublic: boolean) => {
    updateHolidayMutation.mutate({ id, isPublic });
  };

  // Inline add holiday functions
  const handleAddNewHolidayRow = () => {
    setShowAddHolidayRow(true);
    setNewHolidayName("");
    setNewHolidayDate("");
    setNewHolidayPublic(false);
  };

  const handleSaveInlineHoliday = () => {
    if (newHolidayName && newHolidayDate) {
      createHolidayMutation.mutate({
        name: newHolidayName,
        date: newHolidayDate
      });
      setShowAddHolidayRow(false);
      setNewHolidayName("");
      setNewHolidayDate("");
      setNewHolidayPublic(false);
    }
  };

  const handleDeleteHoliday = (holidayId: string) => {
    deleteHolidayMutation.mutate(holidayId);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <span>Home</span>
                <ChevronRight className="w-4 h-4 mx-1" />
                <span>Calendar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs and Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger 
                    value="team" 
                    className="data-[state=active]:bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 data-[state=active]:text-white"
                    data-testid="tab-team-calendar"
                  >
                    Team Calendar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="shift"
                    className="data-[state=active]:bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 data-[state=active]:text-white"
                    data-testid="tab-shift-calendar"
                  >
                    Shift Calendar
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  {canAccessHolidayButtons() && (
                    <Dialog open={isGenerateHolidayOpen} onOpenChange={setIsGenerateHolidayOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
                          data-testid="button-generate-holiday"
                        >
                          Generate Holiday
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="max-w-4xl" aria-describedby="generate-holiday-description">
                      <DialogHeader>
                        <DialogTitle>Generate Holiday</DialogTitle>
                      </DialogHeader>
                      <p id="generate-holiday-description" className="sr-only">
                        Manage company holidays by adding new holidays to the calendar system.
                      </p>
                      
                      <div className="space-y-4">
                        {/* Add Holiday Button */}
                        <div className="flex justify-start">
                          <Button 
                            onClick={handleAddNewHolidayRow}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid="button-add-holiday-inline"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Holiday
                          </Button>
                        </div>

                        {/* Holiday Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 font-medium text-gray-700">No</th>
                                <th className="text-left py-2 px-4 font-medium text-gray-700">Name Holiday</th>
                                <th className="text-left py-2 px-4 font-medium text-gray-700">Date</th>
                                <th className="text-center py-2 px-4 font-medium text-gray-700">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Add Holiday Row */}
                              {showAddHolidayRow && (
                                <tr className="border-b bg-gray-50">
                                  <td className="py-3 px-2">{holidays.length + 1}</td>
                                  <td className="py-3 px-4">
                                    <Input
                                      value={newHolidayName}
                                      onChange={(e) => setNewHolidayName(e.target.value)}
                                      placeholder="Enter holiday name"
                                      className="h-8"
                                      data-testid="input-new-holiday-name"
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <Input
                                      type="date"
                                      value={newHolidayDate}
                                      onChange={(e) => setNewHolidayDate(e.target.value)}
                                      className="h-8"
                                      data-testid="input-new-holiday-date"
                                    />
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <Button
                                      onClick={handleSaveInlineHoliday}
                                      disabled={!newHolidayName || !newHolidayDate}
                                      size="sm"
                                      className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
                                      data-testid="button-save-inline-holiday"
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              )}

                              {/* Existing Holidays */}
                              {holidays.map((holiday, index) => (
                                <tr key={holiday.id} className="border-b">
                                  <td className="py-3 px-2">{index + 1}</td>
                                  <td className="py-3 px-4">{holiday.name}</td>
                                  <td className="py-3 px-4">{holiday.date}</td>
                                  <td className="py-3 px-4 text-center">
                                    <Button
                                      onClick={() => handleDeleteHoliday(holiday.id)}
                                      size="sm"
                                      variant="destructive"
                                      data-testid={`button-delete-holiday-${holiday.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsGenerateHolidayOpen(false);
                            setShowAddHolidayRow(false);
                          }}
                          data-testid="button-close-generate"
                        >
                          Close
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}

                  

                  {canAccessAddEvent() && (
                    <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
                          data-testid="button-add-event"
                        >
                          Add Event
                        </Button>
                      </DialogTrigger>
                    <DialogContent aria-describedby="add-event-description">
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                      </DialogHeader>
                      <p id="add-event-description" className="sr-only">
                        Create a new calendar event with title, description, dates and employee assignment.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                          <Input
                            id="title"
                            placeholder="Title"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            className="mt-1"
                            data-testid="input-event-title"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="event-description" className="text-sm font-medium">Description</Label>
                          <Textarea
                            id="event-description"
                            placeholder="Description"
                            value={eventDescription}
                            onChange={(e) => setEventDescription(e.target.value)}
                            className="mt-1"
                            data-testid="textarea-event-description"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="date-start" className="text-sm font-medium">Date Start</Label>
                            <Input
                              id="date-start"
                              type="date"
                              placeholder="Date Start"
                              value={eventDateStart}
                              onChange={(e) => setEventDateStart(e.target.value)}
                              className="mt-1"
                              data-testid="input-date-start"
                            />
                          </div>
                          <div>
                            <Label htmlFor="date-end" className="text-sm font-medium">Date End</Label>
                            <Input
                              id="date-end"
                              type="date"
                              placeholder="Date End"
                              value={eventDateEnd}
                              onChange={(e) => setEventDateEnd(e.target.value)}
                              className="mt-1"
                              data-testid="input-date-end"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="time" className="text-sm font-medium">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            placeholder="Time"
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            className="mt-1"
                            data-testid="input-event-time"
                          />
                        </div>
                        
                      </div>
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddEventOpen(false)}
                          data-testid="button-cancel-event"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddEvent}
                          disabled={!eventTitle || !eventDescription || !eventDateStart}
                          className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
                          data-testid="button-save-event"
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>
              </div>

              <TabsContent value="team">
                <div className="flex gap-6">
                  {/* Left Panel - Activity */}
                  <div className="w-1/3">
                    <Card>
                      <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-t-lg">
                        <CardTitle>Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Activity Tabs */}
                        <div className="flex border-b">
                          <button
                            onClick={() => setActivityTab("holiday")}
                            className={cn(
                              "px-4 py-2 text-sm font-medium border-b-2",
                              activityTab === "holiday" 
                                ? "border-cyan-500 text-cyan-600 bg-cyan-50" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                            data-testid="tab-all-holiday"
                          >
                            All Holiday
                          </button>
                          <button
                            onClick={() => setActivityTab("event")}
                            className={cn(
                              "px-4 py-2 text-sm font-medium border-b-2",
                              activityTab === "event" 
                                ? "border-cyan-500 text-cyan-600 bg-cyan-50" 
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                            data-testid="tab-all-event"
                          >
                            All Event
                          </button>
                        </div>
                        
                        {/* Search */}
                        <div className="p-4 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Search year, description"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9"
                              data-testid="input-activity-search"
                            />
                          </div>
                        </div>
                        
                        {/* Activity Table */}
                        <div className="p-4">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 text-sm font-medium text-gray-700">Date</th>
                                <th className="text-left py-2 text-sm font-medium text-gray-700">Description</th>
                                {activityTab === "event" && (
                                  <th className="text-left py-2 text-sm font-medium text-gray-700">Actions</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {activityTab === "holiday" ? (
                                holidays && holidays.length > 0 ? (
                                  holidays.map((holiday: Holiday) => (
                                    <tr key={holiday.id} className="border-b hover:bg-gray-50">
                                      <td className="py-3 px-4 text-sm">
                                        {new Date(holiday.date).toLocaleDateString('en-GB')}
                                      </td>
                                      <td className="py-3 px-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-600">🏛️</span>
                                          <span>{holiday.name}</span>
                                          {holiday.isPublic && (
                                            <Badge className="bg-red-100 text-red-800 text-xs">
                                              Cuti Umum
                                            </Badge>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={2} className="text-center py-8 text-gray-500">
                                      Tiada cuti umum ditetapkan untuk tahun ini
                                    </td>
                                  </tr>
                                )
                              ) : (
                                events && events.length > 0 ? (
                                  events.map((event: Event) => (
                                    <tr key={event.id} className="border-b hover:bg-gray-50">
                                      <td className="py-3 px-4 text-sm">
                                        {new Date(event.startDate).toLocaleDateString('en-GB')}
                                        {event.endDate && event.endDate !== event.startDate && 
                                          ` - ${new Date(event.endDate).toLocaleDateString('en-GB')}`
                                        }
                                      </td>
                                      <td className="py-3 px-4 text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="text-blue-600">📅</span>
                                          <div>
                                            <div className="font-medium">{event.title}</div>
                                            <div className="text-gray-500 text-xs">{event.description}</div>
                                            {event.time && (
                                              <div className="text-gray-500 text-xs">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {event.time}
                                              </div>
                                            )}
                                            {event.selectedEmployee && event.selectedEmployee !== "everyone" && (
                                              <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                                                {event.selectedEmployee}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-sm">
                                        {canAccessAddEvent() && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteEventMutation.mutate(event.id)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                            data-testid={`button-delete-event-${event.id}`}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="text-center py-8 text-gray-500">
                                      Tiada acara ditetapkan untuk tahun ini
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Panel - Calendar */}
                  <div className="flex-1">
                    <Card>
                      <CardContent className="p-6">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={previousMonth}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <h2 className="text-xl font-semibold">{getMonthDisplay()}</h2>
                            <Button variant="ghost" size="sm" onClick={nextMonth}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant={calendarView === "list" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setCalendarView("list")}
                              data-testid="button-list-view"
                            >
                              list
                            </Button>
                            <Button 
                              variant={calendarView === "month" ? "default" : "outline"} 
                              size="sm"
                              onClick={() => setCalendarView("month")}
                              data-testid="button-month-view"
                            >
                              month
                            </Button>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {/* Day headers */}
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                              {day}
                            </div>
                          ))}
                          
                          {/* Calendar days */}
                          {generateCalendarDays().map((day, index) => {
                            const holiday = getHolidayForDate(day.number);
                            const dayEvents = getEventsForDate(day.number);
                            return (
                              <div 
                                key={index}
                                className={cn(
                                  "p-2 text-center text-sm border-b border-r min-h-[80px] flex flex-col relative",
                                  day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                                  holiday && "bg-red-50 border-red-200"
                                )}
                              >
                                <div className="font-medium mb-1">{day.number}</div>
                                
                                {/* Show public holiday indicator */}
                                {holiday && (
                                  <div 
                                    className="text-xs px-1 py-1 bg-red-100 text-red-800 rounded mb-1 truncate cursor-pointer hover:bg-red-200 transition-colors"
                                    onClick={() => handleHolidayClick(holiday)}
                                    title="Klik untuk melihat maklumat holiday"
                                  >
                                    🏛️ {holiday.name}
                                  </div>
                                )}
                                
                                {/* Show events for this date */}
                                {dayEvents?.length > 0 && (
                                  <div 
                                    className="text-xs px-1 py-1 bg-green-100 text-green-800 rounded mb-1 truncate cursor-pointer hover:bg-green-200 transition-colors"
                                    onClick={() => handleEventClick(dayEvents)}
                                    title={`Events: ${dayEvents.map(e => e.title).join(', ')} - Klik untuk melihat maklumat lengkap`}
                                  >
                                    📅 {dayEvents.length > 1 ? `${dayEvents.length} events` : dayEvents[0].title}
                                  </div>
                                )}
                                
                                {/* Show leave applications for this date */}
                                {(day as any).leaveApplications?.length > 0 && (
                                  <div 
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                                    onClick={() => handleDateClick((day as any).leaveApplications)}
                                    title="Klik untuk melihat maklumat lengkap"
                                  >
                                    <Users className="w-2 h-2 inline mr-1" />
                                    {(day as any).leaveApplications.slice(0, 2).map((leave: LeaveApplication, idx: number) => 
                                      leave.applicant.split(' ')[0]
                                    ).join(', ')}
                                    {(day as any).leaveApplications.length > 2 && 
                                      ` +${(day as any).leaveApplications.length - 2}`
                                    }
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shift">
                <ShiftCalendarView />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Holiday Details Modal */}
        <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
          <DialogContent className="max-w-lg" aria-describedby="holiday-details-description">
            <DialogHeader>
              <DialogTitle>Maklumat Cuti Umum</DialogTitle>
            </DialogHeader>
            <p id="holiday-details-description" className="sr-only">
              Details about the selected public holiday.
            </p>
            
            {selectedHoliday && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl">🏛️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-red-800">{selectedHoliday.name}</h3>
                    <p className="text-sm text-red-600">Cuti Umum</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tarikh:</p>
                    <p className="text-base">{selectedHoliday.date}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status:</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">
                        Cuti Umum
                      </Badge>
                      {selectedHoliday.isPublic && (
                        <Badge className="bg-green-100 text-green-800">
                          Aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> Ini adalah cuti umum yang ditetapkan oleh syarikat.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
                data-testid="button-close-holiday-modal"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave Details Modal */}
        <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
          <DialogContent className="max-w-2xl" aria-describedby="leave-details-description">
            <DialogHeader>
              <DialogTitle>Maklumat Pengguna Yang Bercuti</DialogTitle>
            </DialogHeader>
            <p id="leave-details-description" className="sr-only">
              List of employees taking leave on this date.
            </p>
            <p className="text-sm text-gray-600">
              Senarai pengguna yang mengambil cuti pada tarikh ini
            </p>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDateLeaves.map((leave, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{leave.applicant}</h3>
                          <p className="text-sm text-gray-600">Employee ID: {leave.employeeId}</p>
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
                          <p className="text-sm bg-gray-50 p-2 rounded">{leave.reason}</p>
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
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </div>
    </DashboardLayout>
  );
}