import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Printer,
  Edit,
  Check,
} from "lucide-react";

export default function LatenessPage() {
  const [selectedMonth, setSelectedMonth] = useState("August");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedDepartment, setSelectedDepartment] = useState("All department");
  const [selectedEmployee, setSelectedEmployee] = useState("All employee");
  const [dateRange, setDateRange] = useState("01/08/2025 - 31/08/2025");
  const [currentPage, setCurrentPage] = useState(1);

  // Sample data for lateness
  const latenessData = [
    {
      id: 1,
      name: "SITI NADIAH SABRI",
      totalWorkHour: "00:00:00",
      totalLateness: "00:00 h",
      status: "Pending",
      dailyLateness: {
        "31 Jul": "0h", "1 Aug": "0h", "2 Aug": "0h", "3 Aug": "0h", 
        "4 Aug": "0h", "5 Aug": "0h", "6 Aug": "0h"
      }
    },
    {
      id: 2,
      name: "Madrah Samsi",
      totalWorkHour: "00:00:00",
      totalLateness: "00:00 h",
      status: "Pending",
      dailyLateness: {
        "31 Jul": "0h", "1 Aug": "0h", "2 Aug": "0h", "3 Aug": "0h", 
        "4 Aug": "0h", "5 Aug": "0h", "6 Aug": "0h"
      }
    }
  ];

  // Sample data for report
  const reportData: any[] = [];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = ["2023", "2024", "2025"];
  const departments = ["All department", "Human Resource", "IT", "Finance"];
  const allEmployees = ["All employee", "SITI NADIAH SABRI", "Madrah Samsi"];

  // Generate date columns for the selected month
  const getDateColumns = () => {
    const sampleDates = ["31 Jul", "1 Aug", "2 Aug", "3 Aug", "4 Aug", "5 Aug", "6 Aug"];
    return sampleDates;
  };

  const dateColumns = getDateColumns();

  const renderLatenessTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 sticky left-0 bg-gray-50 min-w-48">
                Employee
              </th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">
                Total Work Hour
              </th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">
                Total Lateness
              </th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">
                Lateness Status
              </th>
              {dateColumns.map((date, index) => (
                <th key={index} className="text-center p-3 font-medium text-gray-900 min-w-20">
                  {date}
                </th>
              ))}
              <th className="text-center p-3 font-medium text-gray-900 min-w-20">
                Action
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {latenessData.map((employee) => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                  {employee.name}
                </td>
                <td className="p-3 text-center text-gray-600">
                  {employee.totalWorkHour}
                </td>
                <td className="p-3 text-center text-gray-600">
                  {employee.totalLateness}
                </td>
                <td className="p-3 text-center">
                  <Badge 
                    variant="secondary"
                    className="bg-gray-800 text-white"
                  >
                    {employee.status}
                  </Badge>
                </td>
                {dateColumns.map((date, dateIndex) => (
                  <td key={dateIndex} className="p-3 text-center text-gray-600">
                    {(employee.dailyLateness as any)[date] || "0h"}
                  </td>
                ))}
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 border-gray-300"
                      data-testid={`button-edit-${employee.id}`}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 border-green-300 text-green-600 hover:bg-green-50"
                      data-testid={`button-approve-${employee.id}`}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Empty state when no data */}
            {latenessData.length === 0 && (
              <tr>
                <td colSpan={dateColumns.length + 5} className="p-8 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Table Header */}
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No.</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-48">Employee</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Reason</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Start Time</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">End Time</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Total Hour</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Total Amount</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-32">Approval Date</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {/* Empty state */}
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <span>Home &gt; Attendance &gt; Lateness</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Lateness</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lateness" className="space-y-6">
          <TabsList className="grid w-60 grid-cols-2 bg-gray-100">
            <TabsTrigger 
              value="lateness" 
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              data-testid="tab-attendance-lateness"
            >
              Attendance Lateness
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              data-testid="tab-report"
            >
              Report
            </TabsTrigger>
          </TabsList>

          {/* Attendance Lateness Tab */}
          <TabsContent value="lateness" className="space-y-6">
            {/* Attendance Lateness Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Attendance Lateness</h3>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Month */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Month</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-32" data-testid="select-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-24" data-testid="select-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-40" data-testid="select-department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Employee</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-40" data-testid="select-employee">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allEmployees.map((emp) => (
                        <SelectItem key={emp} value={emp}>
                          {emp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300"
                  data-testid="button-print"
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Warning Notice */}
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                <strong>Note:</strong> Attendance Lateness function will be operational/available from October 2023 onwards, and any data predating this period will not be compatible or supported.
              </AlertDescription>
            </Alert>

            {/* Lateness Table */}
            {renderLatenessTable()}

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {latenessData.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Previous</span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={currentPage === 1 ? "bg-blue-600 text-white" : ""}
                    data-testid="page-1"
                  >
                    1
                  </Button>
                </div>
                <span className="text-sm text-gray-600">Next</span>
              </div>
            </div>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Lateness Approved Report</h3>
            </div>

            {/* Report Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Date Period */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Date Period</label>
                  <Input
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-56"
                    placeholder="01/08/2025 - 31/08/2025"
                    data-testid="input-date-range"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-40" data-testid="select-department-report">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Employee</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-40" data-testid="select-employee-report">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allEmployees.map((emp) => (
                        <SelectItem key={emp} value={emp}>
                          {emp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-search-report"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300"
                  data-testid="button-print-report"
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm text-gray-600">Search:</span>
            </div>

            {/* Report Table */}
            {renderReportTable()}

            {/* Report Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing 0 entries
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Previous</span>
                <span className="text-sm text-gray-600">Next</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}