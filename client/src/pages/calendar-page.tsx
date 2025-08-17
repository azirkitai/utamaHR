import { useState } from "react";
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
  CalendarDays,
  Clock,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface Holiday {
  id: number;
  name: string;
  date: string;
  isPublic: boolean;
  importToCalendar: boolean;
}

interface Event {
  id: number;
  title: string;
  description: string;
  dateStart: string;
  dateEnd: string;
  time: string;
  selectedEmployee: string;
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
  { id: 1, name: "Federal Territory Day (regional holiday)", date: "01-02-2025", isPublic: true, importToCalendar: true },
  { id: 2, name: "Harvest Festival (regional holiday)", date: "30-05-2025", isPublic: true, importToCalendar: true },
  { id: 3, name: "Valentine's Day", date: "14-02-2025", isPublic: false, importToCalendar: true },
  { id: 4, name: "Good Friday (regional holiday)", date: "18-04-2025", isPublic: true, importToCalendar: true },
  { id: 5, name: "Easter Sunday", date: "20-04-2025", isPublic: false, importToCalendar: true }
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

export default function CalendarPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("team");
  const [calendarView, setCalendarView] = useState("month");
  const [activityTab, setActivityTab] = useState("holiday");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // August 2025
  const [currentWeek, setCurrentWeek] = useState("Aug 4 – 10, 2025");
  const [selectedDateLeaves, setSelectedDateLeaves] = useState<LeaveApplication[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

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

  // User role is available from useAuth hook
  
  // Modal states
  const [isGenerateHolidayOpen, setIsGenerateHolidayOpen] = useState(false);
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  // Form states
  const [holidays, setHolidays] = useState<Holiday[]>(predefinedHolidays);
  const [events, setEvents] = useState<Event[]>([]);
  
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

  // Role-based access control functions
  const canAccessHolidayButtons = () => {
    const role = (user as any)?.role;
    return role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes(role);
  };

  const canAccessAddEvent = () => {
    const role = (user as any)?.role;
    return role && ['Super Admin', 'Admin', 'HR Manager', 'PIC', 'Manager/Supervisor'].includes(role);
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
    
    const newHoliday: Holiday = {
      id: holidays.length + 1,
      name: holidayDescription,
      date: holidayDate,
      isPublic: isPublicHoliday,
      importToCalendar: true
    };
    
    setHolidays([...holidays, newHoliday]);
    setHolidayDescription("");
    setHolidayDate("");
    setIsPublicHoliday(false);
    setIsAddHolidayOpen(false);
  };

  const handleAddEvent = () => {
    if (!eventTitle || !eventDescription || !eventDateStart) return;
    
    const newEvent: Event = {
      id: events.length + 1,
      title: eventTitle,
      description: eventDescription,
      dateStart: eventDateStart,
      dateEnd: eventDateEnd,
      time: eventTime,
      selectedEmployee: selectedEmployee || "everyone"
    };
    
    setEvents([...events, newEvent]);
    setEventTitle("");
    setEventDescription("");
    setEventDateStart("");
    setEventDateEnd("");
    setEventTime("");
    setSelectedEmployee("");
    setIsAddEventOpen(false);
  };

  const updateHolidayImport = (id: number, importToCalendar: boolean) => {
    setHolidays(holidays.map(h => 
      h.id === id ? { ...h, importToCalendar } : h
    ));
  };

  const updateHolidayPublic = (id: number, isPublic: boolean) => {
    setHolidays(holidays.map(h => 
      h.id === id ? { ...h, isPublic } : h
    ));
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
                    className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                    data-testid="tab-team-calendar"
                  >
                    Team Calendar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="shift"
                    className="data-[state=active]:bg-teal-500 data-[state=active]:text-white"
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
                          className="bg-slate-700 hover:bg-slate-800 text-white"
                          data-testid="button-generate-holiday"
                        >
                          Generate Holiday
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Generate Holiday</DialogTitle>
                      </DialogHeader>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 font-medium text-gray-700">No</th>
                              <th className="text-left py-2 px-4 font-medium text-gray-700">Name</th>
                              <th className="text-left py-2 px-4 font-medium text-gray-700">Date</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-700">Import to Calendar</th>
                              <th className="text-center py-2 px-4 font-medium text-gray-700">Set as Public Holiday</th>
                            </tr>
                          </thead>
                          <tbody>
                            {holidays.map((holiday, index) => (
                              <tr key={holiday.id} className="border-b">
                                <td className="py-3 px-2">{index + 1}</td>
                                <td className="py-3 px-4">{holiday.name}</td>
                                <td className="py-3 px-4">{holiday.date}</td>
                                <td className="py-3 px-4 text-center">
                                  <Switch
                                    checked={holiday.importToCalendar}
                                    onCheckedChange={(checked) => updateHolidayImport(holiday.id, checked)}
                                  />
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <Switch
                                    checked={holiday.isPublic}
                                    onCheckedChange={(checked) => updateHolidayPublic(holiday.id, checked)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsGenerateHolidayOpen(false)}
                          data-testid="button-cancel-generate"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleGenerateHolidays}
                          className="bg-slate-700 hover:bg-slate-800"
                          data-testid="button-generate"
                        >
                          Generate
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}

                  {canAccessHolidayButtons() && (
                    <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-slate-700 hover:bg-slate-800 text-white"
                          data-testid="button-add-holiday"
                        >
                          Add Holiday
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Holiday</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                          <Input
                            id="description"
                            placeholder="Event Description"
                            value={holidayDescription}
                            onChange={(e) => setHolidayDescription(e.target.value)}
                            className="mt-1"
                            data-testid="input-holiday-description"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            placeholder="Holiday Data"
                            value={holidayDate}
                            onChange={(e) => setHolidayDate(e.target.value)}
                            className="mt-1"
                            data-testid="input-holiday-date"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="public-holiday"
                            checked={isPublicHoliday}
                            onCheckedChange={(checked) => setIsPublicHoliday(checked as boolean)}
                            data-testid="checkbox-public-holiday"
                          />
                          <Label htmlFor="public-holiday" className="text-sm">Set as public holiday</Label>
                        </div>
                      </div>
                      
                      <DialogFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddHolidayOpen(false)}
                          data-testid="button-cancel-holiday"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddHoliday}
                          disabled={!holidayDescription || !holidayDate}
                          className="bg-slate-700 hover:bg-slate-800"
                          data-testid="button-save-holiday"
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  )}

                  {canAccessAddEvent() && (
                    <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-slate-700 hover:bg-slate-800 text-white"
                          data-testid="button-add-event"
                        >
                          Add Event
                        </Button>
                      </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                      </DialogHeader>
                      
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
                        
                        <div>
                          <Label className="text-sm font-medium">Selected Employee</Label>
                          <div className="mt-1 flex items-center space-x-2">
                            <Checkbox
                              id="everyone"
                              checked={selectedEmployee === ""}
                              onCheckedChange={(checked) => setSelectedEmployee(checked ? "" : selectedEmployee)}
                              data-testid="checkbox-everyone"
                            />
                            <Label htmlFor="everyone" className="text-sm">Leave empty to indicate for everyone.</Label>
                          </div>
                          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger className="mt-2" data-testid="select-event-employee">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map(emp => (
                                <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          className="bg-slate-700 hover:bg-slate-800"
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
                      <CardHeader className="bg-slate-700 text-white rounded-t-lg">
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
                                ? "border-teal-500 text-teal-600 bg-teal-50" 
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
                                ? "border-teal-500 text-teal-600 bg-teal-50" 
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
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan={2} className="text-center py-8 text-gray-500">
                                  No data available in table
                                </td>
                              </tr>
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
                          {generateCalendarDays().map((day, index) => (
                            <div 
                              key={index}
                              className={cn(
                                "p-2 text-center text-sm border-b border-r min-h-[80px] flex flex-col relative",
                                day.isCurrentMonth ? "text-gray-900" : "text-gray-400",
                                day.number === 7 && "bg-yellow-100",
                                day.number === 15 && "bg-yellow-100"
                              )}
                            >
                              <div className="font-medium mb-1">{day.number}</div>
                              
                              {/* Show leave applications for this date */}
                              {(day as any).leaveApplications?.length > 0 && (
                                <div 
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                                  onClick={() => handleDateClick((day as any).leaveApplications)}
                                  title="Klik untuk melihat maklumat lengkap"
                                >
                                  <Users className="w-2 h-2 inline mr-1" />
                                  {(day as any).leaveApplications.length} user bercuti
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shift">
                <Card>
                  <CardHeader className="bg-teal-500 text-white rounded-t-lg">
                    <CardTitle>Shift Calendar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Shift Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h2 className="text-xl font-semibold">{currentWeek}</h2>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" data-testid="button-week-view">week</Button>
                        <Button variant="outline" size="sm" data-testid="button-month-shift-view">month</Button>
                      </div>
                    </div>

                    {/* Shift Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">4 M</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">5 T</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">6 W</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">7 T</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">8 F</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">9 S</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-700">10 S</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td colSpan={8} className="py-2 px-4 bg-gray-100">
                              <div className="flex items-center">
                                <Checkbox className="mr-2" />
                                <span className="font-medium">Human Resource</span>
                              </div>
                            </td>
                          </tr>
                          {employees.map(employee => (
                            <tr key={employee.id} className="border-b">
                              <td className="py-2 px-4">{employee.name}</td>
                              {employee.shifts.map((shift, index) => (
                                <td key={index} className="py-2 px-4 text-center">
                                  <span className={cn(
                                    "px-2 py-1 rounded text-xs",
                                    shift.type === "Default Shift" 
                                      ? "bg-blue-100 text-blue-800" 
                                      : "bg-gray-100 text-gray-800"
                                  )}>
                                    {shift.shift}
                                  </span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Leave Details Modal */}
        <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Maklumat Pengguna Yang Bercuti</DialogTitle>
              <p className="text-sm text-gray-600">
                Senarai pengguna yang mengambil cuti pada tarikh ini
              </p>
            </DialogHeader>
            
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
                className="bg-teal-600 hover:bg-teal-700 text-white"
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