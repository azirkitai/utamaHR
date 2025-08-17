import { useState, useEffect } from "react";
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

type TabType = "leave" | "claim" | "overtime" | "attendance" | "payment";

interface FilterState {
  dateFrom: Date;
  dateTo: Date;
  searchTerm: string;
  pageSize: number;
}

export default function MyRecordPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("leave");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPictures, setShowPictures] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: subDays(new Date(), 30),
    dateTo: new Date(),
    searchTerm: "",
    pageSize: 10
  });

  // Check if user has admin access to view other employees' data
  const hasAdminAccess = (user as any)?.role && ['Super Admin', 'Admin', 'HR Manager', 'PIC'].includes((user as any).role);

  // Fetch attendance records from database
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance, error: attendanceError } = useQuery({
    queryKey: ['/api/attendance-records', filters.dateFrom.toISOString(), filters.dateTo.toISOString(), hasAdminAccess ? null : user?.id],
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
      
      const response = await fetch(`/api/attendance-records?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Attendance records API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }
      
      const data = await response.json();
      console.log('Attendance records fetched:', data.length, 'records');
      return data as AttendanceRecord[];
    },
    enabled: !!user && activeTab === 'attendance'
  });

  // Fetch leave applications from database 
  const { data: leaveApplications = [], isLoading: isLoadingLeave, error: leaveError } = useQuery({
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

  // Check if current user has privileged access (Admin/Super Admin/HR Manager)
  const hasPrivilegedAccess = (user as any)?.role && ['Super Admin', 'Admin', 'HR Manager'].includes((user as any).role);
  
  // Force refetch user data to get role information if missing (cleanup after role fix)
  useEffect(() => {
    if (user && !(user as any)?.role) {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  }, [user]);


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
      return data as ClaimApplication[];
    },
    enabled: !!user && !!((user as any)?.role) && (hasPrivilegedAccess || !!currentEmployee?.id) && activeTab === 'claim'
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

  const renderLeaveTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Leave Record</h2>
      </div>
      
      {/* Filters */}
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
          <Select defaultValue="all-leave-type" data-testid="select-leave-type">
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
          <Select defaultValue="all-leave-status" data-testid="select-leave-status">
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
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" data-testid="button-download">
                <Download className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" data-testid="button-download-excel">
                  <Download className="h-4 w-4 mr-2" />
                  Download as Excel
                </Button>
                <Button variant="ghost" className="w-full justify-start" data-testid="button-download-pdf">
                  <Download className="h-4 w-4 mr-2" />
                  Download as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

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
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Claim Record</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-claim-date-period"
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
          <label className="text-sm font-medium">Claim Type</label>
          <Select defaultValue="all-claim-type" data-testid="select-claim-type">
            <SelectTrigger>
              <SelectValue placeholder="All claim type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-claim-type">All claim type</SelectItem>
              <SelectItem value="flight-tix">Flight Tix</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
              <SelectItem value="meal">Meal</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
              <SelectItem value="mileage">Mileage (KM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Claim Status</label>
          <Select defaultValue="all-claim-status" data-testid="select-claim-status">
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
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-claim-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-claim-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
          <Input className="w-64" placeholder="Search..." data-testid="input-claim-search" />
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
            ) : claimApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No claim applications found
                </TableCell>
              </TableRow>
            ) : (
              claimApplications.map((claim, index) => {
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
                    <TableCell>{claim.requestorName || 'Unknown Employee'}</TableCell>
                    <TableCell className="capitalize">{claim.financialPolicyName || claim.claimCategory}</TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>{claim.particulars || 'N/A'}</TableCell>
                    <TableCell>RM {parseFloat(claim.amount).toFixed(2)}</TableCell>
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
          Showing {claimApplications.length === 0 ? 0 : 1} to {claimApplications.length} of {claimApplications.length} entries
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
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Overtime Record</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-overtime-date-period"
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
          <label className="text-sm font-medium">Overtime Status</label>
          <Select defaultValue="all-overtime-status" data-testid="select-overtime-status">
            <SelectTrigger>
              <SelectValue placeholder="All overtime status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-overtime-status">All overtime status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-overtime-search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-overtime-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
          <Input className="w-64" placeholder="Search..." data-testid="input-overtime-search" />
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
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No data available in table
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</span>
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
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
        <h2 className="text-xl font-semibold">Attendance Record</h2>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">Date Period</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-attendance-date-period"
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

        <div className="flex gap-2">
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => {
              // Trigger refetch with current date filter
              console.log('Search clicked - refetching with current date range');
            }}
            data-testid="button-attendance-search"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" data-testid="button-attendance-download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
              <TableHead>Clock Out</TableHead>
              {showPictures && <TableHead>Clock Out Image</TableHead>}
              <TableHead>Total Hour(s)</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingAttendance ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 8 : 6) : (showPictures ? 7 : 5)} className="text-center py-8 text-gray-500">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : attendanceRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasAdminAccess ? (showPictures ? 8 : 6) : (showPictures ? 7 : 5)} className="text-center py-8 text-gray-500">
                  No data available in table
                </TableCell>
              </TableRow>
            ) : (
              attendanceRecords.map((record, index) => (
                <TableRow key={record.id}>
                  <TableCell>{index + 1}</TableCell>
                  {hasAdminAccess && <TableCell>{(record as any).employeeName || record.employeeId}</TableCell>}
                  <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{record.clockInTime ? format(new Date(record.clockInTime), 'HH:mm') : '-'}</TableCell>
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
                  <TableCell>{record.clockOutTime ? format(new Date(record.clockOutTime), 'HH:mm') : '-'}</TableCell>
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
                          style={{ background: "linear-gradient(135deg, #07A3B2 0%, #D9ECC7 100%)" }}
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
              ))
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
                        onClick={() => handleDownloadPayslip(record.payrollItemId, record.employeeName || 'Employee')}
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
            <Button variant="outline" size="sm" className="bg-blue-600 text-white" data-testid="button-yearly-current">
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
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 rounded-lg text-white">
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
                    ? "border-teal-500 text-teal-600"
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