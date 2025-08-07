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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Printer,
  Eye,
  Edit,
  Play
} from "lucide-react";

export default function SalaryPayrollPage() {
  const [dateRange, setDateRange] = useState("01/2025 - 12/2025");
  const [selectedEmployee, setSelectedEmployee] = useState("All employee");

  // Sample data for Employee Salary Table
  const employeeData = [
    {
      id: 1,
      name: "SITI NADIAH SABRI",
      employeeNo: "TEMP-7845*",
      designation: "",
      dateJoining: "03 Aug 2025",
      status: "Employed - Not Applicable"
    },
    {
      id: 2,
      name: "Madrah Samsi",
      employeeNo: "TEMP-7940*",
      designation: "Operator",
      dateJoining: "03 Aug 2025",
      status: "Employed - Not Applicable"
    }
  ];

  const allEmployees = ["All employee", "SITI NADIAH SABRI", "Madrah Samsi"];

  const renderPayrollListTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Year</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Month</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Payroll Date</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Status</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Remarks</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="p-8 text-center text-gray-500">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmployeeSalaryTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-64">Name</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Designation</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Date Joining</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-48">Status</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {employeeData.map((employee, index) => (
              <tr key={employee.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-gray-600">{index + 1}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-900">{employee.name}</div>
                  <div className="text-xs text-gray-500">(Employee No. {employee.employeeNo})</div>
                </td>
                <td className="p-3 text-gray-600">{employee.designation}</td>
                <td className="p-3 text-gray-600">{employee.dateJoining}</td>
                <td className="p-3">
                  <Badge 
                    variant="secondary"
                    className="bg-cyan-100 text-cyan-800 text-xs"
                  >
                    {employee.status}
                  </Badge>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 border-gray-300"
                      data-testid={`button-view-${employee.id}`}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 border-gray-300"
                      data-testid={`button-edit-${employee.id}`}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTaskTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Year</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Month</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Payroll Date</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Status</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-500">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Year</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Month</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Payroll Date</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Status</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Remarks</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="p-8 text-center text-gray-500">
                No data available in table
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSummaryTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 min-w-48">Name</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Salary</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Additional</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Gross</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Deduction</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Contribution</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24 bg-cyan-50">EPF</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Net Salary</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} className="p-8 text-center text-gray-500">
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
              <span>Home &gt; Payment &gt; Salary Payroll</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Salary Payroll</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="salary-payroll-list" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-auto grid-cols-5 bg-gray-100">
              <TabsTrigger 
                value="salary-payroll-list" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white px-4"
                data-testid="tab-salary-payroll-list"
              >
                Salary Payroll List
              </TabsTrigger>
              <TabsTrigger 
                value="employee-salary-table" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white px-4"
                data-testid="tab-employee-salary-table"
              >
                Employee Salary Table
              </TabsTrigger>
              <TabsTrigger 
                value="task" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white px-4"
                data-testid="tab-task"
              >
                Task
              </TabsTrigger>
              <TabsTrigger 
                value="report" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white px-4"
                data-testid="tab-report"
              >
                Report
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white px-4"
                data-testid="tab-summary"
              >
                Summary
              </TabsTrigger>
            </TabsList>

            {/* Run Payment Button - only show on Salary Payroll List tab */}
            <Button 
              className="bg-blue-900 hover:bg-blue-800 text-white"
              data-testid="button-run-payment"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Payment
            </Button>
          </div>

          {/* Salary Payroll List Tab */}
          <TabsContent value="salary-payroll-list" className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Salary Payroll List</h3>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  placeholder="Search..."
                  className="w-48"
                  data-testid="input-search-payroll-list"
                />
              </div>
            </div>

            {renderPayrollListTable()}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 0 to 0 of 0 entries</span>
              <div className="flex items-center space-x-2">
                <span>Previous</span>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>

          {/* Employee Salary Table Tab */}
          <TabsContent value="employee-salary-table" className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Employee Salary List</h3>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  placeholder="Search..."
                  className="w-48"
                  data-testid="input-search-employee-salary"
                />
              </div>
            </div>

            {renderEmployeeSalaryTable()}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 1 to {employeeData.length} of {employeeData.length} entries</span>
              <div className="flex items-center space-x-2">
                <span>Previous</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-600 text-white border-blue-600"
                >
                  1
                </Button>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>

          {/* Task Tab */}
          <TabsContent value="task" className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Salary Payroll Task</h3>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  placeholder="Search..."
                  className="w-48"
                  data-testid="input-search-task"
                />
              </div>
            </div>

            {renderTaskTable()}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 0 to 0 of 0 entries</span>
              <div className="flex items-center space-x-2">
                <span>Previous</span>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Salary Payroll Report List</h3>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  placeholder="Search..."
                  className="w-48"
                  data-testid="input-search-report"
                />
              </div>
            </div>

            {renderReportTable()}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 0 to 0 of 0 entries</span>
              <div className="flex items-center space-x-2">
                <span>Previous</span>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Salary Payroll Summary</h3>
            </div>

            {/* Summary Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Date Period</label>
                  <Input
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-48"
                    placeholder="01/2025 - 12/2025"
                    data-testid="input-date-period"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Employee</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-40" data-testid="select-employee-summary">
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

              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-search-summary"
                >
                  <Search className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300"
                  data-testid="button-print-summary"
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {renderSummaryTable()}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 0 to 0 of 0 entries</span>
              <div className="flex items-center space-x-2">
                <span>Previous</span>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}