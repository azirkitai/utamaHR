import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Printer, Eye, Check, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "approval" | "report" | "summary" | "history";

interface LeaveRecord {
  id: string;
  employeeId: string;
  applicant: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  startDayType: string;
  endDayType: string;
  totalDays: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  supportingDocument?: string | null;
  createdAt: string;
  updatedAt: string;
  appliedDate: string;
  // Additional fields for different tabs
  balanceCarryForward?: number;
  balanceAnnualLeave?: number;
  balanceMedicalLeave?: number;
  balanceLeaveInLieu?: number;
  carryForward?: number;
  annualLeave?: number;
  medicalLeave?: number;
  leaveInLieu?: number;
  unpaidLeave?: number;
  publicHolidayLeave?: number;
  emergencyLeave?: number;
  paternityLeave?: number;
  compassionateLeave?: number;
  sickLeave?: number;
  examLeave?: number;
  approve?: string;
}

const sampleData: LeaveRecord[] = [
  {
    id: "1",
    name: "SITI NADIAH SABRI",
    status: "Pending",
    leaveType: "Annual Leave",
    startDate: "2024-08-15",
    endDate: "2024-08-17",
    days: 3,
    balanceCarryForward: 12.0,
    balanceAnnualLeave: 90.0,
    balanceMedicalLeave: 7.0,
    balanceLeaveInLieu: 98.0,
    carryForward: 3.0,
    annualLeave: 4.0,
    medicalLeave: 5.0,
    leaveInLieu: 30.0,
    unpaidLeave: 7.0,
    publicHolidayLeave: 14.0,
    emergencyLeave: 10.0,
    paternityLeave: 10.0,
    compassionateLeave: 3.0,
    sickLeave: 4.0,
    examLeave: 10.0,
    approve: "HR Manager"
  },
  {
    id: "2",
    name: "madihah samsi",
    status: "Approved",
    leaveType: "Medical Leave",
    startDate: "2024-08-10",
    endDate: "2024-08-12",
    days: 3,
    balanceCarryForward: 12.0,
    balanceAnnualLeave: 90.0,
    balanceMedicalLeave: 7.0,
    balanceLeaveInLieu: 98.0,
    carryForward: 3.0,
    annualLeave: 4.0,
    medicalLeave: 5.0,
    leaveInLieu: 30.0,
    unpaidLeave: 7.0,
    publicHolidayLeave: 14.0,
    emergencyLeave: 10.0,
    paternityLeave: 10.0,
    compassionateLeave: 3.0,
    sickLeave: 4.0,
    examLeave: 10.0,
    approve: "Department Head"
  }
];

export default function LeaveApprovalPage() {
  const [activeTab, setActiveTab] = useState<TabType>("approval");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState("all");
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState("all");

  // Fetch all leave applications from database (for approval)
  const { data: leaveApplications = [], isLoading, error } = useQuery({
    queryKey: ["/api/all-leave-applications"], 
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });

  const getPageTitle = () => {
    switch (activeTab) {
      case "approval":
        return "Manage Leave Approval";
      case "report":
        return "Manage Leave Report";
      case "summary":
        return "Manage Leave Summary";
      case "history":
        return "Manage Leave History";
      default:
        return "Manage Leave";
    }
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case "approval":
        return "Leave Applications";
      case "report":
        return "Leave Application Report";
      case "summary":
        return "Leave Application Summary";
      case "history":
        return "Leave Application Summary";
      default:
        return "Leave Applications";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "Approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderApprovalTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="w-12">
            <input type="checkbox" className="rounded border-gray-300" />
          </TableHead>
          <TableHead>No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Day(s)</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              Loading leave applications...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-red-500">
              Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </TableCell>
          </TableRow>
        ) : leaveApplications.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              No leave applications found
            </TableCell>
          </TableRow>
        ) : (
          leaveApplications.map((record: LeaveRecord, index: number) => (
            <TableRow key={record.id}>
              <TableCell>
                <input type="checkbox" className="rounded border-gray-300" />
              </TableCell>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{record.applicant}</TableCell>
              <TableCell>{getStatusBadge(record.status)}</TableCell>
              <TableCell>{record.leaveType}</TableCell>
              <TableCell>{new Date(record.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(record.endDate).toLocaleDateString()}</TableCell>
              <TableCell>{record.totalDays}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {record.status === "Pending" && (
                    <>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderReportTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Day(s)</TableHead>
          <TableHead>Approve</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              No data available in table
            </TableCell>
          </TableRow>
        ) : (
          sampleData.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{getStatusBadge(record.status)}</TableCell>
              <TableCell>{record.leaveType}</TableCell>
              <TableCell>{record.startDate}</TableCell>
              <TableCell>{record.endDate}</TableCell>
              <TableCell>{record.days}</TableCell>
              <TableCell>{record.approve}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderSummaryTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Annual Leave</TableHead>
          <TableHead>Medical Leave</TableHead>
          <TableHead>Compassionate Leave - Paternity Leave</TableHead>
          <TableHead>Compassionate Leave - Maternity Leave</TableHead>
          <TableHead>Compassionate Leave - Death of Family Member</TableHead>
          <TableHead>Sick (Spouse, Child, Parent)</TableHead>
          <TableHead>Emergency Leave</TableHead>
          <TableHead>Unpaid Leave</TableHead>
          <TableHead>Public Holiday</TableHead>
          <TableHead>Leave In Lieu</TableHead>
          <TableHead>Exam Leave</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={13} className="text-center py-8 text-gray-500">
              No data available in table
            </TableCell>
          </TableRow>
        ) : (
          sampleData.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell>
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                  {index + 1}
                </div>
              </TableCell>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.annualLeave || 0}</TableCell>
              <TableCell>{record.medicalLeave || 0}</TableCell>
              <TableCell>{record.paternityLeave || 0}</TableCell>
              <TableCell>{record.compassionateLeave || 0}</TableCell>
              <TableCell>{record.compassionateLeave || 0}</TableCell>
              <TableCell>{record.sickLeave || 0}</TableCell>
              <TableCell>{record.emergencyLeave || 0}</TableCell>
              <TableCell>{record.unpaidLeave || 0}</TableCell>
              <TableCell>{record.publicHolidayLeave || 0}</TableCell>
              <TableCell>{record.leaveInLieu || 0}</TableCell>
              <TableCell>{record.examLeave || 0}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderHistoryTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead>No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Balance Carry Forward</TableHead>
          <TableHead>Balance Annual Leave</TableHead>
          <TableHead>Balance Medical Leave</TableHead>
          <TableHead>Balance Leave In Lieu</TableHead>
          <TableHead>Carry Forward</TableHead>
          <TableHead>Annual Leave</TableHead>
          <TableHead>Medical Leave</TableHead>
          <TableHead>Leave In Lieu</TableHead>
          <TableHead>Unpaid Leave</TableHead>
          <TableHead>Public Holiday Leave</TableHead>
          <TableHead>Emergency Leave</TableHead>
          <TableHead>Paternity Leave</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={14} className="text-center py-8 text-gray-500">
              No data available in table
            </TableCell>
          </TableRow>
        ) : (
          sampleData.map((record, index) => (
            <TableRow key={record.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.balanceCarryForward}</TableCell>
              <TableCell>{record.balanceAnnualLeave}</TableCell>
              <TableCell>{record.balanceMedicalLeave}</TableCell>
              <TableCell>{record.balanceLeaveInLieu}</TableCell>
              <TableCell>{record.carryForward}</TableCell>
              <TableCell>{record.annualLeave}</TableCell>
              <TableCell>{record.medicalLeave}</TableCell>
              <TableCell>{record.leaveInLieu}</TableCell>
              <TableCell>{record.unpaidLeave}</TableCell>
              <TableCell>{record.publicHolidayLeave}</TableCell>
              <TableCell>{record.emergencyLeave}</TableCell>
              <TableCell>{record.paternityLeave}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderCurrentTable = () => {
    switch (activeTab) {
      case "approval":
        return renderApprovalTable();
      case "report":
        return renderReportTable();
      case "summary":
        return renderSummaryTable();
      case "history":
        return renderHistoryTable();
      default:
        return renderApprovalTable();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600">
          <span className="text-cyan-600">Home</span> &gt; <span className="text-cyan-600">Leave</span> &gt; <span>Approval</span>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "approval", label: "Leave Approval" },
              { id: "report", label: "Leave Report" },
              { id: "summary", label: "Summary" },
              { id: "history", label: "History" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-lg shadow">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-4 rounded-t-lg">
            <h2 className="text-lg font-medium">{getSectionTitle()}</h2>
          </div>

          {/* Filters */}
          <div className="p-6 border-b">
            <div className="flex flex-wrap items-center gap-4">
              {/* Department Filter (for all tabs) */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All department</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional filters based on tab */}
              {activeTab === "report" && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Date Period</label>
                    <Input 
                      type="text" 
                      placeholder="01/08/2025 - 31/08/2025"
                      className="w-48"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Employee</label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All employee</SelectItem>
                        <SelectItem value="employee1">SITI NADIAH SABRI</SelectItem>
                        <SelectItem value="employee2">madihah samsi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Leave Type</label>
                    <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All leave type</SelectItem>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="medical">Medical Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Leave Status</label>
                    <Select value={selectedLeaveStatus} onValueChange={setSelectedLeaveStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All leave status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All leave status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {(activeTab === "summary" || activeTab === "history") && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="2024" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-auto">
                <Button 
                  variant="default" 
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button 
                  variant="outline"
                  data-testid="button-print"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline"
                  data-testid="button-settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Action (for approval tab) */}
          {activeTab === "approval" && (
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="flex items-center space-x-4">
                <Select defaultValue="bulk">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulk">Bulk action</SelectItem>
                    <SelectItem value="approve-all">Approve All</SelectItem>
                    <SelectItem value="reject-all">Reject All</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">Apply</Button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing 0 to 0 of 0 entries
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  placeholder="Search..."
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {renderCurrentTable()}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing 0 to 0 of 0 entries
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled 
                  data-testid="button-previous"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled 
                  data-testid="button-next"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}