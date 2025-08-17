import React, { useState, useEffect, useRef } from "react";
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search,
  Printer,
  Eye,
  Edit,
  Play,
  Settings,
  ChevronDown
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function SalaryPayrollPage() {
  const { toast } = useToast();
  const { user: userData } = useAuth();



  const [showNewPayrollModal, setShowNewPayrollModal] = useState(false);
  const [showSalarySummaryModal, setShowSalarySummaryModal] = useState(false);
  const [selectedEmployeeForSummary, setSelectedEmployeeForSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("salary-payroll-list");
  
  // Overtime Rate Settings
  const [showOvertimeDropdown, setShowOvertimeDropdown] = useState(false);
  const [overtimeRateType, setOvertimeRateType] = useState("fixed");
  const [customOvertimeRate, setCustomOvertimeRate] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOvertimeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [payrollFormData, setPayrollFormData] = useState({
    year: "2025",
    month: "August",
    paymentDate: "2025-08-08",
    remarks: "Payment Remark",
    claimFinancial: true,
    claimOvertime: true,
    unpaidLeave: true,
    lateness: false
  });

  // Fetch real employee data from database
  const { data: employeesFromDB = [], isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch employee salary data for selected employee
  const { data: employeeSalaryData, isLoading: isLoadingSalary } = useQuery({
    queryKey: ["/api/employees", selectedEmployeeForSummary?.id, "salary"],
    enabled: !!selectedEmployeeForSummary?.id,
  });

  // Calculate overtime rate based on basic salary and type
  const calculateOvertimeRate = (basicSalary: number, dayType: 'normal' | 'rest' | 'holiday' = 'normal') => {
    const hourlyRate = basicSalary / 26 / 8; // Basic hourly rate
    
    if (overtimeRateType === 'custom') {
      return customOvertimeRate;
    }
    
    // Fixed rate calculation based on Employment Act 1955
    switch (dayType) {
      case 'normal': return hourlyRate * 1.5;
      case 'rest': return hourlyRate * 2.0;
      case 'holiday': return hourlyRate * 3.0;
      default: return hourlyRate * 1.5;
    }
  };

  // Calculate derived values from real salary data
  const calculateSalarySummary = (salaryData: any) => {
    if (!salaryData) return { netSalary: 0, grossSalary: 0, totalDeduction: 0, companyContribution: 0 };

    const basicSalary = parseFloat(salaryData.basicSalary || 0);
    const additionalItems = salaryData.additionalItems || [];
    const deductions = salaryData.deductions || {};
    const contributions = salaryData.contributions || {};

    // Calculate total additional earnings
    const totalAdditionalEarnings = additionalItems.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.amount || 0));
    }, 0);

    // Calculate gross salary
    const grossSalary = basicSalary + totalAdditionalEarnings;

    // Calculate total deductions
    const totalDeduction = 
      (parseFloat(deductions.epfEmployee || 0)) +
      (parseFloat(deductions.socsoEmployee || 0)) +
      (parseFloat(deductions.eisEmployee || 0)) +
      (parseFloat(deductions.advance || 0)) +
      (parseFloat(deductions.unpaidLeave || 0)) +
      (parseFloat(deductions.pcb39 || 0)) +
      (parseFloat(deductions.pcb38 || 0)) +
      (parseFloat(deductions.zakat || 0)) +
      (parseFloat(deductions.other || 0));

    // Calculate net salary
    const netSalary = grossSalary - totalDeduction;

    // Calculate total company contribution
    const companyContribution = 
      (parseFloat(contributions.epfEmployer || 0)) +
      (parseFloat(contributions.socsoEmployer || 0)) +
      (parseFloat(contributions.eisEmployer || 0)) +
      (parseFloat(contributions.medicalCard || 0)) +
      (parseFloat(contributions.groupTermLife || 0)) +
      (parseFloat(contributions.medicalCompany || 0)) +
      (parseFloat(contributions.hrdf || 0));

    return { netSalary, grossSalary, totalDeduction, companyContribution };
  };

  const salarySummary = calculateSalarySummary(employeeSalaryData);

  // Helper function to get additional item amount by code
  const getAdditionalItemAmount = (code: string) => {
    if (!employeeSalaryData?.additionalItems) return 0;
    const item = employeeSalaryData.additionalItems.find((item: any) => item.code === code);
    return parseFloat(item?.amount || 0);
  };

  // Format employee data for salary table
  const employeeData = employeesFromDB.map((employee: any, index) => ({
    id: employee.id,
    name: employee.fullName,
    employeeNo: employee.employment?.employeeNo || `EMP-${employee.id}`,
    designation: employee.employment?.designation || "",
    dateJoining: employee.employment?.dateJoining ? new Date(employee.employment.dateJoining).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    }) : "N/A",
    status: employee.status === "employed" ? "Employed - Active" : 
            employee.status === "terminated" ? "Terminated" : 
            employee.status === "retired" ? "Retired" : 
            "Employed - Not Applicable"
  }));


  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = ["2023", "2024", "2025", "2026"];

  const handlePayrollInputChange = (field: string, value: string | boolean) => {
    setPayrollFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewEmployeeSalary = (employee: any) => {
    setSelectedEmployeeForSummary(employee);
    setShowSalarySummaryModal(true);
  };

  // Fetch employee details including employment and contact data
  const { data: employeeDetails } = useQuery({
    queryKey: ["/api/employees", selectedEmployeeForSummary?.id, "details"],
    enabled: !!selectedEmployeeForSummary?.id,
  });

  // Fetch payroll documents
  const { data: payrollDocuments = [], isLoading: isLoadingPayrollDocuments } = useQuery({
    queryKey: ["/api/payroll/documents"],
  });



  // Create payroll document mutation
  const createPayrollDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/payroll/documents', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payroll Document Created",
        description: `Payroll untuk ${payrollFormData.month} ${payrollFormData.year} telah dicipta dan perlu approval`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/documents"] });
      setShowNewPayrollModal(false);
    },
    onError: (error: any) => {
      console.error("Create payroll error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mencipta payroll document",
        variant: "destructive",
      });
    },
  });





  const handleGeneratePayroll = () => {
    console.log("Generating payroll with data:", payrollFormData);
    
    // Convert month name to number
    const monthMap = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    
    // Create payroll document with status "PendingApproval"
    const payrollDocument = {
      year: parseInt(payrollFormData.year),
      month: monthMap[payrollFormData.month as keyof typeof monthMap] || new Date().getMonth() + 1,
      payrollDate: payrollFormData.paymentDate,
      remarks: payrollFormData.remarks,
      status: "PendingApproval",
      includeFlags: JSON.stringify({
        includeClaims: payrollFormData.claimFinancial,
        includeOvertime: payrollFormData.claimOvertime,
        includeUnpaidLeave: payrollFormData.unpaidLeave,
        includeLateness: payrollFormData.lateness || false,
      }),
    };

    createPayrollDocumentMutation.mutate(payrollDocument);
  };

  // Generate payroll items mutation  
  const generatePayrollItemsMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiRequest('POST', `/api/payroll/documents/${documentId}/generate`, {});
      return response.json();
    },
    onSuccess: (data, documentId) => {
      toast({
        title: "Payroll Items Generated",
        description: "Slip gaji untuk semua pekerja telah dijana",
      });
      // Navigate to payroll details page
      window.location.href = `/payment/salary-payroll/view/${documentId}`;
    },
    onError: (error: any) => {
      console.error("Generate payroll items error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menjana slip gaji pekerja",
        variant: "destructive",
      });
    },
  });

  const handleViewPayrollDocument = (documentId: string, status: string) => {
    // Allow viewing documents in any status for approval purposes
    // Generate payroll items first to ensure data is available, then navigate
    generatePayrollItemsMutation.mutate(documentId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { className: "bg-yellow-100 text-yellow-800", text: "Pending" },
      approved: { className: "bg-green-100 text-green-800", text: "Approved" },
      rejected: { className: "bg-red-100 text-red-800", text: "Rejected" },
      Preparing: { className: "bg-blue-100 text-blue-800", text: "Preparing" },
      PendingApproval: { className: "bg-yellow-100 text-yellow-800", text: "Pending Approval" },
      Approved: { className: "bg-green-100 text-green-800", text: "Approved" },
      Rejected: { className: "bg-red-100 text-red-800", text: "Rejected" },
      sent: { className: "bg-purple-100 text-purple-800", text: "Sent" },
      Closed: { className: "bg-gray-100 text-gray-800", text: "Closed" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Preparing;
    
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.text}
      </Badge>
    );
  };

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
            {isLoadingPayrollDocuments ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Loading payroll documents...
                </td>
              </tr>
            ) : payrollDocuments.length > 0 ? (
              payrollDocuments.map((document: any, index: number) => (
                <tr key={document.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-600">{index + 1}</td>
                  <td className="p-3 text-gray-900">{document.year}</td>
                  <td className="p-3 text-gray-900">{document.month}</td>
                  <td className="p-3 text-gray-600">
                    {(() => {
                      try {
                        if (!document.payrollDate) return 'N/A';
                        const date = new Date(document.payrollDate);
                        if (isNaN(date.getTime())) return 'Invalid Date';
                        return date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        });
                      } catch (error) {
                        console.error('Date parsing error:', error, 'for date:', document.payrollDate);
                        return 'Date Error';
                      }
                    })()}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(document.status)}
                  </td>
                  <td className="p-3 text-gray-600">
                    {document.status === 'Rejected' && document.rejectionReason 
                      ? document.rejectionReason 
                      : document.remarks || 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-1 h-7 w-7 border-gray-300"
                        onClick={() => handleViewPayrollDocument(document.id, document.status)}
                        data-testid={`button-edit-payroll-${document.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            )}
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
            {isLoadingEmployees ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Loading employee data...
                </td>
              </tr>
            ) : employeeData.length > 0 ? (
              employeeData.map((employee, index) => (
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
                        onClick={() => handleViewEmployeeSalary(employee)}
                        data-testid={`button-view-${employee.id}`}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-1 h-7 w-7 border-gray-300"
                        onClick={() => window.location.href = `/employee-salary/${employee.id}`}
                        data-testid={`button-edit-${employee.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No employee data available
                </td>
              </tr>
            )}
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
          
          {/* Run Payment Button - moved to header, only show on Salary Payroll List tab */}
          {activeTab === "salary-payroll-list" && (
            <Button 
              className="bg-blue-900 hover:bg-blue-800 text-white"
              onClick={() => setShowNewPayrollModal(true)}
              data-testid="button-run-payment"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Payment
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-auto grid-cols-2 bg-gray-100">
            <TabsTrigger 
              value="salary-payroll-list" 
              className="data-[state=active]:bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 data-[state=active]:text-white px-4"
              data-testid="tab-salary-payroll-list"
            >
              Salary Payroll List
            </TabsTrigger>
            <TabsTrigger 
              value="employee-salary-table" 
              className="data-[state=active]:bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 data-[state=active]:text-white px-4"
              data-testid="tab-employee-salary-table"
            >
              Employee Salary Table
            </TabsTrigger>
          </TabsList>

          {/* Salary Payroll List Tab */}
          <TabsContent value="salary-payroll-list" className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
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
            <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
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
                  className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white border-blue-600"
                >
                  1
                </Button>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>


        </Tabs>

        {/* Run New Payroll Modal */}
        <Dialog open={showNewPayrollModal} onOpenChange={setShowNewPayrollModal}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-blue-900 text-white p-4 -m-6 mb-6 rounded-t-lg">
              <DialogTitle className="text-lg font-semibold">Run New Payroll</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Payroll Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Payroll Information</h4>
                
                {/* Year */}
                <div className="space-y-2">
                  <Label htmlFor="payroll-year" className="text-sm font-medium">Year</Label>
                  <Select value={payrollFormData.year} onValueChange={(value) => handlePayrollInputChange('year', value)}>
                    <SelectTrigger data-testid="select-payroll-year">
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

                {/* Month */}
                <div className="space-y-2">
                  <Label htmlFor="payroll-month" className="text-sm font-medium">Month</Label>
                  <Select value={payrollFormData.month} onValueChange={(value) => handlePayrollInputChange('month', value)}>
                    <SelectTrigger data-testid="select-payroll-month">
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

                {/* Payment Date */}
                <div className="space-y-2">
                  <Label htmlFor="payroll-payment-date" className="text-sm font-medium">Payment Date</Label>
                  <Input
                    id="payroll-payment-date"
                    type="date"
                    value={payrollFormData.paymentDate}
                    onChange={(e) => handlePayrollInputChange('paymentDate', e.target.value)}
                    data-testid="input-payroll-payment-date"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="payroll-remarks" className="text-sm font-medium">Remarks</Label>
                  <Textarea
                    id="payroll-remarks"
                    value={payrollFormData.remarks}
                    onChange={(e) => handlePayrollInputChange('remarks', e.target.value)}
                    placeholder="Payment Remark"
                    rows={3}
                    data-testid="textarea-payroll-remarks"
                  />
                </div>
              </div>

              {/* Include Into Payroll Section */}
              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-medium text-gray-700">Include Into payroll</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="claim-financial" className="text-sm font-medium">Claim Financial</Label>
                  <Switch
                    id="claim-financial"
                    checked={payrollFormData.claimFinancial}
                    onCheckedChange={(checked) => handlePayrollInputChange('claimFinancial', checked)}
                    data-testid="switch-claim-financial"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="claim-overtime" className="text-sm font-medium">Claim Overtime</Label>
                  <Switch
                    id="claim-overtime"
                    checked={payrollFormData.claimOvertime}
                    onCheckedChange={(checked) => handlePayrollInputChange('claimOvertime', checked)}
                    data-testid="switch-claim-overtime"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="unpaid-leave" className="text-sm font-medium">Unpaid Leave</Label>
                  <Switch
                    id="unpaid-leave"
                    checked={payrollFormData.unpaidLeave}
                    onCheckedChange={(checked) => handlePayrollInputChange('unpaidLeave', checked)}
                    data-testid="switch-unpaid-leave"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lateness" className="text-sm font-medium">Lateness</Label>
                  <Switch
                    id="lateness"
                    checked={payrollFormData.lateness}
                    onCheckedChange={(checked) => handlePayrollInputChange('lateness', checked)}
                    data-testid="switch-lateness"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowNewPayrollModal(false)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  data-testid="button-cancel-payroll"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGeneratePayroll}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-generate-payroll"
                >
                  Generate Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Salary Summary Modal */}
        <Dialog open={showSalarySummaryModal} onOpenChange={setShowSalarySummaryModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 -m-6 mb-6 rounded-t-lg">
              <DialogTitle className="text-lg font-semibold">
                {selectedEmployeeForSummary?.name || 'Employee'} - Salary Summary
              </DialogTitle>
            </DialogHeader>

            {selectedEmployeeForSummary && (
              <Tabs defaultValue="salary-details" className="space-y-6">
                <div className="flex space-x-4 border-b">
                  <TabsList className="grid w-auto grid-cols-2 bg-transparent">
                    <TabsTrigger 
                      value="salary-details" 
                      className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 px-4 border-b-2 border-transparent data-[state=active]:border-cyan-600"
                    >
                      Salary Details
                    </TabsTrigger>
                    <TabsTrigger 
                      value="personal-details" 
                      className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 px-4 border-b-2 border-transparent data-[state=active]:border-cyan-600"
                    >
                      Personal Details
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Salary Details Tab */}
                <TabsContent value="salary-details" className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Net Salary</div>
                      <div className="text-2xl font-bold text-blue-900">
                        RM {salarySummary.netSalary.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Gross Salary</div>
                      <div className="text-2xl font-bold text-blue-900">
                        RM {salarySummary.grossSalary.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Deduction</div>
                      <div className="text-2xl font-bold text-blue-900">
                        RM {salarySummary.totalDeduction.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Company Contribution</div>
                      <div className="text-2xl font-bold text-blue-900">
                        RM {salarySummary.companyContribution.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Gross Salary Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Gross Salary</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span>Basic Salary</span>
                        </div>
                        <span>RM {parseFloat(employeeSalaryData?.basicSalary || 0).toFixed(2)}</span>
                      </div>
                      
                      {/* Overtime Rate in Basic Earning */}
                      <div className="flex justify-between items-center relative bg-yellow-50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-orange-800">Overtime Rate</span>
                          <button
                            onClick={() => {
                              console.log('Overtime settings clicked!', !showOvertimeDropdown);
                              setShowOvertimeDropdown(!showOvertimeDropdown);
                            }}
                            className="p-1 text-orange-600 hover:text-orange-800 bg-orange-100 rounded"
                            data-testid="button-overtime-settings"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium">RM</span>
                          <Input
                            value={overtimeRateType === 'fixed' 
                              ? calculateOvertimeRate(parseFloat(employeeSalaryData?.basicSalary || 0)).toFixed(2)
                              : customOvertimeRate.toFixed(2)
                            }
                            readOnly={overtimeRateType === 'fixed'}
                            onChange={(e) => setCustomOvertimeRate(parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-sm h-7 px-2 font-semibold border-2"
                            data-testid="input-overtime-rate"
                          />
                        </div>
                        
                        {/* Overtime Settings Dropdown */}
                        {showOvertimeDropdown && (
                          <div 
                            ref={dropdownRef}
                            className="absolute top-6 right-0 w-56 bg-white border rounded-lg shadow-xl p-2 z-50"
                          >
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-700 border-b pb-1">Pilih Mode:</div>
                              <button
                                onClick={() => {
                                  setOvertimeRateType('fixed');
                                  setShowOvertimeDropdown(false);
                                }}
                                className={`w-full text-left p-2 text-sm rounded hover:bg-gray-100 ${
                                  overtimeRateType === 'fixed' ? 'bg-blue-50 text-blue-700' : ''
                                }`}
                                data-testid="button-fixed-rate"
                              >
                                <div className="font-medium">Fixed</div>
                                <div className="text-xs text-gray-500">Guna formula standard</div>
                              </button>
                              <button
                                onClick={() => {
                                  setOvertimeRateType('custom');
                                  setShowOvertimeDropdown(false);
                                }}
                                className={`w-full text-left p-2 text-sm rounded hover:bg-gray-100 ${
                                  overtimeRateType === 'custom' ? 'bg-blue-50 text-blue-700' : ''
                                }`}
                                data-testid="button-custom-rate"
                              >
                                <div className="font-medium">Custom</div>
                                <div className="text-xs text-gray-500">Admin masukkan sendiri kadar</div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Salary</span>
                        <span>RM {getAdditionalItemAmount('ADV').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Salary Unit</span>
                        <span>1</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone Allowance</span>
                        <span>RM 0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Salary Type</span>
                        <span>{employeeSalaryData?.salaryType || 'Monthly'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Subsistence Allowance</span>
                        <span>RM {getAdditionalItemAmount('SUBS').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Salary</span>
                        <span>RM {parseFloat(employeeSalaryData?.basicSalary || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Responsibility Allowance</span>
                        <span>RM {getAdditionalItemAmount('RESP').toFixed(2)}</span>
                      </div>

                    </div>
                  </div>

                  {/* Deduction Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Deduction</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>EPF Employee</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.epfEmployee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.advance || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SOCSO Employee</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.socsoEmployee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unpaid Leave</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.unpaidLeave || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EIS Employee</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.eisEmployee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Deduction</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.other || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PCB 39</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.pcb39 || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zakat</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.zakat || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PCB 38</span>
                        <span>RM {parseFloat(employeeSalaryData?.deductions?.pcb38 || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Company Contribution Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Contribution</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>EPF Employer</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.epfEmployer || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medical Card</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.medicalCard || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SOCSO Employer</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.socsoEmployer || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Group Term Life</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.groupTermLife || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EIS Employer</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.eisEmployer || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medical Company</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.medicalCompany || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HRDF</span>
                        <span>RM {parseFloat(employeeSalaryData?.contributions?.hrdf || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Personal Details Tab */}
                <TabsContent value="personal-details" className="space-y-6">
                  {/* Personal Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Details</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Name</span>
                        <span>{employeeDetails?.employees?.fullName || selectedEmployeeForSummary?.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Company</span>
                        <span>{employeeDetails?.employment?.company || 'UtamaHR'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employee ID</span>
                        <span>{selectedEmployeeForSummary?.staffId || employeeDetails?.employees?.staffId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Department</span>
                        <span>{employeeDetails?.employment?.department || 'Human Resource'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>NRIC</span>
                        <span>{employeeDetails?.employees?.nric || selectedEmployeeForSummary?.nric || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Designation</span>
                        <span>{employeeDetails?.employment?.designation || 'Not Stated'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date of Birth</span>
                        <span>{employeeDetails?.employees?.dateOfBirth ? new Date(employeeDetails.employees.dateOfBirth).toLocaleDateString() : (selectedEmployeeForSummary?.dateOfBirth ? new Date(selectedEmployeeForSummary.dateOfBirth).toLocaleDateString() : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date Joining</span>
                        <span>{employeeDetails?.employment?.dateJoining ? new Date(employeeDetails.employment.dateJoining).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Employee Status</span>
                        <span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {employeeDetails?.employment?.employmentStatus === 'Employed' ? 'Include in Payroll / Payment' : 'Include in Payroll / Payment'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contribution Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contribution Details</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>SOCSO/EIS No</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deduction SOCSO/EIS</span>
                        <span>Wages up to RM4000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EPF No</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deduction EPF Employee</span>
                        <span>8.00 % (Policy)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>EPF Contribution Start Date</span>
                        <span>After 1 August 2021</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deduction EPF Employer</span>
                        <span>13.00 % (Policy)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Income Tax No</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deduction HRDF</span>
                        <span>1.00%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Bank Details</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Bank</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account Type</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account No</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account Status</span>
                        <span>Not Stated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Branch</span>
                        <span>Not Stated</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}