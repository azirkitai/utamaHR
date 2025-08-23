import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Eye, 
  Check, 
  X,
  Search,
  Filter,
  Printer
} from "lucide-react";

export default function TimeoffApprovalPage() {
  const [activeTab, setActiveTab] = useState("approval");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Sample data untuk Timeoff Applications
  const timeoffApplicationsData = [
    {
      id: 1,
      applicant: "Ahmad Rahman",
      status: "Pending",
      reason: "Personal Matters",
      totalHour: "2 hours",
      date: "2025-08-07"
    },
    {
      id: 2,
      applicant: "Siti Nurhaliza",
      status: "Approved",
      reason: "Medical Appointment",
      totalHour: "3 hours",
      date: "2025-08-06"
    }
  ];

  // Summary data
  const summaryData = [
    {
      id: 1,
      name: "SITI NADIAH SABRI",
      pendingHours: "0.00",
      approvedTimeoff: "0/0",
      totalHoursApproved: "0.00"
    },
    {
      id: 2,
      name: "madrah samsi",
      pendingHours: "0.00",
      approvedTimeoff: "0/0",
      totalHoursApproved: "0.00"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderTabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      <Button
        variant={activeTab === "approval" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "approval" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("approval")}
        data-testid="tab-timeoff-approval"
      >
        Timeoff Approval
      </Button>
      <Button
        variant={activeTab === "report" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "report" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("report")}
        data-testid="tab-timeoff-report"
      >
        Timeoff Report
      </Button>
      <Button
        variant={activeTab === "summary" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "summary" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("summary")}
        data-testid="tab-timeoff-summary"
      >
        Timeoff Summary
      </Button>
    </div>
  );

  const renderApprovalTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Timeoff Applications</h3>
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-40" data-testid="select-bulk-action">
              <SelectValue placeholder="Bulk action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            disabled={selectedItems.length === 0}
            data-testid="button-apply-bulk"
          >
            Apply
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search:"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>No.</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Total Hour</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeoffApplicationsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            ) : (
              timeoffApplicationsData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.applicant}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{item.totalHour}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50" data-testid={`button-approve-${item.id}`}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" data-testid={`button-reject-${item.id}`}>
                        <X className="w-4 h-4" />
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
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Timeoff Application Report</h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeoff Status</label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All timeoff status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
          <Button variant="outline" size="sm" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search:"
              className="pl-10 w-64"
              data-testid="input-search-report"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Total Hour</TableHead>
              <TableHead>Date</TableHead>
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
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">Timeoff Application Summary</h3>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <Select defaultValue="all">
            <SelectTrigger className="w-48 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All department</SelectItem>
              <SelectItem value="hr">Human Resource</SelectItem>
              <SelectItem value="it">Information Technology</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end space-x-2">
          <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-filter-summary">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" data-testid="button-reset-filter-summary">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search:"
            className="pl-10 w-64"
            data-testid="input-search-summary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Pending Hour(s)</TableHead>
              <TableHead>Approved Timeoff</TableHead>
              <TableHead>Total Hour(s) Approved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.pendingHours}</TableCell>
                <TableCell>{item.approvedTimeoff}</TableCell>
                <TableCell className="font-medium">{item.totalHoursApproved}</TableCell>
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
      case "approval":
        return "Manage Timeoff Approval";
      case "report":
        return "Manage Timeoff Report";
      case "summary":
        return "Manage Timeoff Summary";
      default:
        return "Manage Timeoff Approval";
    }
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case "approval":
        return "Home > Timeoff > Approval";
      case "report":
        return "Home > Timeoff > Report";
      case "summary":
        return "Home > Timeoff > Summary";
      default:
        return "Home > Timeoff > Approval";
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
        {activeTab === "approval" && renderApprovalTab()}
        {activeTab === "report" && renderReportTab()}
        {activeTab === "summary" && renderSummaryTab()}
      </div>
    </DashboardLayout>
  );
}