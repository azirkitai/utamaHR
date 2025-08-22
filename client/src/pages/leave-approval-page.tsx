import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { useToast } from "@/hooks/use-toast";

type TabType = "approval" | "report" | "summary" | "balance-carry-forward";

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

// Remove sample data - using real database data only

export default function LeaveApprovalPage() {
  const [activeTab, setActiveTab] = useState<TabType>("approval");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState("all");
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leave applications based on active tab
  const { data: leaveApplications = [], isLoading, error } = useQuery<LeaveRecord[]>({
    queryKey: ["/api/leave-applications", activeTab, selectedYear, selectedDepartment], 
    queryFn: async () => {
      const mode = activeTab === 'approval' ? 'approval' : 'report';
      let url = `/api/leave-applications?mode=${mode}`;
      
      // Add filters for report tab
      if (activeTab === 'report' || activeTab === 'summary') {
        url += `&year=${selectedYear}`;
        if (selectedDepartment !== 'all') {
          url += `&department=${selectedDepartment}`;
        }
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch leave applications');
      }
      return response.json();
    },
    staleTime: 0, // No cache - always fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch active leave policies (company-enabled only)
  const { data: activeLeaveTypes = [] } = useQuery({
    queryKey: ["/api/company-leave-types/active"]
  });

  // Fetch leave statistics by type
  const { data: leaveStatistics = [] } = useQuery({
    queryKey: ["/api/leave-statistics"]
  });

  // Fetch employee leave summary for all employees
  const { data: employeeLeaveSummary = { employees: [], enabledLeaveTypes: [] } } = useQuery({
    queryKey: ["/api/leave-summary-all-employees", selectedDepartment, selectedYear],
    queryFn: async () => {
      let url = "/api/leave-summary-all-employees";
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') {
        params.append('department', selectedDepartment);
      }
      if (selectedYear) {
        params.append('year', selectedYear);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employee leave summary');
      }
      return response.json();
    },
  });

  // Fetch departments for dropdown filter
  const { data: departments = [], isLoading: departmentsLoading, error: departmentsError } = useQuery({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      console.log("Departments fetched:", data);
      return data;
    },
  });

  // Fetch years for dropdown filter (based on actual data)
  const { data: availableYears = [], isLoading: yearsLoading, error: yearsError } = useQuery({
    queryKey: ["/api/years"],
    queryFn: async () => {
      const response = await fetch('/api/years', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch years');
      }
      const data = await response.json();
      console.log("Years fetched:", data);
      return data;
    },
  });

  // Fetch carry forward records
  const { data: carryForwardRecords = [] } = useQuery({
    queryKey: ["/api/leave-balance-carry-forward", selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/leave-balance-carry-forward?year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch carry forward records');
      }
      return response.json();
    },
    enabled: activeTab === 'balance-carry-forward',
  });

  // Fetch current user's employee record and approval settings
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
  });

  // Fetch approval settings to check if current user is an approver
  const { data: approvalSettings } = useQuery({
    queryKey: ["/api/approval-settings/leave"],
    queryFn: async () => {
      const response = await fetch('/api/approval-settings/leave', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch approval settings');
      }
      return response.json();
    },
  });

  // Check if current user is an approver
  const isApprovalUser = () => {
    if (!currentUserEmployee || !approvalSettings) return false;
    
    const currentEmployeeId = (currentUserEmployee as any)?.id;
    const firstLevelApprover = (approvalSettings as any)?.firstLevelApprovalId;
    const secondLevelApprover = (approvalSettings as any)?.secondLevelApprovalId;
    
    return currentEmployeeId === firstLevelApprover || currentEmployeeId === secondLevelApprover;
  };

  // Mutation for approve/reject leave applications
  const approveRejectMutation = useMutation({
    mutationFn: async ({ id, action, comments }: { id: string; action: 'approve' | 'reject'; comments?: string }) => {
      const response = await fetch(`/api/leave-applications/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        },
        body: JSON.stringify({ action, comments }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memproses permohonan');
      }
      
      return response.json();
    },
    onSuccess: (data: any, variables) => {
      toast({
        title: "Berjaya!",
        description: data.message || "Application telah diproses",
        variant: "default",
      });
      // Refetch leave applications to get updated data
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications", activeTab] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal memproses permohonan",
        variant: "destructive",
      });
    },
  });

  // Filter functions
  const filterData = (data: LeaveRecord[]) => {
    if (!data) return [];
    
    return data.filter(record => {
      // Search query filter
      if (searchQuery && !record.applicant.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !record.leaveType.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Department filter (if implemented)
      if (selectedDepartment !== 'all') {
        // TODO: Add department filtering logic when department data is available
      }
      
      // Employee filter for report tab
      if (activeTab === 'report' && selectedEmployee !== 'all') {
        if (record.applicant !== selectedEmployee) {
          return false;
        }
      }
      
      // Leave type filter for report tab
      if (activeTab === 'report' && selectedLeaveType !== 'all') {
        if (record.leaveType !== selectedLeaveType) {
          return false;
        }
      }
      
      // Leave status filter for report tab  
      if (activeTab === 'report' && selectedLeaveStatus !== 'all') {
        if (record.status.toLowerCase() !== selectedLeaveStatus.toLowerCase()) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Get filtered data
  const filteredData = filterData(leaveApplications);

  // Handle search button click
  const handleSearch = () => {
    // The filtering is already happening in real-time via filteredData
    // This can be used for additional search logic if needed
    toast({
      title: "Carian Dilakukan",
      description: `Dijumpai ${filteredData.length} rekod of ${leaveApplications.length} jumlah rekod`,
      variant: "default",
    });
  };

  // Handle print report
  const handlePrintReport = async () => {
    try {
      const response = await fetch('/api/leave-report-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        },
        body: JSON.stringify({
          department: selectedDepartment,
          year: selectedYear,
          reportType: activeTab // 'approval', 'summary', etc.
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menghasilkan laporan PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const reportName = activeTab === 'summary' ? 'Ringkasan' : 'Application';
      const fileName = `Laporan_Leave_${reportName}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Laporan PDF Berjaya",
        description: `Laporan cuti ${reportName.toLowerCase()} telah dimuat turun`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Ralat",
        description: "Gagal menghasilkan laporan PDF. Sila cuba lagi.",
        variant: "destructive",
      });
    }
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedEmployee("all");
    setSelectedLeaveType("all");
    setSelectedLeaveStatus("all");
    toast({
      title: "Penapis Telah Dibersihkan",
      description: "All penapis telah diset semula",
      variant: "default",
    });
  };

  const handleApprove = (id: string) => {
    approveRejectMutation.mutate({ id, action: 'approve' });
  };

  const handleReject = (id: string) => {
    approveRejectMutation.mutate({ id, action: 'reject' });
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "approval":
        return "Manage Leave Approval";
      case "report":
        return "Manage Leave Report";
      case "summary":
        return "Manage Leave Summary";
      case "balance-carry-forward":
        return "Manage Balance Carry Forward";
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
      case "balance-carry-forward":
        return "Rekod Baki Leave Dibawa ke Limitapan";
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
        ) : filteredData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              Tiada permohonan cuti dijumpai
            </TableCell>
          </TableRow>
        ) : (
          filteredData.map((record: LeaveRecord, index: number) => (
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
                  {/* Only show approve/reject buttons to authorized approval users */}
                  {record.status === "Pending" && isApprovalUser() && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        onClick={() => handleApprove(record.id)}
                        disabled={approveRejectMutation.isPending}
                        data-testid={`button-approve-${record.id}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleReject(record.id)}
                        disabled={approveRejectMutation.isPending}
                        data-testid={`button-reject-${record.id}`}
                      >
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
        {filteredData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              Tiada data laporan cuti tersedia
            </TableCell>
          </TableRow>
        ) : (
          filteredData.map((record: LeaveRecord, index: number) => (
            <TableRow key={record.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{record.applicant}</TableCell>
              <TableCell>{getStatusBadge(record.status)}</TableCell>
              <TableCell>{record.leaveType}</TableCell>
              <TableCell>{new Date(record.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(record.endDate).toLocaleDateString()}</TableCell>
              <TableCell>{record.totalDays}</TableCell>
              <TableCell>{record.approve || 'Pending'}</TableCell>
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

  const renderSummaryTable = () => {
    if (!employeeLeaveSummary || !(employeeLeaveSummary as any)?.employees) {
      return (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead colSpan={3}>Loading...</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Loading employee leave summary...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    }

    const { employees, enabledLeaveTypes } = employeeLeaveSummary as any;

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12">No.</TableHead>
            <TableHead className="min-w-[150px]">Name</TableHead>
            {enabledLeaveTypes.map((leaveType: any) => (
              <TableHead key={leaveType.id} className="text-center min-w-[120px]">
                <div className="flex flex-col">
                  <span className="font-medium">{leaveType.leaveType}</span>
                  <span className="text-xs text-gray-500 font-normal">
                    ({leaveType.entitlementDays} days)
                  </span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={enabledLeaveTypes.length + 2} className="text-center py-8 text-gray-500">
                No employee data available
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee: any, index: number) => (
              <TableRow key={employee.employeeId} className="hover:bg-gray-50">
                <TableCell>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{employee.employeeName}</TableCell>
                {enabledLeaveTypes.map((leaveType: any) => {
                  const breakdown = employee.leaveBreakdown[leaveType.leaveType];
                  const usagePercentage = breakdown ? (breakdown.daysTaken / breakdown.entitlementDays * 100) : 0;
                  
                  return (
                    <TableCell key={leaveType.id} className="text-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-semibold ${breakdown?.daysTaken > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                            {breakdown?.daysTaken || 0}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600">{breakdown?.entitlementDays || 0}</span>
                        </div>
                        {breakdown?.applicationsCount > 0 && (
                          <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full text-xs font-medium">
                            {breakdown.applicationsCount} apps
                          </span>
                        )}
                        {breakdown && breakdown.daysTaken > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${usagePercentage > 80 ? 'bg-red-500' : usagePercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{width: `${Math.min(usagePercentage, 100)}%`}}
                            ></div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  

  const renderBalanceCarryForwardTable = () => {
    const summaryData = employeeLeaveSummary as any;
    if (!summaryData?.employees || summaryData.employees.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Tiada data cuti pekerja tersedia
        </div>
      );
    }

    return (
      <div className="space-y-6 p-6">
        {/* Employee Cards */}
        {summaryData.employees.map((employee: any, empIndex: number) => (
          <div key={employee.employeeId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Employee Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{employee.employeeName}</h3>
                </div>
                <div className="text-right">
                  <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium">
                    {Object.keys(employee.leaveBreakdown).length} Jenis Leave
                  </span>
                </div>
              </div>
            </div>

            {/* Employee Leave Entitlements Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16">No.</TableHead>
                    <TableHead>Jenis Leave</TableHead>
                    <TableHead className="text-center">Kelayakan</TableHead>
                    <TableHead className="text-center">Digunakan</TableHead>
                    <TableHead className="text-center">Baki Semasa</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(employee.leaveBreakdown).map(([leaveType, breakdown]: [string, any], index: number) => (
                    <TableRow 
                      key={`${employee.employeeId}-${leaveType}`} 
                      className={`hover:bg-gray-50 ${!breakdown.isEligible ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className={`font-medium ${!breakdown.isEligible ? 'text-gray-400' : ''}`}>
                        {leaveType}
                      </TableCell>
                      <TableCell className={`text-center ${!breakdown.isEligible ? 'text-gray-400' : ''}`}>
                        {breakdown.entitlementDays}
                      </TableCell>
                      <TableCell className={`text-center ${!breakdown.isEligible ? 'text-gray-400' : ''}`}>
                        {breakdown.daysTaken}
                      </TableCell>
                      <TableCell className={`text-center font-semibold ${!breakdown.isEligible ? 'text-gray-400' : 'text-cyan-600'}`}>
                        {breakdown.remainingDays}
                      </TableCell>
                      <TableCell className="text-center">
                        {!breakdown.isEligible ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            Dikecualikan
                          </span>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            breakdown.remainingDays > 0 
                              ? 'bg-green-100 text-green-800'
                              : breakdown.remainingDays === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {breakdown.remainingDays > 0 ? 'Tersedia' : breakdown.remainingDays === 0 ? 'Habis' : 'Terlebih'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Employee Summary Footer */}
            <div className="bg-gray-50 p-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {Object.values(employee.leaveBreakdown).reduce((sum: number, breakdown: any) => 
                      sum + (breakdown.entitlementDays || 0), 0
                    )}
                  </div>
                  <div className="text-gray-600">Jumlah Kelayakan</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {Object.values(employee.leaveBreakdown).reduce((sum: number, breakdown: any) => 
                      sum + (breakdown.daysTaken || 0), 0
                    )}
                  </div>
                  <div className="text-gray-600">Jumlah Digunakan</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-cyan-600">
                    {Object.values(employee.leaveBreakdown).reduce((sum: number, breakdown: any) => 
                      sum + (breakdown.remainingDays || 0), 0
                    )}
                  </div>
                  <div className="text-gray-600">Jumlah Baki</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCurrentTable = () => {
    switch (activeTab) {
      case "approval":
        return renderApprovalTable();
      case "report":
        return renderReportTable();
      case "summary":
        return renderSummaryTable();
      case "balance-carry-forward":
        return renderBalanceCarryForwardTable();
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
              { id: "balance-carry-forward", label: "Balance Carry Forward" }
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
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white px-6 py-4 rounded-t-lg">
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
                    {departments.map((dept: string) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
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
                        {(activeLeaveTypes as any[]).map((leaveType: any) => (
                          <SelectItem key={leaveType.id} value={leaveType.leaveType}>
                            {leaveType.leaveType}
                          </SelectItem>
                        ))}
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

              {(activeTab === "summary" || activeTab === "balance-carry-forward") && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Tahun</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="2025" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.length > 0 ? (
                        availableYears.map((year: number) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="2025">2025</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-auto">
                <Button 
                  variant="default" 
                  className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white"
                  onClick={handleSearch}
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {(searchQuery || selectedDepartment !== "all" || selectedEmployee !== "all" || selectedLeaveType !== "all" || selectedLeaveStatus !== "all") && (
                  <Button 
                    variant="outline"
                    onClick={handleClearFilters}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                )}
                
                {/* Print Button - only show for Balance Carry Forward tab */}
                {activeTab === "balance-carry-forward" && (
                  <Button 
                    variant="outline"
                    onClick={handlePrintReport}
                    data-testid="button-print"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                )}
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
                Showing {filteredData.length > 0 ? 1 : 0} to {filteredData.length} of {filteredData.length} entries
                {searchQuery && ` (filtered from ${leaveApplications.length} total entries)`}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                  placeholder="Cari mengikut nama atau jenis cuti..."
                  data-testid="input-search"
                />
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
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
                Showing {filteredData.length > 0 ? 1 : 0} to {filteredData.length} of {filteredData.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={true}
                  data-testid="button-previous"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={true}
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