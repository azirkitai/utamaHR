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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPicture, setShowPicture] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // Fetch real attendance data
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['/api/attendance-records'],
    enabled: true,
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

  // Calculate today's stats from attendance records
  const todayStats = {
    totalStaff: Array.isArray(employees) ? employees.length : 0,
    totalClockIn: todayAttendanceData.length,
    totalAbsent: (Array.isArray(employees) ? employees.length : 0) - todayAttendanceData.length,
    onLeave: Array.isArray(shiftCalendar) ? shiftCalendar.filter((sc: any) => sc.isOff).length : 0
  };

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
        attendance: attendance,
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
          <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{new Date().toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric' 
            })}</span>
          </div>
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
              {shifts?.map((shift: any) => (
                <SelectItem key={shift.id} value={shift.id}>
                  {shift.name}
                </SelectItem>
              ))}
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
          <Button
            variant={showNote ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNote(!showNote)}
            className={showNote ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : ""}
            data-testid="toggle-show-note"
          >
            Show Note
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {todayLoading || employeesLoading || shiftsLoading || shiftCalendarLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Loading attendance data...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
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
          <Button
            variant={showNote ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNote(!showNote)}
            className={showNote ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : ""}
            data-testid="toggle-show-note-report"
          >
            Show Note
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
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendanceLoading || employeesLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading attendance report...
                </TableCell>
              </TableRow>
            ) : attendanceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              attendanceData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.employee}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.clockIn}</TableCell>
                  <TableCell>{item.clockOut}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                        <Eye className="w-4 h-4" />
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