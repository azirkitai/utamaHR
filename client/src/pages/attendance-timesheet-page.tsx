import { useState } from "react";
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
  const [showPicture, setShowPicture] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // Sample data
  const todayStats = {
    totalStaff: 2,
    totalClockIn: 0,
    totalAbsent: 2,
    onLeave: 0
  };

  const attendanceData = [
    {
      id: 1,
      employee: "Ahmad Rahman",
      clockIn: "08:00 AM",
      clockOut: "05:00 PM",
      date: "2025-08-08",
      status: "present"
    }
  ];

  const summaryData = [
    {
      id: 1,
      employee: "SITI NADIAH SABRI",
      present: 0,
      absent: 7,
      late: 0,
      earlyClockOut: 0
    },
    {
      id: 2,
      employee: "madrah samsi",
      present: 0,
      absent: 7,
      late: 0,
      earlyClockOut: 0
    }
  ];

  const renderTabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      <Button
        variant={activeTab === "today" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "today" ? "bg-cyan-600 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("today")}
        data-testid="tab-today-attendance"
      >
        Today Attendance
      </Button>
      <Button
        variant={activeTab === "report" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "report" ? "bg-cyan-600 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("report")}
        data-testid="tab-attendance-report"
      >
        Attendance Report
      </Button>
      <Button
        variant={activeTab === "summary" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "summary" ? "bg-cyan-600 text-white" : "text-gray-600"}`}
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
      <div className="flex justify-between items-center bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Today Attendance Record</h3>
          <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">08 August 2025</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="all-shift">
            <SelectTrigger className="w-32 bg-white text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-shift">All shift</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
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
            className={showPicture ? "bg-blue-600 text-white" : ""}
            data-testid="toggle-show-picture"
          >
            Show Picture
          </Button>
          <Button
            variant={showNote ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNote(!showNote)}
            className={showNote ? "bg-blue-600 text-white" : ""}
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
            {attendanceData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            ) : (
              attendanceData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.employee}</TableCell>
                  <TableCell>{item.clockIn}</TableCell>
                  <TableCell>{item.clockOut}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing 0 to 0 of 0 entries
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
      <div className="bg-cyan-600 text-white p-4 rounded-lg">
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
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-filter">
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
            className={showPicture ? "bg-blue-600 text-white" : ""}
            data-testid="toggle-show-picture-report"
          >
            Show Picture
          </Button>
          <Button
            variant={showNote ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNote(!showNote)}
            className={showNote ? "bg-blue-600 text-white" : ""}
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
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing 0 to 0 of 0 entries
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
      <div className="bg-cyan-600 text-white p-4 rounded-lg">
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
        <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-filter-summary">
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
            {summaryData.map((item, index) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing 1 to 2 of 2 entries
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled data-testid="button-previous-summary">
            Previous
          </Button>
          <Button variant="outline" className="bg-blue-600 text-white" data-testid="button-page-1">
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
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-create-attendance"
          >
            Create Attendance
          </Button>
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