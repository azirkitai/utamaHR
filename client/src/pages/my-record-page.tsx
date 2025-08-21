import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";
import { CalendarIcon, Download, Filter, Search, ChevronLeft, ChevronRight, Calendar as CalendarLucide, Clock, FileText, CreditCard, Users, DollarSign, Image, StickyNote, Eye, File, Share } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import type { AttendanceRecord, LeaveApplication, UserPayrollRecord, ClaimApplication } from "@shared/schema";
import { PayslipPDFDocument, buildPdfPropsFromTemplateData } from '@/components/PayslipPDFDocument';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

type TabType = "leave" | "claim" | "overtime" | "attendance" | "payment";

interface FilterState {
  dateFrom: Date;
  dateTo: Date;
  searchTerm: string;
  pageSize: number;
  claimType: string;
  claimStatus: string;
  overtimeStatus: string;
  leaveType: string;
  leaveStatus: string;
}

export default function MyRecordPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("leave");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: new Date(2025, 0, 1), // Start from January 1, 2025 to include all historical claims
    dateTo: new Date(),
    searchTerm: "",
    pageSize: 10,
    claimType: "all-claim-type",
    claimStatus: "all-claim-status",
    overtimeStatus: "all-overtime-status",
    leaveType: "all-leave-type",
    leaveStatus: "all-leave-status"
  });

  // Check if user has admin access to view other employees' data
  const hasAdminAccess = (user as any)?.role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes((user as any).role);

  // Fetch financial claim policies for dropdown options
  const { data: financialClaimPolicies = [] } = useQuery({
    queryKey: ['/api/financial-claim-policies'],
    queryFn: async () => {
      const token = localStorage.getItem('utamahr_token');
      const response = await fetch('/api/financial-claim-policies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch financial claim policies');
      }
      return response.json();
    }
  });

  // Fetch attendance records from database with simplified approach  
  const { data: rawAttendanceData, isLoading: isLoadingAttendance, error: attendanceError, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance-records', activeTab, user?.id, filters.dateFrom.toISOString(), filters.dateTo.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: format(filters.dateFrom, 'yyyy-MM-dd'),
        dateTo: format(filters.dateTo, 'yyyy-MM-dd'),
      });
      
      // Admin users can request specific employee data, non-admin users are automatically restricted to their own data by server
      if (hasAdminAccess && filters.searchTerm) {
        params.append('employeeId', filters.searchTerm);
      }
      
      console.log('Fetching attendance records with params:', params.toString());
      
      // Get JWT token from localStorage  
      const token = localStorage.getItem('utamahr_token');
      console.log('JWT Token found:', !!token, 'Length:', token?.length);
      if (!token) {
        console.error('No JWT token found in localStorage');
        throw new Error('No authentication token found - please login again');
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
        console.error('Attendance records API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }
      
      const data = await response.json();
      console.log('🎯 Attendance records fetched:', data.length, 'records');
      
      // Debug ALL records to ensure compliance data is complete
      data.forEach((record: any, index: number) => {
        console.log(`Record ${index + 1}:`, {
          id: record.id,
          date: record.date,
          clockInTime: record.clockInTime,
          isLateClockIn: record.isLateClockIn,
          clockInRemarks: record.clockInRemarks
        });
        
        if (record.isLateClockIn) {
          console.log(`🚨 LATE DETECTED in Record ${index + 1}:`, record.clockInRemarks);
        }
      });
      
      return data as AttendanceRecord[];
    },
    enabled: !!user && activeTab === 'attendance',
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, 
    gcTime: 0
  });

  // Extract attendance records
  const attendanceRecords = rawAttendanceData || [];

  // Apply client-side filtering for attendance records
  const searchFilteredAttendanceRecords = useMemo(() => {
    if (!attendanceRecords) return [];
    
    return attendanceRecords.filter((record) => {
      // Date range filter
      const recordDate = new Date(record.date);
      const isInDateRange = recordDate >= filters.dateFrom && recordDate <= filters.dateTo;
      
      if (!isInDateRange) return false;
      
      // Search filter (search in employee name if available)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          (record.employeeName && record.employeeName.toLowerCase().includes(searchTerm)) ||
          (record.fullName && record.fullName.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [attendanceRecords, filters.dateFrom, filters.dateTo, filters.searchTerm]);

  // Trigger refetch when switching to attendance tab
  useEffect(() => {
    if (activeTab === 'attendance' && user) {
      console.log('📋 Switching to attendance tab - triggering refetch');
      refetchAttendance();
    }
  }, [activeTab, user, refetchAttendance]);

  // Debug loading state
  console.log('🔧 ATTENDANCE DEBUG:', {
    activeTab,
    user: !!user,
    isLoadingAttendance,
    attendanceRecordsLength: attendanceRecords.length,
    attendanceError: attendanceError?.message,
    queryEnabled: !!user && activeTab === 'attendance'
  });

  // Force debug of actual data
  if (activeTab === 'attendance' && attendanceRecords.length > 0) {
    console.log('✅ ATTENDANCE DATA READY:', attendanceRecords.length, 'records');
    console.log('🎯 Late clock-in found:', attendanceRecords.filter(r => (r as any).isLateClockIn));
  }

  // Fetch leave applications from database with filters
  const { data: rawLeaveApplications = [], isLoading: isLoadingLeave, error: leaveError } = useQuery({
    queryKey: ['/api/leave-applications', filters.dateFrom.toISOString(), filters.dateTo.toISOString()],
    queryFn: async () => {
      console.log('Fetching leave applications...');
      
      // Get JWT token from localStorage  
      const token = localStorage.getItem('utamahr_token');
      if (!token) {
        console.error('No JWT token found in localStorage');
        throw new Error('No authentication token found - please login again');
      }
      
      const response = await fetch(`/api/leave-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Leave applications API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch leave applications');
      }
      
      const data = await response.json();
      console.log('Leave applications fetched:', data.length, 'records');
      return data as LeaveApplication[];
    },
    enabled: !!user && activeTab === 'leave'
  });

  // Apply client-side filtering for leave applications
  const leaveApplications = useMemo(() => {
    if (!rawLeaveApplications) return [];
    
    return rawLeaveApplications.filter((leave) => {
      // Date range filter
      const leaveStartDate = new Date(leave.startDate);
      const leaveEndDate = new Date(leave.endDate);
      const isInDateRange = 
        (leaveStartDate >= filters.dateFrom && leaveStartDate <= filters.dateTo) ||
        (leaveEndDate >= filters.dateFrom && leaveEndDate <= filters.dateTo) ||
        (leaveStartDate <= filters.dateFrom && leaveEndDate >= filters.dateTo);
      
      if (!isInDateRange) return false;
      
      // Leave Type filter
      if (filters.leaveType && filters.leaveType !== "all-leave-type") {
        const leaveTypeMatch = {
          "annual-leave": "Annual Leave",
          "medical-leave": "Medical Leave", 
          "compassionate-paternity": "Compassionate Leave - Paternity Leave",
          "compassionate-maternity": "Compassionate Leave - Maternity Leave",
          "compassionate-death": "Compassionate Leave - Death of Family Member"
        };
        
        const expectedLeaveType = leaveTypeMatch[filters.leaveType as keyof typeof leaveTypeMatch];
        if (expectedLeaveType && leave.leaveType !== expectedLeaveType) return false;
      }
      
      // Leave Status filter  
      if (filters.leaveStatus && filters.leaveStatus !== "all-leave-status") {
        const statusMatch = {
          "pending": "Pending",
          "approved": "Approved", 
          "rejected": "Rejected",
          "cancelled": "Cancelled",
          "approved-level1": "Approved [Level 1]"
        };
        
        const expectedStatus = statusMatch[filters.leaveStatus as keyof typeof statusMatch];
        if (expectedStatus && leave.status !== expectedStatus) return false;
      }
      
      // Search filter (search in applicant name and leave type)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          (leave.applicant && leave.applicant.toLowerCase().includes(searchTerm)) ||
          (leave.leaveType && leave.leaveType.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  }, [rawLeaveApplications, filters.dateFrom, filters.dateTo, filters.searchTerm, filters.leaveType, filters.leaveStatus]);

  // Fetch current user's employee ID for claim applications
  const { data: currentEmployee } = useQuery({
    queryKey: ['/api/user/employee'],
    queryFn: async () => {
      const token = localStorage.getItem('utamahr_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('/api/user/employee', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch employee data');
      }
      
      return response.json();
    },
    enabled: !!user
  });

  // Fetch current logged-in user data for role-based access control
  const { data: currentUser } = useQuery<{ id: string; role?: string }>({
    queryKey: ["/api/user"],
  });

  // Check if current user has privileged access (Admin/Super Admin/HR Manager)
  const currentUserRole = currentEmployee?.role || currentUser?.role || '';
  const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager'];
  const hasPrivilegedAccess = privilegedRoles.includes(currentUserRole);
  
  console.log('My Record page - Current user role:', currentUserRole);
  console.log('My Record page - Has privileged access:', hasPrivilegedAccess);


  // Fetch claim applications based on user role
  const { data: claimApplications = [], isLoading: isLoadingClaims, error: claimError, refetch: refetchClaims } = useQuery({
    queryKey: ['/api/claim-applications/my-record', hasPrivilegedAccess ? 'all' : currentEmployee?.id, filters.dateFrom.toISOString(), filters.dateTo.toISOString()],
    queryFn: async () => {
      const token = localStorage.getItem('utamahr_token');
      if (!token) throw new Error('No authentication token found');
      
      let employeeIdParam;
      if (hasPrivilegedAccess) {
        // Admin users can see all claims
        employeeIdParam = 'all';
      } else {
        // Regular users only see their own claims
        if (!currentEmployee?.id) return [];
        employeeIdParam = currentEmployee.id;
      }
      
      console.log('Fetching claim applications for employee:', employeeIdParam);
      
      // Remove month/year filtering to get ALL financial claims
      const params = new URLSearchParams();
      
      const response = await fetch(`/api/claim-applications/my-record/${employeeIdParam}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Claim applications API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch claim applications');
      }
      
      const data = await response.json();
      console.log('Claim applications fetched:', data.length, 'records');
      
      // Debug ALL claim records - ensure we see all 9 records including Siti Nadiah
      console.log(`🚀 TOTAL CLAIMS RECEIVED:`, data.length);
      data.forEach((claim: any, index: number) => {
        console.log(`📋 CLAIM #${index + 1}:`, {
          id: claim.id,
          requestorName: claim.requestorName,
          financialPolicyName: claim.financialPolicyName,
          status: claim.status,
          amount: claim.amount,
          claimDate: claim.claimDate
        });
        
        // Highlight Siti Nadiah's claims
        if (claim.requestorName && claim.requestorName.toLowerCase().includes('siti nadiah')) {
          console.log(`🎯 SITI NADIAH CLAIM FOUND #${index + 1}:`, {
            id: claim.id,
            status: claim.status,
            amount: claim.amount,
            financialPolicyName: claim.financialPolicyName,
            claimDate: claim.claimDate
          });
        }
      });
      
      // Count Siti Nadiah claims specifically
      const sitiClaims = data.filter((c: any) => c.requestorName && c.requestorName.toLowerCase().includes('siti nadiah'));
      console.log(`🔢 SITI NADIAH CLAIMS COUNT:`, sitiClaims.length);
      
      // Check if rejected claim is present
      const sitiRejectedClaim = sitiClaims.find((c: any) => c.status.toLowerCase() === 'rejected');
      if (sitiRejectedClaim) {
        console.log(`✅ REJECTED CLAIM FOUND:`, sitiRejectedClaim);
      } else {
        console.log(`❌ REJECTED CLAIM MISSING in frontend data`);
      }
      
      return data as ClaimApplication[];
    },
    enabled: !!user && !!((user as any)?.role) && (hasPrivilegedAccess || !!currentEmployee?.id) && activeTab === 'claim'
  });

  // Fetch overtime claims for My Record page
  const { data: overtimeClaims = [], isLoading: isLoadingOvertime, error: overtimeError } = useQuery({
    queryKey: ['/api/claim-applications/overtime/my-record', hasPrivilegedAccess ? 'all' : currentEmployee?.id, filters.dateFrom.toISOString(), filters.dateTo.toISOString()],
    queryFn: async () => {
      const token = localStorage.getItem('utamahr_token');
      if (!token) throw new Error('No authentication token found');
      
      let employeeIdParam;
      if (hasPrivilegedAccess) {
        employeeIdParam = 'all';
      } else {
        if (!currentEmployee?.id) return [];
        employeeIdParam = currentEmployee.id;
      }
      
      console.log('Fetching overtime claims for employee:', employeeIdParam);
      
      const response = await fetch(`/api/claim-applications/overtime/my-record/${employeeIdParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Overtime claims API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch overtime claims');
      }
      
      const data = await response.json();
      console.log('Overtime claims fetched:', data.length, 'records');
      return data;
    },
    enabled: !!user && !!((user as any)?.role) && (hasPrivilegedAccess || !!currentEmployee?.id) && activeTab === 'overtime'
  });

  // Fetch user payroll records for My Record page
  const { data: userPayrollRecords = [], isLoading: isLoadingPayroll, error: payrollError } = useQuery({
    queryKey: ['/api/user/payroll-records'],
    queryFn: async () => {
      // Get JWT token from localStorage  
      const token = localStorage.getItem('utamahr_token');
      if (!token) {
        console.error('No JWT token found in localStorage');
        throw new Error('No authentication token found - please login again');
      }
      
      const response = await fetch(`/api/user/payroll-records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('User payroll records API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch user payroll records');
      }
      
      const data = await response.json();
      return data as UserPayrollRecord[];
    },
    enabled: !!user && activeTab === 'payment'
  });

  // Log errors for debugging
  if (attendanceError) {
    console.error('Attendance query error:', attendanceError);
  }
  if (leaveError) {
    console.error('Leave applications query error:', leaveError);
  }
  if (overtimeError) {
    console.error('Overtime claims query error:', overtimeError);
  }
  if (payrollError) {
    console.error('User payroll records query error:', payrollError);
  }

  const tabs = [
    { id: "leave", label: "Leave", icon: <CalendarLucide className="w-4 h-4 text-gray-600" /> },

    { id: "claim", label: "Financial Claim", icon: <DollarSign className="w-4 h-4 text-gray-600" /> },
    { id: "overtime", label: "Overtime", icon: <Clock className="w-4 h-4 text-gray-600" /> },
    { id: "attendance", label: "Attendance", icon: <FileText className="w-4 h-4 text-gray-600" /> },
    { id: "payment", label: "Payment", icon: <CreditCard className="w-4 h-4 text-gray-600" /> }
  ];

  const formatDateRange = () => {
    return `${format(filters.dateFrom, "dd/MM/yyyy")} - ${format(filters.dateTo, "dd/MM/yyyy")}`;
  };

  // Reusable filter component for all tabs
  const renderDatePeriodFilter = (testIdPrefix: string) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Date Period</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            data-testid={`button-${testIdPrefix}-date-period`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="p-3 space-y-2">
              <h4 className="font-medium text-sm">From Date</h4>
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => handleDateSelect(date, "from")}
              />
            </div>
            <div className="p-3 space-y-2">
              <h4 className="font-medium text-sm">To Date</h4>
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => handleDateSelect(date, "to")}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  // Reusable filter section for different tabs
  const renderFilterSection = (type: 'overtime' | 'claim' | 'attendance') => {
    switch (type) {
      case 'overtime':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {renderDatePeriodFilter('overtime')}
            <div className="space-y-2">
              <label className="text-sm font-medium">Overtime Status</label>
              <Select 
                value={filters.overtimeStatus} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, overtimeStatus: value }))}
                data-testid="select-overtime-status"
              >
                <SelectTrigger>
                  <SelectValue placeholder="All overtime status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-overtime-status">All overtime status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" 
                onClick={() => {
                  console.log('🔍 OVERTIME SEARCH FILTERS APPLIED:', {
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    overtimeStatus: filters.overtimeStatus,
                    totalResults: filteredOvertimeApplications.length,
                    originalTotal: overtimeClaims.length
                  });
                }}
                data-testid="button-overtime-search"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              {/* Download Button - only show for Overtime tab */}
              {activeTab === "overtime" && (
                <Button variant="outline" data-testid="button-overtime-download">
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      
      case 'claim':
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {renderDatePeriodFilter('claim')}
            <div className="space-y-2">
              <label className="text-sm font-medium">Claim Type</label>
              <Select 
                value={filters.claimType} 
                onValueChange={(value) => handleFilterChange('claimType', value)}
                data-testid="select-claim-type"
              >
                <SelectTrigger>
                  <SelectValue placeholder="All claim type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-claim-type">All claim type</SelectItem>
                  {financialClaimPolicies.map((policy: any) => (
                    <SelectItem key={policy.id} value={policy.claimName.toLowerCase().replace(/\s+/g, '-')}>
                      {policy.claimName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Claim Status</label>
              <Select 
                value={filters.claimStatus} 
                onValueChange={(value) => handleFilterChange('claimStatus', value)}
                data-testid="select-claim-status"
              >
                <SelectTrigger>
                  <SelectValue placeholder="All claim status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-claim-status">All claim status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" 
                onClick={() => {
                  console.log('🔍 SEARCH FILTERS APPLIED:', {
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    claimType: filters.claimType,
                    claimStatus: filters.claimStatus,
                    searchTerm: filters.searchTerm,
                    totalResults: searchFilteredClaims.length,
                    originalTotal: claimApplications.length
                  });
                }}
                data-testid="button-claim-search"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              {/* Download Button - only show for Claim tab */}
              {activeTab === "claim" && (
                <Button variant="outline" data-testid="button-claim-download">
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      
      case 'attendance':
        return renderAttendanceFilterSection();
      
      default:
        return null;
    }
  };

  // Handle payslip download using EXACT SAME logic as green download button in payroll detail page  
  const handleDownloadPayslip = async (payrollItemId: string, employeeName: string) => {
    try {
      console.log('=== REACT PDF WITH AUTHENTIC DATA & MAPPER ===');
      console.log('Payroll Item ID:', payrollItemId, 'Employee Name:', employeeName);
      
      // Find the payroll record to get document ID and employee ID
      const record = userPayrollRecords.find(r => r.payrollItemId === payrollItemId);
      if (!record) {
        throw new Error('Payroll record not found');
      }
      
      // Fetch authentic templateData from preview endpoint - SAME AS GREEN BUTTON
      const token = localStorage.getItem('utamahr_token');
      const templateResponse = await fetch(
        `/api/payroll/payslip/${record.employeeId}/template-data?documentId=${record.documentId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!templateResponse.ok) {
        throw new Error(`Failed to fetch template data: ${templateResponse.status}`);
      }
      
      const templateData = await templateResponse.json();
      console.log('Template data fetched:', templateData);
      
      // Use mapper to build PDF props from authentic templateData - SAME AS GREEN BUTTON
      const pdfProps = buildPdfPropsFromTemplateData(templateData);
      console.log('PDF props from mapper:', pdfProps);
      
      // Generate PDF with authentic data - SAME AS GREEN BUTTON
      const pdfBlob = await pdf(
        <PayslipPDFDocument {...pdfProps} />
      ).toBlob();
      
      console.log('PDF blob size:', pdfBlob.size, 'bytes');
      
      // Download PDF - SAME AS GREEN BUTTON
      const url = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `Payslip_${pdfProps.employee.fullName}_${pdfProps.document.month}_${pdfProps.document.year}.pdf`;
      downloadLink.click();
      URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully');
      
    } catch (e: any) {
      console.error('PDF generation error:', e);
      alert('PDF generation failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleDateSelect = (date: Date | undefined, type: "from" | "to") => {
    if (date) {
      setFilters(prev => ({
        ...prev,
        [type === "from" ? "dateFrom" : "dateTo"]: date
      }));
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType: 'claimType' | 'claimStatus', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Filter claim applications based on current filters
  const filteredClaimApplications = claimApplications.filter(claim => {
    // Date filter
    const claimDate = new Date(claim.claimDate);
    const isDateInRange = claimDate >= filters.dateFrom && claimDate <= filters.dateTo;
    
    // Claim type filter
    const isClaimTypeMatch = filters.claimType === 'all-claim-type' || 
      (claim.financialPolicyName && claim.financialPolicyName.toLowerCase().replace(/\s+/g, '-') === filters.claimType);
    
    // Claim status filter
    const isStatusMatch = filters.claimStatus === 'all-claim-status' || 
      claim.status.toLowerCase() === filters.claimStatus.toLowerCase();
    
    // Debug specific filtering for Siti Nadiah's rejected claim
    if ((claim as any).requestorName && (claim as any).requestorName.toLowerCase().includes('siti nadiah') && claim.status.toLowerCase() === 'rejected') {
      console.log(`🔍 FILTERING DEBUG - Siti Nadiah Rejected Claim:`, {
        id: claim.id,
        claimDate: claim.claimDate,
        claimDateObj: claimDate,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        isDateInRange,
        claimType: filters.claimType,
        financialPolicyName: claim.financialPolicyName,
        isClaimTypeMatch,
        status: claim.status,
        claimStatus: filters.claimStatus,
        isStatusMatch,
        finalPass: isDateInRange && isClaimTypeMatch && isStatusMatch
      });
    }
    
    return isDateInRange && isClaimTypeMatch && isStatusMatch;
  });

  // Filter overtime applications based on current filters
  const filteredOvertimeApplications = overtimeClaims.filter((overtime: any) => {
    // Date filter - check multiple possible date fields
    const overtimeDate = overtime.claimDate ? new Date(overtime.claimDate) : 
                        overtime.overtimeDate ? new Date(overtime.overtimeDate) :
                        overtime.date ? new Date(overtime.date) : null;
    
    const isDateInRange = overtimeDate ? (overtimeDate >= filters.dateFrom && overtimeDate <= filters.dateTo) : true;
    
    // Status filter
    const isStatusMatch = filters.overtimeStatus === 'all-overtime-status' || 
      overtime.status.toLowerCase() === filters.overtimeStatus.toLowerCase();
    
    console.log(`🔍 OVERTIME FILTERING DEBUG:`, {
      id: overtime.id,
      claimDate: overtime.claimDate,
      overtimeDate: overtime.overtimeDate,
      date: overtime.date,
      finalDate: overtimeDate,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      isDateInRange,
      status: overtime.status,
      overtimeStatus: filters.overtimeStatus,
      isStatusMatch,
      finalPass: isDateInRange && isStatusMatch
    });
    
    return isDateInRange && isStatusMatch;
  });

  // Apply search term filter to filtered overtime results
  const searchFilteredOvertime = filteredOvertimeApplications.filter((overtime: any) => {
    if (!filters.searchTerm) return true;
    
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      (overtime.requestorName && overtime.requestorName.toLowerCase().includes(searchLower)) ||
      (overtime.employeeName && overtime.employeeName.toLowerCase().includes(searchLower)) ||
      (overtime.reason && overtime.reason.toLowerCase().includes(searchLower)) ||
      (overtime.remarks && overtime.remarks.toLowerCase().includes(searchLower)) ||
      overtime.status.toLowerCase().includes(searchLower)
    );
  });

  // Variable for PDF download function (matching PDF function naming)
  const searchFilteredOvertimes = searchFilteredOvertime;

  // Apply search term filter to filtered results
  const searchFilteredClaims = filteredClaimApplications.filter(claim => {
    if (!filters.searchTerm) return true;
    
    const searchLower = filters.searchTerm.toLowerCase();
    return (
      ((claim as any).requestorName && (claim as any).requestorName.toLowerCase().includes(searchLower)) ||
      (claim.financialPolicyName && claim.financialPolicyName.toLowerCase().includes(searchLower)) ||
      (claim.particulars && claim.particulars.toLowerCase().includes(searchLower)) ||
      claim.status.toLowerCase().includes(searchLower)
    );
  });

  // Helper function for text wrapping in PDF
  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, break it
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Helper function to draw wrapped text
  const drawWrappedText = (page: any, text: string, x: number, y: number, maxWidth: number, font: any, fontSize: number, color: any) => {
    const lines = wrapText(text, maxWidth, font, fontSize);
    let currentY = y;
    
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: x,
        y: currentY - (index * (fontSize + 2)),
        size: fontSize,
        font: font,
        color: color,
      });
    });
    
    return lines.length * (fontSize + 2); // Return total height used
  };

  // Attendance filter section
  const renderAttendanceFilterSection = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {renderDatePeriodFilter('attendance')}
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search employee name..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            data-testid="input-attendance-search"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" 
            onClick={() => {
              console.log('🔍 ATTENDANCE SEARCH FILTERS APPLIED:', {
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                searchTerm: filters.searchTerm,
                totalResults: searchFilteredAttendanceRecords.length,
                originalTotal: attendanceRecords.length
              });
            }}
            data-testid="button-attendance-search"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAttendanceRecordPDFDownload}
            data-testid="button-attendance-download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Handle Attendance Record PDF Download
  const handleAttendanceRecordPDFDownload = async () => {
    try {
      console.log('🔄 Starting Attendance Record PDF generation...');
      
      const filteredRecords = searchFilteredAttendanceRecords;
      
      if (filteredRecords.length === 0) {
        alert('No attendance records found for the selected date range.');
        return;
      }
      
      // Import pdf-lib
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      
      // Create new PDF document
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const page = pdfDoc.addPage([842, 595]); // A4 landscape
      const { width, height } = page.getSize();
      
      // Helper function for text wrapping
      const wrapText = (text: string, maxWidth: number, fontSize: number, font: any) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              lines.push(word);
            }
          }
        }
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Draw wrapped text
      const drawWrappedText = (page: any, text: string, x: number, y: number, maxWidth: number, fontSize: number, font: any, color: any) => {
        const lines = wrapText(text, maxWidth, fontSize, font);
        let yPosition = y;
        
        lines.forEach((line) => {
          page.drawText(line, {
            x,
            y: yPosition,
            size: fontSize,
            font,
            color,
          });
          yPosition -= fontSize + 2;
        });
        
        return lines.length * (fontSize + 2);
      };
      
      // Header
      page.drawText('UTAMA MEDGROUP SDN BHD', {
        x: 50,
        y: height - 50,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('ATTENDANCE RECORD REPORT', {
        x: 50,
        y: height - 75,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Date range
      const fromDate = format(filters.dateFrom, 'dd/MM/yyyy');
      const toDate = format(filters.dateTo, 'dd/MM/yyyy');
      page.drawText(`Period: ${fromDate} - ${toDate}`, {
        x: 50,
        y: height - 100,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      // Employee info section
      const employeeName = user?.username || 'N/A';
      let yPosition = height - 130;
      
      // Employee info box
      page.drawRectangle({
        x: 50,
        y: yPosition - 40,
        width: width - 100,
        height: 40,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      page.drawText('Employee Information', {
        x: 60,
        y: yPosition - 15,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`Name: ${employeeName}`, {
        x: 60,
        y: yPosition - 30,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`IC Number: -`, {
        x: 300,
        y: yPosition - 30,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 60;
      
      // Table headers
      const columnWidths = [50, 150, 80, 80, 80, 80, 80, 80, 100];
      const headers = ['No.', 'Employee', 'Date', 'Clock In', 'Break Out', 'Break In', 'Clock Out', 'Total Hours', 'Status'];
      let xPosition = 50;
      
      // Header background
      page.drawRectangle({
        x: 50,
        y: yPosition - 25,
        width: width - 100,
        height: 25,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      // Header text
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: xPosition + 5,
          y: yPosition - 15,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        xPosition += columnWidths[index];
      });
      
      yPosition -= 25;
      
      // Table rows
      filteredRecords.forEach((record, index) => {
        // Check if we need a new page
        if (yPosition < 100) {
          const newPage = pdfDoc.addPage([842, 595]);
          yPosition = height - 50;
        }
        
        const rowHeight = 25;
        
        // Alternating row background
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 50,
            y: yPosition - rowHeight,
            width: width - 100,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          });
        }
        
        // Row border
        page.drawRectangle({
          x: 50,
          y: yPosition - rowHeight,
          width: width - 100,
          height: rowHeight,
          borderColor: rgb(0.9, 0.9, 0.9),
          borderWidth: 0.5,
        });
        
        // Data cells
        const employeeDisplayName = record.employeeName || record.fullName || 'N/A';
        const rowData = [
          (index + 1).toString(),
          employeeDisplayName,
          format(new Date(record.date), 'dd/MM/yyyy'),
          record.clockInTime || '-',
          record.breakOutTime || '-',
          record.breakInTime || '-',
          record.clockOutTime || '-',
          record.totalHours || '-',
          record.isLateClockIn ? 'Late' : 'On Time'
        ];
        
        xPosition = 50;
        rowData.forEach((data, colIndex) => {
          let textColor = rgb(0, 0, 0);
          
          // Status column - color coding
          if (colIndex === 8) { // Status column
            textColor = record.isLateClockIn ? rgb(0.8, 0, 0) : rgb(0, 0.6, 0);
          }
          
          // Handle text wrapping for long employee names
          if (colIndex === 1 && data.length > 15) {
            drawWrappedText(page, data, xPosition + 5, yPosition - 10, columnWidths[colIndex] - 10, 9, font, textColor);
          } else {
            let displayText = data;
            if (data.length > 12 && (colIndex === 1)) {
              displayText = data.substring(0, 9) + '...';
            }
            
            page.drawText(displayText, {
              x: xPosition + 5,
              y: yPosition - 15,
              size: 9,
              font: font,
              color: textColor,
            });
          }
          
          xPosition += columnWidths[colIndex];
        });
        
        yPosition -= rowHeight;
      });
      
      // Summary Section
      yPosition -= 30;
      const summaryBoxHeight = 50;
      page.drawRectangle({
        x: 50,
        y: yPosition - summaryBoxHeight,
        width: width - 100,
        height: summaryBoxHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      page.drawText('Attendance Summary', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      const totalRecords = filteredRecords.length;
      const lateRecords = filteredRecords.filter(r => r.isLateClockIn).length;
      const onTimeRecords = totalRecords - lateRecords;
      
      page.drawText(`Total Records: ${totalRecords}`, {
        x: 60,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`On Time: ${onTimeRecords}`, {
        x: 200,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0.6, 0),
      });
      
      page.drawText(`Late: ${lateRecords}`, {
        x: 300,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0, 0),
      });
      
      // Footer
      const footerText = `Page 1 of 1 | Generated by UtamaHR System | ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
      const footerWidth = font.widthOfTextAtSize(footerText, 8);
      page.drawText(footerText, {
        x: (width - footerWidth) / 2,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Generate PDF
      const pdfBytes = await pdfDoc.save();
      
      // Download PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Attendance_Record_${user?.username || 'User'}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Attendance Record PDF generated and downloaded successfully');
      
    } catch (error) {
      console.error('❌ Error generating Attendance Record PDF:', error);
      alert('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle supporting document download
  const handleDocumentDownload = async (documentPath: string, claimId: string, docIndex: number) => {
    try {
      console.log('Downloading document:', documentPath, 'for claim:', claimId);
      
      // Get JWT token
      const token = localStorage.getItem('utamahr_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Download the document
      const response = await fetch(documentPath, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.status} ${response.statusText}`);
      }

      // Get the file as blob
      const blob = await response.blob();
      
      // Extract filename from path or create default
      const pathParts = documentPath.split('/');
      const filename = pathParts[pathParts.length - 1] || `claim_document_${claimId}_${docIndex + 1}`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Document downloaded successfully:', filename);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Handle Leave Record PDF Download using pdf-lib
  const handleClaimRecordPDFDownload = async () => {
    console.log('🔄 Starting claim record PDF generation...');
    
    try {
      if (!user || !currentEmployee) {
        console.error('❌ User or employee data not available');
        return;
      }

      // Create PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();

      let yPosition = height - 50;

      // Company Header
      page.drawText('UTAMA MEDGROUP', {
        x: (width - boldFont.widthOfTextAtSize('UTAMA MEDGROUP', 20)) / 2,
        y: yPosition,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;
      page.drawText('CLAIM APPLICATIONS REPORT', {
        x: (width - boldFont.widthOfTextAtSize('CLAIM APPLICATIONS REPORT', 16)) / 2,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 40;
      
      // Employee Information Box
      const employeeName = currentEmployee.name || user.username || 'Unknown';
      const employeeId = currentEmployee.nric || currentEmployee.id || 'N/A';
      
      page.drawRectangle({
        x: 50,
        y: yPosition - 60,
        width: width - 100,
        height: 60,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      page.drawText('Employee Information', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Name: ${employeeName}`, {
        x: 60,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`IC Number: ${employeeId}`, {
        x: 60,
        y: yPosition - 50,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPosition -= 90;

      // Period Information
      page.drawText(`Report Period: ${format(filters.dateFrom, 'dd/MM/yyyy')} - ${format(filters.dateTo, 'dd/MM/yyyy')}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;

      // Table Header Background
      const headerHeight = 25;
      page.drawRectangle({
        x: 40,
        y: yPosition - headerHeight,
        width: width - 80,
        height: headerHeight,
        color: rgb(0.2, 0.4, 0.8),
      });

      // Table Headers
      const headers = ['No.', 'Requestor', 'Claim Type', 'Amount', 'Date', 'Status'];
      const columnWidths = [30, 100, 120, 70, 70, 80];
      let xPosition = 50;

      headers.forEach((header, index) => {
        page.drawText(header, {
          x: xPosition,
          y: yPosition - 18,
          size: 10,
          font: boldFont,
          color: rgb(1, 1, 1),
        });
        xPosition += columnWidths[index];
      });

      yPosition -= headerHeight + 10;

      // Table Data with borders
      searchFilteredClaims.forEach((claim, index) => {
        if (yPosition < 150) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }

        const rowHeight = 25;

        // Alternating row background
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: yPosition - rowHeight,
            width: width - 80,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          });
        }

        // Row border
        page.drawRectangle({
          x: 40,
          y: yPosition - rowHeight,
          width: width - 80,
          height: rowHeight,
          borderColor: rgb(0.9, 0.9, 0.9),
          borderWidth: 0.5,
        });

        // Data cells
        const requestorName = (claim as any).requestorName || (claim as any).employeeName || 'N/A';
        const rowData = [
          (index + 1).toString(),
          requestorName,
          claim.financialPolicyName || 'N/A',
          `RM ${parseFloat(claim.amount || '0').toFixed(2)}`,
          format(new Date(claim.claimDate), 'dd/MM/yyyy'),
          claim.status || 'Unknown'
        ];

        xPosition = 50;
        rowData.forEach((data, colIndex) => {
          const textColor = colIndex === 5 ? // Status column
            (claim.status === 'Approved' || claim.status === 'Paid' ? rgb(0, 0.6, 0) :
             claim.status === 'Rejected' ? rgb(0.8, 0, 0) :
             rgb(0.8, 0.6, 0)) : rgb(0, 0, 0);

          // Use text wrapping for name column (index 1) and policy name (index 2)
          if ((colIndex === 1 || colIndex === 2) && data.length > 15) {
            const maxWidth = columnWidths[colIndex] - 10; // Leave some padding
            drawWrappedText(page, data, xPosition + 5, yPosition - 15, maxWidth, font, 8, textColor);
          } else {
            page.drawText(data, {
              x: xPosition + 5,
              y: yPosition - 15,
              size: 9,
              font: font,
              color: textColor,
            });
          }
          xPosition += columnWidths[colIndex];
        });

        yPosition -= rowHeight;
      });

      // Summary Section
      yPosition -= 30;
      const summaryBoxHeight = 60;
      page.drawRectangle({
        x: 50,
        y: yPosition - summaryBoxHeight,
        width: width - 100,
        height: summaryBoxHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      page.drawText('Claim Summary', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      const totalClaims = searchFilteredClaims.length;
      const approvedClaims = searchFilteredClaims.filter(c => c.status === 'Approved' || c.status === 'Paid').length;
      const pendingClaims = searchFilteredClaims.filter(c => c.status === 'Pending').length;
      const rejectedClaims = searchFilteredClaims.filter(c => c.status === 'Rejected').length;
      const totalAmount = searchFilteredClaims.reduce((sum, claim) => sum + parseFloat(claim.amount || '0'), 0);

      page.drawText(`Total Applications: ${totalClaims}`, {
        x: 60,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Approved: ${approvedClaims}`, {
        x: 200,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0.6, 0),
      });

      page.drawText(`Pending: ${pendingClaims}`, {
        x: 300,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0.6, 0),
      });

      page.drawText(`Rejected: ${rejectedClaims}`, {
        x: 400,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0, 0),
      });

      page.drawText(`Total Amount: RM ${totalAmount.toFixed(2)}`, {
        x: 60,
        y: yPosition - 50,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Footer
      yPosition -= 100;
      page.drawText(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, {
        x: 50,
        y: 50,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Save and download PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Claim_Report_${employeeName}_${format(filters.dateFrom, 'dd-MM-yyyy')}_to_${format(filters.dateTo, 'dd-MM-yyyy')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Claim record PDF generated and downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating claim record PDF:', error);
      console.error('❌ Full error stack:', error.stack);
      console.error('❌ Error message:', error.message);
    }
  };

  const handleOvertimeRecordPDFDownload = async () => {
    console.log('🔄 Starting overtime record PDF generation...');
    
    try {
      if (!user || !currentEmployee) {
        console.error('❌ User or employee data not available');
        return;
      }

      // Create PDF using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();

      let yPosition = height - 50;

      // Company Header
      page.drawText('UTAMA MEDGROUP', {
        x: (width - boldFont.widthOfTextAtSize('UTAMA MEDGROUP', 20)) / 2,
        y: yPosition,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;
      page.drawText('OVERTIME APPLICATIONS REPORT', {
        x: (width - boldFont.widthOfTextAtSize('OVERTIME APPLICATIONS REPORT', 16)) / 2,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 40;
      
      // Employee Information Box
      const employeeName = currentEmployee.name || user.username || 'Unknown';
      const employeeId = currentEmployee.nric || currentEmployee.id || 'N/A';
      
      page.drawRectangle({
        x: 50,
        y: yPosition - 60,
        width: width - 100,
        height: 60,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      page.drawText('Employee Information', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Name: ${employeeName}`, {
        x: 60,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`IC Number: ${employeeId}`, {
        x: 60,
        y: yPosition - 50,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      yPosition -= 90;

      // Period Information
      page.drawText(`Report Period: ${format(filters.dateFrom, 'dd/MM/yyyy')} - ${format(filters.dateTo, 'dd/MM/yyyy')}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;

      // Table Header Background
      const headerHeight = 25;
      page.drawRectangle({
        x: 40,
        y: yPosition - headerHeight,
        width: width - 80,
        height: headerHeight,
        color: rgb(0.2, 0.4, 0.8),
      });

      // Table Headers
      const headers = ['No.', 'Applicant', 'Status', 'Total Hours', 'Amount', 'Date'];
      const columnWidths = [30, 120, 80, 70, 70, 95];
      let xPosition = 50;

      headers.forEach((header, index) => {
        page.drawText(header, {
          x: xPosition,
          y: yPosition - 18,
          size: 10,
          font: boldFont,
          color: rgb(1, 1, 1),
        });
        xPosition += columnWidths[index];
      });

      yPosition -= headerHeight + 10;

      // Table Data with borders
      searchFilteredOvertimes.forEach((overtime, index) => {
        if (yPosition < 150) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }

        const rowHeight = 25;

        // Alternating row background
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: yPosition - rowHeight,
            width: width - 80,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          });
        }

        // Row border
        page.drawRectangle({
          x: 40,
          y: yPosition - rowHeight,
          width: width - 80,
          height: rowHeight,
          borderColor: rgb(0.9, 0.9, 0.9),
          borderWidth: 0.5,
        });

        // Data cells
        const requestorName = overtime.requestorName || 'N/A';
        const amount = overtime.amount ? `RM ${parseFloat(overtime.amount).toFixed(2)}` : 'RM 0.00';
        
        const rowData = [
          (index + 1).toString(),
          requestorName,
          overtime.status || 'Unknown',
          overtime.totalHours || overtime.hours || '0 jam',
          amount,
          format(new Date(overtime.claimDate), 'dd/MM/yyyy')
        ];

        xPosition = 50;
        rowData.forEach((data, colIndex) => {
          const textColor = colIndex === 2 ? // Status column
            (overtime.status === 'approved' || overtime.status === 'Paid' ? rgb(0, 0.6, 0) :
             overtime.status === 'Rejected' ? rgb(0.8, 0, 0) :
             rgb(0.8, 0.6, 0)) : rgb(0, 0, 0);

          // Use text wrapping for name column (index 1)
          if (colIndex === 1 && data.length > 15) {
            const maxWidth = columnWidths[colIndex] - 10; // Leave some padding
            drawWrappedText(page, data, xPosition + 5, yPosition - 15, maxWidth, font, 8, textColor);
          } else {
            page.drawText(data, {
              x: xPosition + 5,
              y: yPosition - 15,
              size: 9,
              font: font,
              color: textColor,
            });
          }
          xPosition += columnWidths[colIndex];
        });

        yPosition -= rowHeight;
      });

      // Summary Section
      yPosition -= 30;
      const summaryBoxHeight = 60;
      page.drawRectangle({
        x: 50,
        y: yPosition - summaryBoxHeight,
        width: width - 100,
        height: summaryBoxHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });

      page.drawText('Overtime Summary', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      const totalOvertimes = searchFilteredOvertimes.length;
      const approvedOvertimes = searchFilteredOvertimes.filter(o => o.status === 'approved' || o.status === 'Paid').length;
      const pendingOvertimes = searchFilteredOvertimes.filter(o => o.status === 'pending' || o.status === 'Pending').length;
      const rejectedOvertimes = searchFilteredOvertimes.filter(o => o.status === 'Rejected').length;
      const totalAmount = searchFilteredOvertimes.reduce((sum, overtime) => sum + parseFloat(overtime.amount || '0'), 0);

      page.drawText(`Total Applications: ${totalOvertimes}`, {
        x: 60,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      page.drawText(`Approved: ${approvedOvertimes}`, {
        x: 200,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0.6, 0),
      });

      page.drawText(`Pending: ${pendingOvertimes}`, {
        x: 300,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0.6, 0),
      });

      page.drawText(`Rejected: ${rejectedOvertimes}`, {
        x: 400,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0, 0),
      });

      page.drawText(`Total Amount: RM ${totalAmount.toFixed(2)}`, {
        x: 60,
        y: yPosition - 50,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // Footer
      yPosition -= 100;
      page.drawText(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, {
        x: 50,
        y: 50,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Save and download PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Overtime_Report_${employeeName}_${format(filters.dateFrom, 'dd-MM-yyyy')}_to_${format(filters.dateTo, 'dd-MM-yyyy')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Overtime record PDF generated and downloaded successfully');
    } catch (error) {
      console.error('❌ Error generating overtime record PDF:', error);
      console.error('❌ Full error stack:', error.stack);
      console.error('❌ Error message:', error.message);
    }
  };

  const handleLeaveRecordPDFDownload = async () => {
    try {
      console.log('🔥 GENERATING LEAVE RECORD PDF WITH AUTHENTIC DATA');
      
      // Get JWT token
      const token = localStorage.getItem('utamahr_token');
      if (!token) {
        throw new Error('Authentication token required');
      }

      // Fetch company data
      const companyResponse = await fetch('/api/company-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!companyResponse.ok) {
        throw new Error('Failed to fetch company data');
      }
      
      const companyData = await companyResponse.json();
      console.log('Company data fetched:', companyData);

      // Create new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const { width, height } = page.getSize();
      
      // Header Section with Company Info
      let yPosition = height - 50;
      
      // Company Name (Bold, Large)
      page.drawText(companyData.companyName || companyData.nama || 'Company Name', {
        x: 50,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
      
      // Company Details
      const companyDetails = [
        `Tel: ${companyData.phoneNumber || companyData.telefon || 'N/A'}`,
        `Email: ${companyData.email || 'N/A'}`,
        `Address: ${companyData.address || companyData.alamat || 'N/A'}`
      ];
      
      companyDetails.forEach(detail => {
        page.drawText(detail, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      });
      
      yPosition -= 20;
      
      // Report Title (Bold, Centered)
      const title = 'MY LEAVE RECORD REPORT';
      const titleWidth = boldFont.widthOfTextAtSize(title, 16);
      page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 40;
      
      // Employee Information Box
      const boxHeight = 60;
      page.drawRectangle({
        x: 50,
        y: yPosition - boxHeight,
        width: width - 100,
        height: boxHeight,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      // Employee Info Header
      page.drawText('Employee Information', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Fetch employee data for IC number
      const employeeResponse = await fetch('/api/user/employee', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const employeeData = employeeResponse.ok ? await employeeResponse.json() : null;
      
      // Employee Details (Use IC number instead of Employee ID)
      const employeeName = user?.fullName || user?.username || 'N/A';
      const employeeIc = employeeData?.nric || 'N/A';
      
      page.drawText(`Name: ${employeeName}`, {
        x: 60,
        y: yPosition - 40,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`IC Number: ${employeeIc}`, {
        x: 300,
        y: yPosition - 40,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= boxHeight + 30;
      
      // Report Info
      const reportDate = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
      const periodText = `Report Period: ${format(filters.dateFrom, 'dd/MM/yyyy')} - ${format(filters.dateTo, 'dd/MM/yyyy')}`;
      const generatedText = `Generated on: ${reportDate}`;
      
      page.drawText(periodText, {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
      
      page.drawText(generatedText, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= 30;
      
      // Table Header Background (Blue)
      const headerHeight = 25;
      page.drawRectangle({
        x: 40,
        y: yPosition - headerHeight,
        width: width - 80,
        height: headerHeight,
        color: rgb(0.2, 0.4, 0.8),
      });
      
      // Table Headers (White text)
      const headers = ['No.', 'Applicant', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status'];
      const columnWidths = [30, 80, 90, 70, 70, 40, 80];
      let xPosition = 50;
      
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: xPosition,
          y: yPosition - 18,
          size: 10,
          font: boldFont,
          color: rgb(1, 1, 1),
        });
        xPosition += columnWidths[index];
      });
      
      yPosition -= headerHeight + 10;
      
      // Table Data with borders
      leaveApplications.forEach((leave, index) => {
        if (yPosition < 150) {
          // Add new page if needed
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }
        
        const rowHeight = 25;
        
        // Alternating row background
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: yPosition - rowHeight,
            width: width - 80,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.98),
          });
        }
        
        // Row border
        page.drawRectangle({
          x: 40,
          y: yPosition - rowHeight,
          width: width - 80,
          height: rowHeight,
          borderColor: rgb(0.9, 0.9, 0.9),
          borderWidth: 0.5,
        });
        
        // Data cells
        const rowData = [
          (index + 1).toString(),
          leave.applicant || employeeName || 'N/A',
          leave.leaveType || 'N/A',
          format(new Date(leave.startDate), 'dd/MM/yyyy'),
          format(new Date(leave.endDate), 'dd/MM/yyyy'),
          leave.totalDays?.toString() || '0',
          leave.status || 'Unknown'
        ];
        
        xPosition = 50;
        rowData.forEach((data, colIndex) => {
          const textColor = colIndex === 6 ? // Status column (moved to index 6)
            (leave.status === 'Approved' ? rgb(0, 0.6, 0) :
             leave.status === 'Rejected' ? rgb(0.8, 0, 0) :
             rgb(0.8, 0.6, 0)) : rgb(0, 0, 0);
          
          // Truncate text if too long
          let displayText = data;
          if (data.length > 15 && (colIndex === 1 || colIndex === 2)) { // Applicant or Leave Type column
            displayText = data.substring(0, 12) + '...';
          }
          
          page.drawText(displayText, {
            x: xPosition + 5, // Add padding
            y: yPosition - 15,
            size: 9,
            font: font,
            color: textColor,
          });
          xPosition += columnWidths[colIndex];
        });
        
        yPosition -= rowHeight;
      });
      
      // Summary Section
      yPosition -= 30;
      const summaryBoxHeight = 50;
      page.drawRectangle({
        x: 50,
        y: yPosition - summaryBoxHeight,
        width: width - 100,
        height: summaryBoxHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      });
      
      page.drawText('Leave Summary', {
        x: 60,
        y: yPosition - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      const totalLeaves = leaveApplications.length;
      const approvedLeaves = leaveApplications.filter(l => l.status === 'Approved').length;
      const pendingLeaves = leaveApplications.filter(l => l.status === 'Pending').length;
      const rejectedLeaves = leaveApplications.filter(l => l.status === 'Rejected').length;
      
      page.drawText(`Total Applications: ${totalLeaves}`, {
        x: 60,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`Approved: ${approvedLeaves}`, {
        x: 200,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0, 0.6, 0),
      });
      
      page.drawText(`Pending: ${pendingLeaves}`, {
        x: 300,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0.6, 0),
      });
      
      page.drawText(`Rejected: ${rejectedLeaves}`, {
        x: 400,
        y: yPosition - 35,
        size: 10,
        font: font,
        color: rgb(0.8, 0, 0),
      });
      
      // Footer
      const footerText = `Page 1 of 1 | Generated by UtamaHR System | ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
      const footerWidth = font.widthOfTextAtSize(footerText, 8);
      page.drawText(footerText, {
        x: (width - footerWidth) / 2,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Generate PDF
      const pdfBytes = await pdfDoc.save();
      
      // Download PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Leave_Record_${user?.username || 'User'}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Leave Record PDF generated and downloaded successfully');
      
    } catch (error) {
      console.error('❌ Error generating Leave Record PDF:', error);
      alert('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Render Leave Filter Section Function
  const renderLeaveFilterSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Period</label>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              data-testid="button-date-period"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              <div className="p-3 space-y-2">
                <h4 className="font-medium text-sm">From Date</h4>
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => handleDateSelect(date, "from")}
                />
              </div>
              <div className="p-3 space-y-2">
                <h4 className="font-medium text-sm">To Date</h4>
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => handleDateSelect(date, "to")}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Leave Type</label>
        <Select 
          value={filters.leaveType} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value }))}
          data-testid="select-leave-type"
        >
          <SelectTrigger>
            <SelectValue placeholder="All leave type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-leave-type">All leave type</SelectItem>
            <SelectItem value="annual-leave">Annual Leave</SelectItem>
            <SelectItem value="medical-leave">Medical Leave</SelectItem>
            <SelectItem value="compassionate-paternity">Compassionate Leave - Paternity Leave</SelectItem>
            <SelectItem value="compassionate-maternity">Compassionate Leave - Maternity Leave</SelectItem>
            <SelectItem value="compassionate-death">Compassionate Leave - Death of Family Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Leave Status</label>
        <Select 
          value={filters.leaveStatus} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, leaveStatus: value }))}
          data-testid="select-leave-status"
        >
          <SelectTrigger>
            <SelectValue placeholder="All leave status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-leave-status">All leave status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="approved-level1">Approved [Level 1]</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-search">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {/* Download Button - only show for Leave tab */}
        {activeTab === "leave" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-download">
                <Download className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  data-testid="button-download-pdf"
                  onClick={handleLeaveRecordPDFDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );

  const renderClaimFilterSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="space-y-2">
        <label className="text-sm font-medium">Date From</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal", !filters.dateFrom && "text-muted-foreground")}
              data-testid="button-claim-date-from"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) => date && setFilters(prev => ({ ...prev, dateFrom: date }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Date To</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("justify-start text-left font-normal", !filters.dateTo && "text-muted-foreground")}
              data-testid="button-claim-date-to"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => date && setFilters(prev => ({ ...prev, dateTo: date }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Claim Type</label>
        <Select 
          value={filters.claimType} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, claimType: value }))}
          data-testid="select-claim-type"
        >
          <SelectTrigger>
            <SelectValue placeholder="All claim type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-claim-type">All claim type</SelectItem>
            <SelectItem value="Medical Expenses">Medical Expenses</SelectItem>
            <SelectItem value="Travel Allowance">Travel Allowance</SelectItem>
            <SelectItem value="Phone Bill">Phone Bill</SelectItem>
            <SelectItem value="Parking">Parking</SelectItem>
            <SelectItem value="Meal Allowance">Meal Allowance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Claim Status</label>
        <Select 
          value={filters.claimStatus} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, claimStatus: value }))}
          data-testid="select-claim-status"
        >
          <SelectTrigger>
            <SelectValue placeholder="All claim status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-claim-status">All claim status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-claim-search">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {/* Download Button - only show for Claim tab */}
        {activeTab === "claim" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-claim-download">
                <Download className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  data-testid="button-claim-download-pdf"
                  onClick={handleClaimRecordPDFDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );

  // Render overtime filter section
  const renderOvertimeFilterSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Period</label>
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.dateFrom && "text-muted-foreground"
              )}
              data-testid="button-overtime-date-period"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom && filters.dateTo 
                ? `${format(filters.dateFrom, "dd/MM/yyyy")} - ${format(filters.dateTo, "dd/MM/yyyy")}`
                : "Select date range"
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => date && setFilters(prev => ({ ...prev, dateFrom: date }))}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => date && setFilters(prev => ({ ...prev, dateTo: date }))}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowDatePicker(false)}>
                  Apply
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      dateFrom: new Date(2025, 0, 1),
                      dateTo: new Date()
                    }));
                    setShowDatePicker(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Overtime Status</label>
        <Select 
          value={filters.overtimeStatus} 
          onValueChange={(value) => setFilters(prev => ({ ...prev, overtimeStatus: value }))}
          data-testid="select-overtime-status"
        >
          <SelectTrigger>
            <SelectValue placeholder="All overtime status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-overtime-status">All overtime status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="firstLevelApproved">First Level Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700" data-testid="button-overtime-search">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {/* Download Button - only show for Overtime tab */}
        {activeTab === "overtime" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-overtime-download">
                <Download className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  data-testid="button-overtime-download-pdf"
                  onClick={handleOvertimeRecordPDFDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );

  const renderLeaveTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Leave Record</h2>
      </div>
      
      {/* Filters */}
      {renderLeaveFilterSection()}

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value={filters.pageSize.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, pageSize: parseInt(value) }))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input 
            className="w-64" 
            placeholder="Search..." 
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Day(s)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingLeave ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading leave records...
                </TableCell>
              </TableRow>
            ) : leaveApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No leave records found
                </TableCell>
              </TableRow>
            ) : (
              leaveApplications.map((leave, index) => (
                <TableRow key={leave.id}>
                  <TableCell data-testid={`leave-row-${index}-no`}>{index + 1}</TableCell>
                  <TableCell data-testid={`leave-row-${index}-name`}>{leave.applicant}</TableCell>
                  <TableCell data-testid={`leave-row-${index}-status`}>
                    <Badge 
                      variant={leave.status === 'Approved' ? 'default' : 
                              leave.status === 'Rejected' ? 'destructive' :
                              leave.status === 'Approved [Level 1]' ? 'secondary' : 'outline'}
                      className={leave.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                    >
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`leave-row-${index}-type`}>{leave.leaveType}</TableCell>
                  <TableCell data-testid={`leave-row-${index}-start`}>{format(new Date(leave.startDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell data-testid={`leave-row-${index}-end`}>{format(new Date(leave.endDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell data-testid={`leave-row-${index}-days`}>{leave.totalDays}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Showing {leaveApplications.length > 0 ? '1' : '0'} to {leaveApplications.length} of {leaveApplications.length} entries
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderClaimTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Claim Record</h2>
      </div>
      
      {/* Filters */}
      {renderClaimFilterSection()}

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value="10">
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input 
            className="w-64" 
            placeholder="Search..." 
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            data-testid="input-claim-search" 
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead>Claim Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Claim For</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supporting Document</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingClaims ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading claim applications...
                </TableCell>
              </TableRow>
            ) : claimError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-red-500">
                  Error loading claims: {claimError.message}
                </TableCell>
              </TableRow>
            ) : searchFilteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No claim applications found matching current filters
                </TableCell>
              </TableRow>
            ) : (
              searchFilteredClaims.map((claim, index) => {
                // Debug log untuk setiap claim record
                console.log('📋 CLAIM RECORD DEBUG:', {
                  index: index + 1,
                  id: claim.id,
                  requestorName: (claim as any).requestorName,
                  employeeName: (claim as any).employeeName,
                  financialPolicyName: claim.financialPolicyName,
                  claimCategory: claim.claimCategory,
                  status: claim.status,
                  particulars: claim.particulars,
                  amount: claim.amount,
                  claimDate: claim.claimDate,
                  supportingDocuments: claim.supportingDocuments
                });

                const getStatusBadge = (status: string) => {
                  switch (status.toLowerCase()) {
                    case 'pending':
                      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
                    case 'approved':
                      return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
                    case 'rejected':
                      return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>;
                    case 'first level approved':
                      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">First Level Approved</Badge>;
                    default:
                      return <Badge variant="outline">{status}</Badge>;
                  }
                };

                return (
                  <TableRow key={claim.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{(claim as any).requestorName || (claim as any).employeeName || 'Unknown Employee'}</TableCell>
                    <TableCell className="capitalize">{claim.financialPolicyName || claim.claimCategory}</TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>{claim.particulars || 'N/A'}</TableCell>
                    <TableCell>RM {parseFloat(claim.amount || '0').toFixed(2)}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          const claimDate = claim.claimDate ? new Date(claim.claimDate) : null;
                          if (!claimDate || isNaN(claimDate.getTime())) {
                            return 'Invalid Date';
                          }
                          return format(claimDate, 'dd/MM/yyyy');
                        } catch (error) {
                          console.error('Date formatting error for claim:', claim.id, 'date:', claim.claimDate, error);
                          return 'Invalid Date';
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {claim.supportingDocuments && claim.supportingDocuments.length > 0 ? (
                          claim.supportingDocuments.map((doc, docIndex) => (
                            <Button 
                              key={docIndex}
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDocumentDownload(doc, claim.id, docIndex)}
                              data-testid={`button-download-document-${claim.id}-${docIndex}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Doc {docIndex + 1}
                            </Button>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No documents</span>
                        )}
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
        <span className="text-sm text-gray-500">
          Showing {searchFilteredClaims.length === 0 ? 0 : 1} to {searchFilteredClaims.length} of {searchFilteredClaims.length} entries
          {searchFilteredClaims.length !== claimApplications.length && (
            <span className="text-blue-600 ml-1">(filtered from {claimApplications.length} total)</span>
          )}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-claim-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-claim-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOvertimeTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Overtime Record</h2>
      </div>
      
      {/* Filters */}
      {renderOvertimeFilterSection()}

      {/* Show entries and search */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <Select value="10">
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">entries</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input 
            className="w-64" 
            placeholder="Search..." 
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            data-testid="input-overtime-search" 
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Total Hour</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingOvertime ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Loading overtime records...
                </TableCell>
              </TableRow>
            ) : searchFilteredOvertime.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No overtime records found
                </TableCell>
              </TableRow>
            ) : (
              searchFilteredOvertime.map((overtime: any, index: number) => {
                console.log(`📋 OVERTIME RECORD ${index + 1}:`, {
                  id: overtime.id,
                  requestorName: overtime.requestorName,
                  employeeName: overtime.employeeName,
                  employee: overtime.employee,
                  status: overtime.status,
                  reason: overtime.reason,
                  remarks: overtime.remarks,
                  additionalDescription: overtime.additionalDescription,
                  totalHours: overtime.totalHours,
                  hours: overtime.hours,
                  calculatedAmount: overtime.calculatedAmount,
                  amount: overtime.amount,
                  claimDate: overtime.claimDate,
                  overtimeDate: overtime.overtimeDate,
                  date: overtime.date,
                  fullRecord: overtime
                });
                
                return (
                <TableRow key={overtime.id}>
                  <TableCell data-testid={`overtime-row-${index}-no`}>{index + 1}</TableCell>
                  <TableCell data-testid={`overtime-row-${index}-applicant`}>
                    {overtime.requestorName || overtime.employeeName || overtime.employee?.fullName || '-'}
                  </TableCell>
                  <TableCell data-testid={`overtime-row-${index}-status`}>
                    <Badge 
                      variant={
                        overtime.status === 'approved' || overtime.status === 'Approved' ? 'default' : 
                        overtime.status === 'rejected' || overtime.status === 'Rejected' ? 'destructive' :
                        overtime.status === 'firstLevelApproved' || overtime.status === 'Approved [Level 1]' ? 'secondary' : 'outline'
                      }
                      className={
                        overtime.status === 'approved' || overtime.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                        overtime.status === 'rejected' || overtime.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                        overtime.status === 'firstLevelApproved' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''
                      }
                    >
                      {overtime.status === 'pending' || overtime.status === 'Pending' ? 'Menunggu' :
                       overtime.status === 'approved' || overtime.status === 'Approved' ? 'Diluluskan' :
                       overtime.status === 'rejected' || overtime.status === 'Rejected' ? 'Ditolak' :
                       overtime.status === 'firstLevelApproved' ? 'Lulus Tahap 1' :
                       overtime.status}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`overtime-row-${index}-reason`}>
                    {overtime.reason || overtime.remarks || overtime.additionalDescription || 'Kerja lebih masa'}
                  </TableCell>
                  <TableCell data-testid={`overtime-row-${index}-hours`}>
                    {overtime.totalHours || overtime.hours || '0'} jam
                  </TableCell>
                  <TableCell data-testid={`overtime-row-${index}-amount`}>
                    RM {overtime.calculatedAmount ? parseFloat(overtime.calculatedAmount).toFixed(2) : 
                         overtime.amount ? parseFloat(overtime.amount).toFixed(2) : '0.00'}
                  </TableCell>
                  <TableCell data-testid={`overtime-row-${index}-date`}>
                    {overtime.claimDate ? format(new Date(overtime.claimDate), 'dd/MM/yyyy') : 
                     overtime.overtimeDate ? format(new Date(overtime.overtimeDate), 'dd/MM/yyyy') : '-'}
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
        <span className="text-sm text-gray-500">
          Showing {searchFilteredOvertime.length > 0 ? '1' : '0'} to {searchFilteredOvertime.length} of {searchFilteredOvertime.length} entries
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-overtime-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-overtime-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Attendance Record</h2>
      </div>
      
      {/* Filters */}
      {renderFilterSection('attendance')}

      {/* Show Picture and Show Note buttons */}
      <div className="flex gap-4">
        <Button 
          variant={showPictures ? "default" : "outline"} 
          onClick={() => setShowPictures(!showPictures)}
          data-testid="button-show-picture"
        >
          <Image className="h-4 w-4 mr-2 text-gray-600" />
          Show Picture
        </Button>
        <Button 
          variant={showNotes ? "default" : "outline"} 
          onClick={() => setShowNotes(!showNotes)}
          data-testid="button-show-note"
        >
          <StickyNote className="h-4 w-4 mr-2 text-gray-600" />
          Show Note
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              {hasAdminAccess && <TableHead>Employee</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Clock In</TableHead>
              {showPictures && <TableHead>Clock In Image</TableHead>}
              {/* Show break columns only if break enforcement is enabled */}
              <TableHead>Break Time</TableHead>
              {showPictures && <TableHead>Break Time Image</TableHead>}
              <TableHead>Break Off</TableHead>
              {showPictures && <TableHead>Break Off Image</TableHead>}
              <TableHead>Clock Out</TableHead>
              {showPictures && <TableHead>Clock Out Image</TableHead>}
              <TableHead>Total Hour(s)</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeTab !== 'attendance' ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 12 : 8) : (showPictures ? 11 : 7)} className="text-center py-8 text-gray-500">
                  Click Attendance tab to view records...
                </TableCell>
              </TableRow>
            ) : isLoadingAttendance ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 12 : 8) : (showPictures ? 11 : 7)} className="text-center py-8 text-gray-500">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : attendanceRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 12 : 8) : (showPictures ? 11 : 7)} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            ) : (
              searchFilteredAttendanceRecords.map((record, index) => {
                // Force debug for each record rendering
                const extendedRecord = record as any;
                const isLate = Boolean(extendedRecord.isLateClockIn);
                
                console.log(`🎨 RENDERING Record ${index + 1}:`, {
                  id: record.id,
                  date: record.date,
                  isLateClockIn: extendedRecord.isLateClockIn,
                  clockInRemarks: extendedRecord.clockInRemarks,
                  willShowRed: isLate
                });
                
                return (
                <TableRow key={record.id}>
                  <TableCell>{index + 1}</TableCell>
                  {hasAdminAccess && <TableCell>{extendedRecord.employeeName || record.employeeId}</TableCell>}
                  <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                  
                  {/* Clock In */}
                  <TableCell>
                    {record.clockInTime ? (
                      <div className="space-y-1">
                        <span className={`${
                          isLate ? 'text-red-600 font-bold bg-red-100 px-2 py-1 rounded border-2 border-red-500' : 'text-gray-800'
                        }`}
                        style={isLate ? { 
                          backgroundColor: '#fee2e2', 
                          color: '#dc2626', 
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '2px solid #ef4444'
                        } : {}}>
                          {(() => {
                            // Parse UTC time and convert to Malaysia time
                            const utcDate = new Date(record.clockInTime);
                            if (isNaN(utcDate.getTime())) return 'Invalid Date';
                            return utcDate.toLocaleTimeString('en-MY', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              timeZone: 'Asia/Kuala_Lumpur',
                              hour12: false 
                            });
                          })()}
                          {isLate && ' ⚠️'}
                        </span>
                        {isLate && extendedRecord.clockInRemarks && (
                          <div className="text-xs text-red-600 bg-red-50 p-1 rounded border mt-1">
                            {extendedRecord.clockInRemarks}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {showPictures && (
                    <TableCell>
                      {record.clockInImage ? (
                        <img 
                          src={record.clockInImage} 
                          alt="Clock In" 
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open(record.clockInImage || '', '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </TableCell>
                  )}
                  
                  {/* Break Time (keluar rehat/lunch) */}
                  <TableCell>
                    {(record as any).breakOutTime ? (
                      <div className="space-y-1">
                        <span className={`${
                          (record as any).isLateBreakOut ? 'text-red-600 font-bold bg-red-100 px-2 py-1 rounded border-2 border-red-500' : 'text-gray-800'
                        }`}
                        style={(record as any).isLateBreakOut ? { 
                          backgroundColor: '#fee2e2', 
                          color: '#dc2626', 
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '2px solid #ef4444'
                        } : {}}>
                          {(() => {
                            const utcDate = new Date((record as any).breakOutTime);
                            if (isNaN(utcDate.getTime())) return 'Invalid Date';
                            return utcDate.toLocaleTimeString('en-MY', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              timeZone: 'Asia/Kuala_Lumpur',
                              hour12: false 
                            });
                          })()}
                          {(record as any).isLateBreakOut && ' ⚠️'}
                        </span>
                        {(record as any).isLateBreakOut && (record as any).breakOutRemarks && (
                          <div className="text-xs text-red-600 bg-red-50 p-1 rounded border">
                            {(record as any).breakOutRemarks}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {showPictures && (
                    <TableCell>
                      {(record as any).breakOutImage ? (
                        <img 
                          src={(record as any).breakOutImage} 
                          alt="Break Time" 
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open((record as any).breakOutImage || '', '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </TableCell>
                  )}
                  
                  {/* Break Off (balik dari rehat/lunch) */}
                  <TableCell>
                    {(record as any).breakInTime ? (
                      <div className="space-y-1">
                        <span className={`${
                          (record as any).isLateBreakIn ? 'text-red-600 font-bold bg-red-100 px-2 py-1 rounded border-2 border-red-500' : 'text-gray-800'
                        }`}
                        style={(record as any).isLateBreakIn ? { 
                          backgroundColor: '#fee2e2', 
                          color: '#dc2626', 
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '2px solid #ef4444'
                        } : {}}>
                          {(() => {
                            const utcDate = new Date((record as any).breakInTime);
                            if (isNaN(utcDate.getTime())) return 'Invalid Date';
                            return utcDate.toLocaleTimeString('en-MY', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              timeZone: 'Asia/Kuala_Lumpur',
                              hour12: false 
                            });
                          })()}
                          {(record as any).isLateBreakIn && ' ⚠️'}
                        </span>
                        {(record as any).isLateBreakIn && (record as any).breakInRemarks && (
                          <div className="text-xs text-red-600 bg-red-50 p-1 rounded border">
                            {(record as any).breakInRemarks}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {showPictures && (
                    <TableCell>
                      {(record as any).breakInImage ? (
                        <img 
                          src={(record as any).breakInImage} 
                          alt="Break Off" 
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open((record as any).breakInImage || '', '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </TableCell>
                  )}
                  
                  {/* Clock Out */}
                  <TableCell>
                    {record.clockOutTime ? (() => {
                      const utcDate = new Date(record.clockOutTime);
                      if (isNaN(utcDate.getTime())) return 'Invalid Date';
                      return utcDate.toLocaleTimeString('en-MY', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        timeZone: 'Asia/Kuala_Lumpur',
                        hour12: false 
                      });
                    })() : '-'}
                  </TableCell>
                  {showPictures && (
                    <TableCell>
                      {record.clockOutImage ? (
                        <img 
                          src={record.clockOutImage} 
                          alt="Clock Out" 
                          className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => window.open(record.clockOutImage || '', '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No image</span>
                      )}
                    </TableCell>
                  )}
                  
                  <TableCell>{record.totalHours ? parseFloat(record.totalHours).toFixed(2) : '0.00'}h</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid={`button-view-${record.id}`}>
                        <Eye className="h-3 w-3 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid={`button-edit-${record.id}`}>
                        <File className="h-3 w-3 text-gray-600" />
                      </Button>
                      {!record.clockOutTime && (
                        <Button 
                          size="sm" 
                          className="h-6 px-2 text-white text-xs"
                          style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)" }}
                          onClick={() => window.location.href = '/mobile-clockout'}
                          data-testid={`button-clock-out-${record.id}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Clock Out
                        </Button>
                      )}
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
        <span className="text-sm text-gray-500">
          Showing {attendanceRecords.length > 0 ? 1 : 0} to {attendanceRecords.length} of {attendanceRecords.length} entries
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled data-testid="button-attendance-previous">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled data-testid="button-attendance-next">
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const [paymentSubTab, setPaymentSubTab] = useState<"salary" | "voucher" | "yearly">("salary");

  const renderPaymentTab = () => {
    const paymentTabs = [
      { id: "salary", label: "Salary Payroll" },
      { id: "voucher", label: "Payment Voucher" },
      { id: "yearly", label: "Yearly Statement" }
    ];

    const renderSalaryPayroll = () => (
      <div className="space-y-4">
        {/* Show entries and search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input className="w-64" placeholder="Search..." data-testid="input-salary-search" />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Payroll Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPayroll ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading payroll records...
                  </TableCell>
                </TableRow>
              ) : userPayrollRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No payroll records available
                  </TableCell>
                </TableRow>
              ) : (
                userPayrollRecords.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{record.year}</TableCell>
                    <TableCell>{record.month}</TableCell>
                    <TableCell>{format(new Date(record.submittedAt), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="default" 
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        Processed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 w-8 p-0 hover:bg-blue-50"
                        onClick={() => handleDownloadPayslip(record.payrollItemId || '', (record as any).employeeName || 'Employee')}
                        data-testid={`button-download-payroll-${record.id}`}
                        title="Download Payslip"
                      >
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-gray-500">
          Showing {userPayrollRecords.length > 0 ? '1' : '0'} to {userPayrollRecords.length} of {userPayrollRecords.length} entries
        </div>
      </div>
    );

    const renderPaymentVoucher = () => (
      <div className="space-y-4">
        {/* Show entries and search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input className="w-64" placeholder="Search..." data-testid="input-voucher-search" />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</div>
      </div>
    );

    const renderYearlyStatement = () => (
      <div className="space-y-4">
        {/* Show entries and search */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <Select value="10">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm">entries</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input className="w-64" placeholder="Search..." data-testid="input-yearly-search" />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Salary Statement</TableHead>
                <TableHead>CP21 Form</TableHead>
                <TableHead>CP22 Form</TableHead>
                <TableHead>EA Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>2023</TableCell>
                <TableCell>No payroll available</TableCell>
                <TableCell>No Data Available</TableCell>
                <TableCell>No Data Available</TableCell>
                <TableCell className="flex items-center gap-2">
                  Document for 2023
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid="button-view-ea">
                      <Eye className="h-3 w-3 text-gray-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid="button-download-ea">
                      <File className="h-3 w-3 text-gray-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" data-testid="button-share-ea">
                      <Share className="h-3 w-3 text-gray-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Showing 1 to 1 of 1 entries</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled data-testid="button-yearly-previous">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" data-testid="button-yearly-current">
              1
            </Button>
            <Button variant="outline" size="sm" disabled data-testid="button-yearly-next">
              Next
            </Button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-4 rounded-lg text-white">
          <h2 className="text-xl font-semibold">Payment Record</h2>
        </div>
        
        {/* Payment Sub-tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {paymentTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPaymentSubTab(tab.id as "salary" | "voucher" | "yearly")}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm",
                  paymentSubTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Payment Sub-tab Content */}
        {paymentSubTab === "salary" && renderSalaryPayroll()}
        {paymentSubTab === "voucher" && renderPaymentVoucher()}
        {paymentSubTab === "yearly" && renderYearlyStatement()}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500" data-testid="breadcrumb">
          Home &gt; MyRecord &gt; {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title">My Record</h1>
        </div>

        {/* Main Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                data-testid={`tab-${tab.id}`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "leave" && renderLeaveTab()}

          {activeTab === "claim" && renderClaimTab()}
          {activeTab === "overtime" && renderOvertimeTab()}
          {activeTab === "attendance" && renderAttendanceTab()}
          {activeTab === "payment" && renderPaymentTab()}
        </div>
      </div>
    </DashboardLayout>
  );
}