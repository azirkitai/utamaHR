import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar,
  Users,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Filter,
  X
} from "lucide-react";

export default function AttendanceTimesheetPage() {
  const [activeTab, setActiveTab] = useState("today");
  const [attendanceSubTab, setAttendanceSubTab] = useState("clock-in");
  const [selectedShift, setSelectedShift] = useState("all");
  const [selectedDate, setSelectedDate] = useState('2025-08-20'); // Use 20 August 2025 for testing consistency with My Record
  const [showPicture, setShowPicture] = useState(false);

  // Fetch attendance records using the same approach as My Record page
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-records-timesheet', selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });
      
      console.log('🔄 Timesheet - Fetching attendance records with params:', params.toString());
      
      const token = localStorage.getItem('utamahr_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/attendance-records?${params}&_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Timesheet attendance records API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }
      
      const data = await response.json();
      console.log('🎯 Timesheet - Attendance records fetched:', data.length, 'records');
      
      return data;
    },
    enabled: true,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, 
    gcTime: 0
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    enabled: true,
  });

  // Fetch today's attendance specifically for the "Today" tab
  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ['/api/today-attendance'],
    enabled: activeTab === "today",
  });

  // Fetch shifts for dropdown
  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ['/api/shifts'],
    enabled: activeTab === "today",
  });

  // Fetch shift calendar data for selected date
  const { data: shiftCalendar, isLoading: shiftCalendarLoading } = useQuery({
    queryKey: ['/api/employee-shifts', selectedDate],
    enabled: activeTab === "today" && !!selectedDate,
  });

  // Process today's attendance data using attendance records (same as My Records)
  const todayAttendanceData = Array.isArray(attendanceRecords) ? attendanceRecords.filter((record: any) => {
    const recordDate = new Date(record.date);
    const today = new Date();
    return recordDate.toDateString() === today.toDateString();
  }).map((record: any) => {
    const employee = Array.isArray(employees) ? employees.find((emp: any) => emp.id === record.employeeId) : null;
    return {
      id: record.id,
      employee: employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'Unknown',
      clockIn: record.clockInTime ? new Date(record.clockInTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : '-',
      clockOut: record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : '-',
      date: new Date(record.date).toLocaleDateString(),
      status: record.clockInTime ? 'present' : 'absent',
      isLate: record.isLateClockIn || false,
      remarks: record.clockInRemarks || ''
    };
  }) : [];

  // Note: todayStats will be calculated after shiftEmployees to reflect selected shift/date

  // Process shift-based attendance data using attendance records (same as My Records)
  const getShiftEmployees = () => {
    if (!Array.isArray(shiftCalendar) || !Array.isArray(employees)) return [];
    
    const targetDate = new Date(selectedDate);
    const employeesOnShift = shiftCalendar.filter((sc: any) => {
      const shiftDate = new Date(sc.assignedDate || sc.date);
      return shiftDate.toDateString() === targetDate.toDateString() &&
             (selectedShift === "all" || sc.shiftId === selectedShift);
    });

    return employeesOnShift.map((sc: any) => {
      const employee = employees.find((emp: any) => emp.id === sc.employeeId);
      
      // Get attendance from attendance records (same data source as My Records)
      const attendance = Array.isArray(attendanceRecords) ? attendanceRecords.find((att: any) => {
        const attDate = new Date(att.date);
        return att.employeeId === sc.employeeId && 
               attDate.toDateString() === targetDate.toDateString();
      }) : null;
      
      const shift = Array.isArray(shifts) ? shifts.find((s: any) => s.id === sc.shiftId) : null;
      
      // Debug attendance data mapping for Today Attendance Record
      if (employee && employee.firstName && employee.firstName.toLowerCase().includes('syed')) {
        console.log('🔍 TODAY ATTENDANCE DEBUG - SYED data mapping:', {
          employeeId: sc.employeeId,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'Unknown',
          date: targetDate.toDateString(),
          attendance: attendance,
          clockInImage: attendance?.clockInImage,
          clockOutImage: attendance?.clockOutImage,
          willMapTo: {
            clockInSelfie: attendance?.clockInImage,
            clockOutSelfie: attendance?.clockOutImage
          }
        });
      }
      
      return {
        id: sc.employeeId,
        employee: employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'Unknown',
        shiftId: sc.shiftId,
        shiftName: shift?.name || 'Unknown Shift',
        shiftStartTime: shift?.startTime,
        shiftEndTime: shift?.endTime,
        clockIn: attendance?.clockInTime ? new Date(attendance.clockInTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '',
        clockOut: attendance?.clockOutTime ? new Date(attendance.clockOutTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '-',
        isOff: sc.isOff || false,
        attendance: {
          ...attendance,
          clockInSelfie: attendance?.clockInImage,
          clockOutSelfie: attendance?.clockOutImage
        },
        isLate: attendance?.isLateClockIn || false,
        isAbsent: !attendance && !sc.isOff ? 
          isEmployeeAbsent(shift?.startTime) : false
      };
    });
  };

  const isEmployeeLate = (clockInTime: string, shiftStartTime: string) => {
    const clockIn = new Date(`${selectedDate}T${new Date(clockInTime).toTimeString().split(' ')[0]}`);
    const shiftStart = new Date(`${selectedDate}T${shiftStartTime}`);
    return clockIn > shiftStart;
  };

  const isEmployeeAbsent = (shiftStartTime: string) => {
    if (!shiftStartTime) return false;
    const now = new Date();
    const shiftStart = new Date(`${selectedDate}T${shiftStartTime}`);
    const oneHourAfterShift = new Date(shiftStart.getTime() + 60 * 60 * 1000);
    return now > oneHourAfterShift;
  };

  const shiftEmployees = getShiftEmployees();
  
  // Calculate stats based on selected shift and date (not entire system)
  const todayStats = {
    totalStaff: shiftEmployees.length, // Staff assigned to selected shift/date
    totalClockIn: shiftEmployees.filter(emp => emp.clockIn && emp.clockIn !== '' && !emp.isOff).length,
    totalAbsent: shiftEmployees.filter(emp => (!emp.clockIn || emp.clockIn === '') && !emp.isOff && !emp.isAbsent).length,
    onLeave: shiftEmployees.filter(emp => emp.isOff).length
  };
  
  // Debug stats calculation
  console.log('📊 STATS CALCULATION DEBUG:', {
    selectedDate,
    selectedShift,
    shiftEmployeesTotal: shiftEmployees.length,
    todayStats,
    shiftEmployeesBreakdown: {
      withClockIn: shiftEmployees.filter(emp => emp.clockIn && emp.clockIn !== '' && !emp.isOff).length,
      withoutClockIn: shiftEmployees.filter(emp => (!emp.clockIn || emp.clockIn === '') && !emp.isOff).length,
      onLeave: shiftEmployees.filter(emp => emp.isOff).length,
      absent: shiftEmployees.filter(emp => emp.isAbsent && !emp.isOff).length
    },
    // Debug each employee attendance data
    employeesDebug: shiftEmployees.map(emp => ({
      id: emp.id,
      name: emp.employee,
      isOff: emp.isOff,
      hasAttendance: !!emp.attendance,
      attendanceFullData: emp.attendance,
      clockInTime: emp.attendance?.clockInTime,
      clockInExists: !!emp.attendance?.clockInTime,
      clockIn: emp.clockIn,
      clockInDisplay: emp.attendance?.clockIn
    })),
    // Debug on leave calculation
    onLeaveDebug: {
      totalStaffIsOff: shiftEmployees.filter(emp => emp.isOff).length,
      staffOnLeave: shiftEmployees.filter(emp => emp.isOff).map(emp => ({
        name: emp.employee,
        isOff: emp.isOff,
        shiftId: emp.shiftId,
        shiftName: emp.shiftName
      }))
    }
  });

  // Filter employees based on sub-tab
  const getFilteredEmployees = () => {
    switch (attendanceSubTab) {
      case "clock-in":
        return shiftEmployees.filter(emp => !emp.isOff);
      case "absent":
        return shiftEmployees.filter(emp => emp.isAbsent && !emp.isOff);
      case "on-leave":
        return shiftEmployees.filter(emp => emp.isOff);
      case "late":
        return shiftEmployees.filter(emp => emp.isLate && !emp.isOff);
      default:
        return shiftEmployees;
    }
  };

  const filteredEmployees = getFilteredEmployees();

  // Process all attendance records for "Report" tab
  const attendanceData = Array.isArray(attendanceRecords) ? attendanceRecords.map((record: any) => {
    const employee = Array.isArray(employees) ? employees.find((emp: any) => emp.id === record.employeeId) : null;
    return {
      id: record.id,
      employee: employee ? `${employee.firstName} ${employee.lastName}`.trim() : 'Unknown',
      clockIn: record.clockInTime ? new Date(record.clockInTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : '-',
      clockOut: record.clockOutTime ? new Date(record.clockOutTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : '-',
      date: new Date(record.date).toLocaleDateString(),
      status: record.clockInTime ? 'present' : 'absent'
    };
  }) : [];

  // Calculate summary data from attendance records
  const summaryData = Array.isArray(employees) ? employees.map((employee: any, index: number) => {
    const employeeRecords = Array.isArray(attendanceRecords) ? attendanceRecords.filter((record: any) => record.employeeId === employee.id) : [];
    const presentDays = employeeRecords.filter((record: any) => record.clockInTime).length;
    const absentDays = employeeRecords.length - presentDays;
    const lateDays = employeeRecords.filter((record: any) => record.isLateClockIn).length;
    
    return {
      id: index + 1,
      employee: `${employee.firstName} ${employee.lastName}`.trim(),
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      earlyClockOut: 0 // This would need additional logic to calculate
    };
  }) : [];

  const renderTabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      <Button
        variant={activeTab === "today" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "today" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("today")}
        data-testid="tab-today-attendance"
      >
        Today Attendance
      </Button>
      <Button
        variant={activeTab === "report" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "report" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("report")}
        data-testid="tab-attendance-report"
      >
        Attendance Report
      </Button>
      <Button
        variant={activeTab === "summary" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "summary" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("summary")}
        data-testid="tab-attendance-summary"
      >
        Attendance Summary
      </Button>
    </div>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-4 gap-6 mb-6">
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{todayStats.totalStaff}</div>
          <div className="text-sm text-gray-600">Total Staff</div>
        </CardContent>
      </Card>
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{todayStats.totalClockIn}</div>
          <div className="text-sm text-gray-600">Total Clock In</div>
        </CardContent>
      </Card>
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">{todayStats.totalAbsent}</div>
          <div className="text-sm text-gray-600">Total Absent</div>
        </CardContent>
      </Card>
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{todayStats.onLeave}</div>
          <div className="text-sm text-gray-600">On Leave</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttendanceSubTabs = () => (
    <div className="flex space-x-4 mb-4">
      <Button
        variant={attendanceSubTab === "clock-in" ? "default" : "ghost"}
        className={`${attendanceSubTab === "clock-in" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-600"} bg-transparent hover:bg-gray-50`}
        onClick={() => setAttendanceSubTab("clock-in")}
        data-testid="subtab-clock-in"
      >
        Clock In
      </Button>
      <Button
        variant={attendanceSubTab === "absent" ? "default" : "ghost"}
        className={`${attendanceSubTab === "absent" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-600"} bg-transparent hover:bg-gray-50`}
        onClick={() => setAttendanceSubTab("absent")}
        data-testid="subtab-absent"
      >
        Absent
      </Button>
      <Button
        variant={attendanceSubTab === "on-leave" ? "default" : "ghost"}
        className={`${attendanceSubTab === "on-leave" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-600"} bg-transparent hover:bg-gray-50`}
        onClick={() => setAttendanceSubTab("on-leave")}
        data-testid="subtab-on-leave"
      >
        On Leave
      </Button>
      <Button
        variant={attendanceSubTab === "late" ? "default" : "ghost"}
        className={`${attendanceSubTab === "late" ? "text-cyan-600 border-b-2 border-cyan-600" : "text-gray-600"} bg-transparent hover:bg-gray-50`}
        onClick={() => setAttendanceSubTab("late")}
        data-testid="subtab-late"
      >
        Late
      </Button>
    </div>
  );

  const renderTodayAttendanceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Today Attendance Record</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white text-gray-900 w-40"
          />
          <Select value={selectedShift} onValueChange={setSelectedShift}>
            <SelectTrigger className="w-40 bg-white text-gray-900">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shift</SelectItem>
              {Array.isArray(shifts) ? shifts.map((shift: any) => (
                <SelectItem key={shift.id} value={shift.id}>
                  {shift.name}
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderStatsCards()}
      {renderAttendanceSubTabs()}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant={showPicture ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPicture(!showPicture)}
            className={showPicture ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : ""}
            data-testid="toggle-show-picture"
          >
            Show Picture
          </Button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              {showPicture && <TableHead>Clock In Photo</TableHead>}
              {showPicture && <TableHead>Clock Out Photo</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {todayLoading || employeesLoading || shiftsLoading || shiftCalendarLoading ? (
              <TableRow>
                <TableCell colSpan={showPicture ? 6 : 4} className="text-center py-8 text-gray-500">
                  Loading attendance data...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showPicture ? 6 : 4} className="text-center py-8 text-gray-500">
                  {attendanceSubTab === "clock-in" && "No employees assigned to work today"}
                  {attendanceSubTab === "absent" && "No absent employees"}
                  {attendanceSubTab === "on-leave" && "No employees on leave today"}
                  {attendanceSubTab === "late" && "No late employees"}
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee, index) => (
                <TableRow key={employee.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{employee.employee}</TableCell>
                  <TableCell>
                    {attendanceSubTab === "on-leave" ? "On Leave" : employee.clockIn || "-"}
                  </TableCell>
                  <TableCell>
                    {attendanceSubTab === "on-leave" ? "-" : employee.clockOut}
                  </TableCell>
                  {showPicture && (
                    <TableCell>
                      {employee.attendance?.clockInSelfie ? (
                        <img 
                          src={employee.attendance.clockInSelfie} 
                          alt="Clock In Photo" 
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => {
                            console.log('🖼️ Today Attendance - Opening image:', employee.attendance.clockInSelfie);
                            window.open(employee.attendance.clockInSelfie, '_blank');
                          }}
                          onLoad={() => {
                            console.log('✅ Today Attendance - Image loaded:', employee.attendance.clockInSelfie);
                          }}
                          onError={(e) => {
                            console.error('❌ Today Attendance - Image failed:', employee.attendance.clockInSelfie);
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No photo</span>
                      )}
                    </TableCell>
                  )}
                  {showPicture && (
                    <TableCell>
                      {employee.attendance?.clockOutSelfie ? (
                        <img 
                          src={employee.attendance.clockOutSelfie} 
                          alt="Clock Out Photo" 
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open(employee.attendance.clockOutSelfie, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No photo</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {filteredEmployees.length > 0 ? 1 : 0} to {filteredEmployees.length} of {filteredEmployees.length} entries
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled data-testid="button-previous">
            Previous
          </Button>
          <Button variant="outline" disabled data-testid="button-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReportTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Attendance Report</h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Period</label>
          <Input type="date" defaultValue="2025-08-01" className="text-sm" />
        </div>
        <div>
          <Input type="date" defaultValue="2025-08-31" className="text-sm mt-6" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All department</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
              <SelectItem value="it">Information Technology</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shift</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-filter">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" data-testid="button-reset-filter">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={showPicture ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPicture(!showPicture)}
            className={showPicture ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : ""}
            data-testid="toggle-show-picture-report"
          >
            Show Picture
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              {showPicture && <TableHead>Clock In Photo</TableHead>}
              {showPicture && <TableHead>Clock Out Photo</TableHead>}
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceLoading || employeesLoading ? (
              <TableRow>
                <TableCell colSpan={showPicture ? 8 : 6} className="text-center py-8 text-gray-500">
                  Loading attendance report...
                </TableCell>
              </TableRow>
            ) : attendanceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showPicture ? 8 : 6} className="text-center py-8 text-gray-500">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              attendanceData.map((item, index) => {
                // Find the original attendance record to get selfie data
                const originalRecord = Array.isArray(attendanceRecords) ? 
                  attendanceRecords.find((record: any) => record.id === item.id) : null;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.employee}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.clockIn}</TableCell>
                    <TableCell>{item.clockOut}</TableCell>
                    {showPicture && (
                      <TableCell>
                        {originalRecord?.clockInSelfie ? (
                          <img 
                            src={originalRecord.clockInSelfie} 
                            alt="Clock In Photo" 
                            className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(originalRecord.clockInSelfie, '_blank')}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No photo</span>
                        )}
                      </TableCell>
                    )}
                    {showPicture && (
                      <TableCell>
                        {originalRecord?.clockOutSelfie ? (
                          <img 
                            src={originalRecord.clockOutSelfie} 
                            alt="Clock Out Photo" 
                            className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => window.open(originalRecord.clockOutSelfie, '_blank')}
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No photo</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {attendanceData.length > 0 ? 1 : 0} to {attendanceData.length} of {attendanceData.length} entries
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled data-testid="button-previous-report">
            Previous
          </Button>
          <Button variant="outline" disabled data-testid="button-next-report">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSummaryTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Attendance Summary</h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Period</label>
          <Input type="date" defaultValue="2025-08-01" className="text-sm" />
        </div>
        <div>
          <Input type="date" defaultValue="2025-08-31" className="text-sm mt-6" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All department</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-start items-center space-x-2">
        <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-filter-summary">
          <Filter className="w-4 h-4" />
        </Button>
        <Button variant="outline" data-testid="button-reset-filter-summary">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Early Clock Out</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceLoading || employeesLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading summary data...
                </TableCell>
              </TableRow>
            ) : summaryData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No employee data available
                </TableCell>
              </TableRow>
            ) : (
              summaryData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.employee}</TableCell>
                  <TableCell>{item.present}</TableCell>
                  <TableCell>{item.absent}</TableCell>
                  <TableCell>{item.late}</TableCell>
                  <TableCell>{item.earlyClockOut}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-details-${item.id}`}>
                        <Clock className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing 1 to {summaryData.length} of {summaryData.length} entries
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled data-testid="button-previous-summary">
            Previous
          </Button>
          <Button variant="outline" className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" data-testid="button-page-1">
            1
          </Button>
          <Button variant="outline" disabled data-testid="button-next-summary">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const getPageTitle = () => {
    switch (activeTab) {
      case "today":
        return "Attendance";
      case "report":
        return "Attendance Report";
      case "summary":
        return "Attendance Summary";
      default:
        return "Attendance";
    }
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case "today":
        return "Home > Attendance";
      case "report":
        return "Home > Attendance > Report";
      case "summary":
        return "Home > Attendance > Summary";
      default:
        return "Home > Attendance";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <span>{getBreadcrumb()}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        {renderTabNavigation()}
        
        {/* Tab Content */}
        {activeTab === "today" && renderTodayAttendanceTab()}
        {activeTab === "report" && renderReportTab()}
        {activeTab === "summary" && renderSummaryTab()}
      </div>
    </DashboardLayout>
  );
}