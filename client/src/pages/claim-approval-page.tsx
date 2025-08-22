import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
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
  DollarSign, 
  Clock, 
  Eye, 
  Check, 
  X,
  Search,
  Filter,
  Calendar,
  Shield,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ClaimApplication } from "@shared/schema";

export default function ClaimApprovalPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("approval");
  const [selectedCategory, setSelectedCategory] = useState<"financial" | "overtime" | null>(null);

  // Check URL parameters for direct navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam === 'financial') {
      setActiveTab('approval');
      setSelectedCategory('financial');
    } else if (tabParam === 'overtime') {
      setActiveTab('approval');
      setSelectedCategory('overtime');
    }
  }, []);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClaimForView, setSelectedClaimForView] = useState<any>(null);
  const [summaryDetailModalOpen, setSummaryDetailModalOpen] = useState(false);
  const [selectedEmployeeForSummary, setSelectedEmployeeForSummary] = useState<any>(null);
  const [employeeClaimsDetail, setEmployeeClaimsDetail] = useState<any[]>([]);
  
  // Filter states - uniform across all tabs
  const [filters, setFilters] = useState({
    startDate: '2025-07-01',
    endDate: '2025-08-31', 
    department: 'all',
    employee: 'all',
    claimType: 'all',
    searchTerm: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter handler functions
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  };

  const handleApplyFilters = () => {
    // Filters are automatically applied through state change
    toast({ 
      title: "Filter Digunakan", 
      description: "Filter telah dikemaskini untuk semua tab" 
    });
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '2025-07-01',
      endDate: '2025-08-31',
      department: 'all',
      employee: 'all', 
      claimType: 'all',
      searchTerm: ''
    });
    toast({ 
      title: "Filter Direset", 
      description: "Semua filter telah ditetapkan semula" 
    });
  };

  // Update search function to use unified filter
  const handleSearchChange = (value: string) => {
    handleFilterChange('searchTerm', value);
  };

  const handleViewEmployeeSummary = (employeeName: string, employeeId: string) => {
    try {
      console.log('=== MODAL DEBUG START ===');
      console.log('Employee Name:', employeeName);
      console.log('Employee ID:', employeeId);
      console.log('financialClaimsData exists:', !!financialClaimsData);
      console.log('overtimeClaimsFromDB exists:', !!overtimeClaimsFromDB);
      console.log('selectedCategory:', selectedCategory);
      console.log('employeesData exists:', !!employeesData);
      
      // Filter claims for the specific employee using employeeId (not name)
      let allEmployeeClaims: any[] = [];
      
      if (selectedCategory === 'financial') {
        // For financial summary - use SAME filtered data as summary table
        const baseClaimsForSummary = (financialClaimsData || []).filter((claim: any) => {
          return ['pending', 'Pending', 'firstLevelApproved', 'First Level Approved', 'approved', 'Approved'].includes(claim.status);
        });
        
        // Apply the same filters used in summary calculation
        const filteredClaimsForSummary = applyFilters(baseClaimsForSummary, 'financial');
        
        // Filter only for this specific employee
        const employeeFinancialClaims = filteredClaimsForSummary.filter((claim: any) => 
          claim.employeeId === employeeId
        );
        allEmployeeClaims = employeeFinancialClaims.map((claim: any) => ({ ...claim, type: 'financial' }));
        
        console.log('🔍 MODAL DATA DEBUG - Financial claims for employee:', {
          employeeId,
          employeeName,
          totalRawClaims: (financialClaimsData || []).filter((claim: any) => claim.employeeId === employeeId).length,
          filteredClaims: allEmployeeClaims.length,
          claimStatuses: allEmployeeClaims.map((c: any) => c.status)
        });
        
      } else if (selectedCategory === 'overtime') {
        // For overtime summary - use SAME filtered data as summary table
        const baseOvertimeForSummary = (overtimeClaimsFromDB || []).filter(claim => 
          ['Pending', 'firstLevelApproved', 'Approved'].includes(claim.status)
        );
        
        // Apply the same filters used in summary calculation
        const filteredOvertimeForSummary = applyFilters(baseOvertimeForSummary, 'overtime');
        
        // Filter only for this specific employee
        const employeeOvertimeClaims = filteredOvertimeForSummary.filter((claim: any) => 
          claim.employeeId === employeeId
        );
        allEmployeeClaims = employeeOvertimeClaims.map((claim: any) => ({ ...claim, type: 'overtime' }));
        
        console.log('🔍 MODAL DATA DEBUG - Overtime claims for employee:', {
          employeeId,
          employeeName,
          totalRawClaims: (overtimeClaimsFromDB || []).filter((claim: any) => claim.employeeId === employeeId).length,
          filteredClaims: allEmployeeClaims.length,
          claimStatuses: allEmployeeClaims.map((c: any) => c.status)
        });
        
      } else {
        // For mixed category - show both (should not happen in current design)
        const employeeFinancialClaims = (financialClaimsData || []).filter((claim: any) => 
          claim.employeeId === employeeId
        );
        const employeeOvertimeClaims = (overtimeClaimsFromDB || []).filter((claim: any) => 
          claim.employeeId === employeeId
        );
        allEmployeeClaims = [
          ...employeeFinancialClaims.map((claim: any) => ({ ...claim, type: 'financial' })),
          ...employeeOvertimeClaims.map((claim: any) => ({ ...claim, type: 'overtime' }))
        ];
        console.log('Mixed claims for employee:', allEmployeeClaims);
      }
      
      console.log('Final employee claims:', allEmployeeClaims);
      
      setSelectedEmployeeForSummary({ name: employeeName, id: employeeId });
      setEmployeeClaimsDetail(allEmployeeClaims);
      setSummaryDetailModalOpen(true);
      console.log('Modal should be open now');
      console.log('=== MODAL DEBUG END ===');
      
    } catch (error: any) {
      console.error('Detailed error in handleViewEmployeeSummary:', error);
      console.error('Error stack:', error?.stack);
      console.error('Error message:', error?.message);
      toast({
        title: "Ralat",
        description: `Gagal memuat maklumat claim pekerja: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Get current user info
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch financial claim applications from database
  const { data: financialClaimsData = [], isLoading: isLoadingFinancial } = useQuery<ClaimApplication[]>({
    queryKey: ["/api/claim-applications/type/financial"],
    enabled: selectedCategory === "financial" || selectedCategory === null,

  });

  // Fetch overtime claim applications from database  
  const { data: overtimeClaimsFromDB = [], isLoading: isLoadingOvertime } = useQuery<ClaimApplication[]>({
    queryKey: ["/api/claim-applications/type/overtime"],
    enabled: selectedCategory === "overtime" || selectedCategory === null,
  });

  // Check if current user has approval rights for financial claims
  const { data: approvalSettings } = useQuery({
    queryKey: ["/api/approval-settings/financial"],
  });

  // Check if current user has approval rights for overtime claims
  const { data: overtimeApprovalSettings } = useQuery({
    queryKey: ["/api/overtime/approval-settings"],
  });

  // Fetch employees data for name lookup
  const { data: employeesData = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Fetch financial claim policies for dropdown
  const { data: financialPoliciesData = [] } = useQuery({
    queryKey: ["/api/financial-claim-policies"],
    refetchOnWindowFocus: false,
  });

  // Get unique departments from employees data  
  const departments = Array.from(new Set(
    (employeesData as any[])
      .map((emp: any) => emp.employment?.department)
      .filter((dept: string) => dept)
  ));

  // Get unique claim types from existing claims
  const uniqueFinancialClaimTypes = Array.from(new Set(
    (financialClaimsData as any[])
      ?.map((claim: any) => claim.financialPolicyName || claim.claimCategory)
      .filter((type: string) => type) || []
  ));

  const uniqueOvertimeTypes = Array.from(new Set(
    (overtimeClaimsFromDB as any[])
      ?.map((claim: any) => claim.overtimePolicyType)
      .filter((type: string) => type) || []
  ));

  // Helper function to get employee name by ID
  const getEmployeeName = (employeeId: string) => {
    if (!employeeId) {
      return 'Unknown Employee';
    }
    const employee = (employeesData as any[]).find((emp: any) => emp.id === employeeId);
    return employee ? employee.fullName : `Unknown Employee (${employeeId.slice(0, 8)}...)`;
  };

  // Reset filters if invalid values detected
  useEffect(() => {
    // Check if employee ID exists in the actual employee data
    if (filters.employee !== 'all' && Array.isArray(employeesData) && employeesData.length > 0) {
      const employeeExists = (employeesData as any[]).some((emp: any) => emp.id === filters.employee);
      if (!employeeExists) {
        console.log('Resetting invalid employee filter:', filters.employee);
        setFilters(prev => ({
          ...prev,
          employee: 'all'
        }));
      }
    }
  }, [filters.employee, employeesData]);

  // Approve claim mutation
  const approveMutation = useMutation({
    mutationFn: async ({ claimId }: { claimId: string }) => {
      const token = localStorage.getItem('utamahr_token');
      
      // Find current user's employee record to get employee ID
      const currentEmployee = (employeesData as any[]).find((emp: any) => emp.userId === (currentUser as any).id);
      if (!currentEmployee) {
        throw new Error('Employee record not found');
      }

      const response = await fetch(`/api/claim-applications/${claimId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approverId: currentEmployee.id }),
      });
      if (!response.ok) throw new Error('Failed to approve claim');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Berjaya!", description: "Permohonan telah diluluskan" });
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications/type/overtime"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications/type/financial"] });
    },
    onError: (error: Error) => {
      console.error('Approve claim error:', error);
      toast({
        title: "Ralat!",
        description: error.message || "Gagal meluluskan permohonan",
        variant: "destructive",
      });
    },
  });

  // Reject claim mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      const token = localStorage.getItem('utamahr_token');
      
      // Find current user's employee record to get employee ID
      const currentEmployee = (employeesData as any[]).find((emp: any) => emp.userId === (currentUser as any).id);
      if (!currentEmployee) {
        throw new Error('Employee record not found');
      }

      const response = await fetch(`/api/claim-applications/${claimId}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectorId: currentEmployee.id, reason }),
      });
      if (!response.ok) throw new Error('Failed to reject claim');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Berjaya!", description: "Permohonan telah ditolak" });
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications/type/overtime"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications/type/financial"] });
    },
    onError: (error: Error) => {
      console.error('Reject claim error:', error);
      toast({
        title: "Ralat!",
        description: error.message || "Gagal menolak permohonan",
        variant: "destructive",
      });
    },
  });

  // Check if user has financial approval rights
  const hasFinancialApprovalRights = () => {
    if (!currentUser || !approvalSettings || !employeesData || !Array.isArray(employeesData)) return false;
    
    console.log('=== DEBUGGING FINANCIAL APPROVAL ACCESS ===');
    console.log('Current user:', currentUser);
    console.log('Financial approval settings:', approvalSettings);
    
    // Find current user's employee record
    const currentEmployee = employeesData.find((emp: any) => emp.userId === (currentUser as any).id);
    console.log('Current employee record:', currentEmployee);
    
    if (!currentEmployee) {
      console.log('No employee record found for current user');
      console.log('=== END FINANCIAL DEBUG ===');
      return false;
    }
    
    // Check if user's employee ID is assigned as financial approver
    const isFirstLevel = (approvalSettings as any).firstLevelApprovalId === currentEmployee.id;
    const isSecondLevel = (approvalSettings as any).secondLevelApprovalId === currentEmployee.id;
    
    console.log('Current employee ID:', currentEmployee.id);
    console.log('First level approver ID:', (approvalSettings as any).firstLevelApprovalId);
    console.log('Second level approver ID:', (approvalSettings as any).secondLevelApprovalId);
    console.log('Is first level approver:', isFirstLevel);
    console.log('Is second level approver:', isSecondLevel);
    console.log('=== END FINANCIAL DEBUG ===');
    
    return isFirstLevel || isSecondLevel;
  };

  // Check if user has overtime approval rights
  const hasOvertimeApprovalRights = () => {
    if (!currentUser || !overtimeApprovalSettings || !employeesData || !Array.isArray(employeesData)) return false;
    
    console.log('=== DEBUGGING OVERTIME APPROVAL ACCESS ===');
    console.log('Current user:', currentUser);
    console.log('Overtime approval settings:', overtimeApprovalSettings);
    console.log('Current user ID:', (currentUser as any)?.id);
    console.log('First level approver ID:', (overtimeApprovalSettings as any)?.firstLevel);
    console.log('Second level approver ID:', (overtimeApprovalSettings as any)?.secondLevel);
    
    // Find current user's employee record
    const currentEmployee = employeesData.find((emp: any) => emp.userId === (currentUser as any).id);
    console.log('Current employee record:', currentEmployee);
    
    if (!currentEmployee) {
      console.log('No employee record found for current user');
      console.log('=== END OVERTIME DEBUG ===');
      return false;
    }
    
    // Check if user's employee ID is assigned as overtime approver
    const isFirstLevel = (overtimeApprovalSettings as any).firstLevel === currentEmployee.id;
    const isSecondLevel = (overtimeApprovalSettings as any).secondLevel === currentEmployee.id;
    
    console.log('Current employee ID:', currentEmployee.id);
    console.log('Is first level approver:', isFirstLevel);
    console.log('Is second level approver:', isSecondLevel);
    console.log('=== END OVERTIME DEBUG ===');
    
    return isFirstLevel || isSecondLevel;
  };

  // Handle approve action
  const handleApprove = (claimId: string) => {
    if (!(currentUser as any)?.id) {
      toast({ title: "Error", description: "User information not found", variant: "destructive" });
      return;
    }
    approveMutation.mutate({ claimId });
  };

  // Handle reject action
  const handleReject = (claimId: string) => {
    if (!(currentUser as any)?.id) {
      toast({ title: "Error", description: "User information not found", variant: "destructive" });
      return;
    }
    const reason = prompt("Sila nyatakan sebab penolakan:");
    if (reason) {
      rejectMutation.mutate({ claimId, reason });
    }
  };

  // Handle view action
  const handleView = (claim: any) => {
    setSelectedClaimForView(claim);
    setViewModalOpen(true);
  };

  // Function to determine which buttons should be shown based on user approval rights and claim status
  const getAvailableActions = (claim: any) => {
    // Only show buttons in approval tab
    if (activeTab !== 'approval') return { canApprove: false, canReject: false };
    
    const isFinancial = selectedCategory === 'financial';
    let canApprove = false;
    let canReject = false;
    
    if (isFinancial) {
      const financialSettings = approvalSettings;
      if (!financialSettings || !currentUser || !employeesData) return { canApprove: false, canReject: false };
      
      const currentEmployee = (employeesData as any[]).find((emp: any) => emp.userId === (currentUser as any).id);
      if (!currentEmployee) return { canApprove: false, canReject: false };
      
      const isFirstLevel = (financialSettings as any).firstLevelApprovalId === currentEmployee.id;
      const isSecondLevel = (financialSettings as any).secondLevelApprovalId === currentEmployee.id;
      
      // For financial claims: Maryam is first level approver, system is "First Level" only
      if (claim.status === 'Pending' || claim.status === 'pending') {
        // Pending claims can be approved by first level approvers
        canApprove = isFirstLevel;
        canReject = isFirstLevel;
      } else if (claim.status === 'First Level Approved' || claim.status === 'firstLevelApproved') {
        // If there's a second level approver configured, they can approve/reject
        canApprove = isSecondLevel && (financialSettings as any).secondLevelApprovalId;
        canReject = isSecondLevel && (financialSettings as any).secondLevelApprovalId;
      }
    } else {
      // For overtime claims
      const overtimeSettings = overtimeApprovalSettings;
      if (!overtimeSettings || !currentUser || !employeesData) return { canApprove: false, canReject: false };
      
      const currentEmployee = (employeesData as any[]).find((emp: any) => emp.userId === (currentUser as any).id);
      if (!currentEmployee) return { canApprove: false, canReject: false };
      
      const isFirstLevel = (overtimeSettings as any).firstLevel === currentEmployee.id;
      const isSecondLevel = (overtimeSettings as any).secondLevel === currentEmployee.id && 
                           (overtimeSettings as any).secondLevel !== '';
      
      // For overtime claims
      if (claim.status === 'Pending' || claim.status === 'pending') {
        canApprove = isFirstLevel;
        canReject = isFirstLevel;
      } else if (claim.status === 'First Level Approved' || claim.status === 'firstLevelApproved') {
        canApprove = isSecondLevel;
        canReject = isSecondLevel;
      }
    }
    
    return { canApprove, canReject };
  };

  // Check if user can see different types of claims
  const userCanApproveFinancial = hasFinancialApprovalRights();
  const userCanApproveOvertime = hasOvertimeApprovalRights();
  
  // Filter claims based on user approval rights AND status 
  // Approval tab: only pending claims (requires approval rights)
  // Report tab: processed claims (accessible to all users for transparency)
  // Filter function that applies all filters uniformly
  const applyFilters = (claims: any[], type: 'financial' | 'overtime') => {
    if (!claims) return [];
    
    // Applying filters to claims data
    
    const filteredClaims = claims.filter((claim: any) => {
      // Date filter
      const claimDateValue = type === 'financial' ? claim.claimDate : (claim.date || claim.createdAt);
      const claimDate = new Date(claimDateValue);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      const dateInRange = claimDateValue && !isNaN(claimDate.getTime()) && claimDate >= startDate && claimDate <= endDate;
      

      
      // Department filter
      const employeeDepartment = (employeesData as any[]).find((emp: any) => emp.id === claim.employeeId)?.employment?.department;
      const departmentMatch = filters.department === 'all' || employeeDepartment === filters.department;
      
      // Employee filter
      const employeeMatch = filters.employee === 'all' || claim.employeeId === filters.employee;
      
      // Claim type filter
      const claimTypeMatch = filters.claimType === 'all' || 
        (type === 'financial' && (claim.claimType === filters.claimType || claim.financialPolicyName === filters.claimType)) ||
        (type === 'overtime' && claim.overtimePolicyType === filters.claimType);
      
      // Search filter
      const employeeName = getEmployeeName(claim.employeeId);
      const searchMatch = filters.searchTerm === '' || 
        employeeName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (claim.reason && claim.reason.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (claim.particulars && claim.particulars.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      const shouldPass = dateInRange && departmentMatch && employeeMatch && claimTypeMatch && searchMatch;
      
      // Return filtered result
      
      return shouldPass;
    });
    
    return filteredClaims;
  };

  const filteredFinancialClaims = (() => {
    if (!financialClaimsData) return [];
    
    // First apply tab-specific status filtering
    let tabFilteredClaims = [];
    if (activeTab === 'approval') {
      // APPROVAL TAB: Only show pending claims that user can approve
      if (!userCanApproveFinancial) return [];
      tabFilteredClaims = financialClaimsData.filter((claim: any) => {
        const isPending = claim.status?.toLowerCase() === 'pending';
        return isPending;
      });
    } else if (activeTab === 'report') {
      // REPORT TAB: Only show processed claims (approved, rejected) - NOT pending
      tabFilteredClaims = financialClaimsData.filter((claim: any) => {
        const status = claim.status?.toLowerCase();
        return ['approved', 'rejected'].includes(status);
      });
    } else {
      // SUMMARY TAB: Show pending and approved claims only (NO rejected)
      tabFilteredClaims = financialClaimsData.filter((claim: any) => {
        const status = claim.status?.toLowerCase();
        return ['pending', 'firstlevelapproved', 'approved'].includes(status);
      });
    }
    
    // Then apply additional filters
    return applyFilters(tabFilteredClaims, 'financial');
  })();
      
  const filteredOvertimeClaims = (() => {
    if (!overtimeClaimsFromDB) return [];
    
    // First apply tab-specific status filtering
    let tabFilteredClaims = [];
    if (activeTab === 'approval') {
      // APPROVAL TAB: Show claims that user can approve based on current status
      if (!userCanApproveOvertime) return [];
      
      tabFilteredClaims = overtimeClaimsFromDB.filter((claim: any) => {
        console.log('Overtime claim filtering:', { claimId: claim.id, status: claim.status, activeTab });
        
        const { canApprove } = getAvailableActions(claim);
        // Show claims where user can take approval action
        return canApprove || (claim.status === 'Pending' || claim.status === 'pending');
      });
    } else if (activeTab === 'report') {
      // REPORT TAB: Show ALL processed claims (approved, rejected, firstLevelApproved)
      tabFilteredClaims = overtimeClaimsFromDB.filter((claim: any) => {
        console.log('Overtime claim filtering:', { claimId: claim.id, status: claim.status, activeTab });
        return ['approved', 'Approved', 'rejected', 'Rejected', 'firstLevelApproved', 'First Level Approved'].includes(claim.status);
      });
    } else {
      // SUMMARY TAB: Show pending and approved claims only (NO rejected)
      tabFilteredClaims = overtimeClaimsFromDB.filter((claim: any) => {
        console.log('Overtime claim filtering:', { claimId: claim.id, status: claim.status, activeTab });
        return ['pending', 'Pending', 'firstLevelApproved', 'First Level Approved', 'approved', 'Approved'].includes(claim.status);
      });
    }
    
    // Then apply additional filters
    return applyFilters(tabFilteredClaims, 'overtime');
  })();

  console.log('Filtered results:', { 
    activeTab, 
    financialCount: filteredFinancialClaims.length, 
    overtimeCount: filteredOvertimeClaims.length,
    rawOvertimeData: overtimeClaimsFromDB?.length || 0
  });

  // Legacy sample data - will be replaced by real data above
  const legacyFinancialClaimsData = [
    {
      id: 1,
      requestor: "Ahmad Ali",
      claimType: "Medical",
      status: "Pending",
      claimFor: "Hospital Bill",
      amount: "RM 850.00",
      date: "2025-08-05"
    },
    {
      id: 2,
      requestor: "Siti Aminah",
      claimType: "Travel",
      status: "Approved",
      claimFor: "Business Trip",
      amount: "RM 420.50",
      date: "2025-08-04"
    }
  ];

  // Sample data untuk Overtime Claims (legacy)
  const legacyOvertimeClaimsData = [
    {
      id: 1,
      applicant: "Muhammad Hafiz",
      status: "Pending",
      reason: "Project Deadline",
      totalHour: "4 hours",
      amount: "RM 120.00",
      date: "2025-08-06"
    },
    {
      id: 2,
      applicant: "Fatimah Zahra",
      status: "Approved",
      reason: "System Maintenance",
      totalHour: "6 hours",
      amount: "RM 180.00",
      date: "2025-08-05"
    }
  ];

  // Summary data - separate for financial and overtime - APPLIES SAME FILTERS AS REPORT TAB
  const financialSummaryData = useMemo(() => {
    if (!employeesData || !financialClaimsData) return [];
    
    // USE SAME FILTERED DATA AS REPORT TAB: Apply all filters first
    const baseClaimsForSummary = financialClaimsData.filter((claim: any) => {
      return ['pending', 'Pending', 'firstLevelApproved', 'First Level Approved', 'approved', 'Approved'].includes(claim.status);
    });
    
    // Apply the same filters used in Report/Approval tabs
    const filteredClaimsForSummary = applyFilters(baseClaimsForSummary, 'financial');
    
    // Group filtered claims by employee ID
    const claimsGroupedByEmployee = filteredClaimsForSummary.reduce((acc: any, claim: any) => {
      const employeeId = claim.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          claims: []
        };
      }
      acc[employeeId].claims.push(claim);
      return acc;
    }, {});
    
    // Convert to summary format
    return Object.values(claimsGroupedByEmployee).map((group: any, index) => {
      const employee = (employeesData as any[]).find(emp => emp.id === group.employeeId);
      const employeeName = employee ? employee.fullName : 'Unknown Employee';
      
      // Count pending and approved claims for FINANCIAL
      const pendingClaims = group.claims.filter((claim: any) => claim.status === 'Pending');
      const approvedClaims = group.claims.filter((claim: any) => ['Approved', 'firstLevelApproved'].includes(claim.status));
      
      // Calculate total amounts
      const pendingAmount = pendingClaims.reduce((total: number, claim: any) => total + (parseFloat(claim.amount) || 0), 0);
      const totalAmount = group.claims.reduce((total: number, claim: any) => total + (parseFloat(claim.amount) || 0), 0);
      
      console.log(`📊 FINANCIAL SUMMARY - ${employeeName}:`, {
        totalClaims: group.claims.length,
        pendingClaims: pendingClaims.length,
        approvedClaims: approvedClaims.length,
        allStatuses: group.claims.map((c: any) => c.status),
        pendingAmount,
        totalAmount
      });

      return {
        id: index + 1,
        name: employeeName,
        employeeId: group.employeeId,
        pendingClaim: `RM ${pendingAmount.toFixed(2)}`,
        approvedClaim: `${approvedClaims.length}/${group.claims.length}`,
        totalAmountClaim: `RM ${totalAmount.toFixed(2)}`
      };
    }).filter(summary => summary.name !== 'Unknown Employee'); // Remove entries without valid employee
  }, [employeesData, financialClaimsData, filters]); // Add filters dependency

  const overtimeSummaryData = useMemo(() => {
    if (!employeesData || !overtimeClaimsFromDB) return [];
    
    // USE SAME FILTERED DATA AS REPORT TAB: Apply all filters first
    const baseOvertimeForSummary = overtimeClaimsFromDB.filter(claim => 
      ['Pending', 'firstLevelApproved', 'Approved'].includes(claim.status)
    );
    
    // Apply the same filters used in Report/Approval tabs
    const filteredOvertimeForSummary = applyFilters(baseOvertimeForSummary, 'overtime');
    
    // Group filtered claims by employee ID
    const claimsGroupedByEmployee = filteredOvertimeForSummary.reduce((acc: any, claim: any) => {
      const employeeId = claim.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          claims: []
        };
      }
      acc[employeeId].claims.push(claim);
      return acc;
    }, {});
    
    // Convert to summary format
    return Object.values(claimsGroupedByEmployee).map((group: any, index) => {
      const employee = (employeesData as any[]).find(emp => emp.id === group.employeeId);
      const employeeName = employee ? employee.fullName : 'Unknown Employee';
      
      // Count pending and approved claims for OVERTIME
      const pendingClaims = group.claims.filter((claim: any) => claim.status === 'Pending');
      const approvedClaims = group.claims.filter((claim: any) => ['Approved', 'firstLevelApproved'].includes(claim.status));
      
      // Calculate amounts - for overtime, only count approved amounts in total
      const pendingAmount = pendingClaims.reduce((total: number, claim: any) => total + (parseFloat(claim.amount) || 0), 0);
      const approvedAmount = approvedClaims.reduce((total: number, claim: any) => total + (parseFloat(claim.amount) || 0), 0);
      
      console.log(`📊 OVERTIME SUMMARY - ${employeeName}:`, {
        totalClaims: group.claims.length,
        pendingClaims: pendingClaims.length,
        approvedClaims: approvedClaims.length,
        allStatuses: group.claims.map((c: any) => c.status),
        pendingAmount,
        approvedAmount
      });

      return {
        id: index + 1,
        name: employeeName,
        employeeId: group.employeeId,
        pendingClaim: `RM ${pendingAmount.toFixed(2)}`,
        approvedClaim: `${approvedClaims.length}/${group.claims.length}`,
        totalAmountClaim: `RM ${approvedAmount.toFixed(2)}` // Only approved amounts
      };
    }).filter(summary => summary.name !== 'Unknown Employee'); // Remove entries without valid employee
  }, [employeesData, overtimeClaimsFromDB, filters]); // Add filters dependency

  // Use appropriate summary data based on selected category
  const summaryData = selectedCategory === 'financial' ? financialSummaryData : overtimeSummaryData;

  const handleCategorySelect = (category: "financial" | "overtime") => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setActiveTab("approval");
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
      case "firstlevelapproved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "awaitingsecondapproval":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-slate-200">Awaiting Second Approval</Badge>;
      case "rejected":
      case "firstlevelrejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderCategorySelection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Approval for Claim</h2>
        <p className="text-gray-600">Please select claim category</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Claim */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-slate-900 to-cyan-800 text-white border-0"
          onClick={() => handleCategorySelect("financial")}
          data-testid="card-financial-claim"
        >
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Financial Claim</h3>
          </CardContent>
        </Card>

        {/* Overtime Claim */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-slate-900 to-cyan-800 text-white border-0"
          onClick={() => handleCategorySelect("overtime")}
          data-testid="card-overtime-claim"
        >
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Overtime Claim</h3>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );

  const renderTabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      <Button
        variant={activeTab === "approval" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "approval" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("approval")}
        data-testid="tab-claim-approval"
      >
        Claim Approval
      </Button>
      <Button
        variant={activeTab === "report" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "report" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("report")}
        data-testid="tab-claim-report"
      >
        Claim Report
      </Button>
      <Button
        variant={activeTab === "summary" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "summary" ? "bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("summary")}
        data-testid="tab-claim-summary"
      >
        Claim Summary
      </Button>
    </div>
  );

  const renderApprovalTab = () => {
    
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">
            {selectedCategory === "financial" ? "Claim Applications" : "Claim Applications"}
          </h3>
        </div>

        {/* Bulk Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-40" data-testid="select-bulk-action">
                <SelectValue placeholder="Bulk action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve Selected</SelectItem>
                <SelectItem value="reject">Reject Selected</SelectItem>
                <SelectItem value="delete">Delete Selected</SelectItem>
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
                value={filters.searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
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
                {selectedCategory === "financial" ? (
                  <>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Claim Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Claim For</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Total Hour</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedCategory === "financial" ? (
                filteredFinancialClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {activeTab === 'approval' ? 
                        (userCanApproveFinancial ? 
                          "No pending claims available" : 
                          "You don't have permission to approve financial claims"
                        ) :
                        "No processed financial claims available"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFinancialClaims.map((item, index) => (
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
                      <TableCell className="font-medium">{getEmployeeName(item.employeeId)}</TableCell>
                      <TableCell>{item.financialPolicyName || item.claimType || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.particulars || item.reason || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{item.amount ? `RM ${item.amount}` : 'N/A'}</TableCell>
                      <TableCell>{new Date(item.claimDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            data-testid={`button-view-${item.id}`}
                            onClick={() => handleView(item)}
                            title="Lihat Maklumat"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(() => {
                            const actions = getAvailableActions(item);
                            return (
                              <>
                                {actions.canApprove && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-600 hover:bg-green-50" 
                                    data-testid={`button-approve-${item.id}`}
                                    onClick={() => handleApprove(item.id)}
                                    disabled={approveMutation.isPending}
                                    title="Lulus"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {actions.canReject && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:bg-red-50" 
                                    data-testid={`button-reject-${item.id}`}
                                    onClick={() => handleReject(item.id)}
                                    disabled={rejectMutation.isPending}
                                    title="Tolak"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                filteredOvertimeClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {activeTab === 'approval' ? 
                        (userCanApproveOvertime ? 
                          "No pending claims available" : 
                          "You don't have permission to approve overtime claims"
                        ) :
                        "No processed overtime claims available"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOvertimeClaims.map((item, index) => (
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
                      <TableCell className="font-medium">{getEmployeeName(item.employeeId)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.reason}</TableCell>
                      <TableCell>{item.startTime} - {item.endTime}</TableCell>
                      <TableCell className="font-medium">{item.calculatedAmount ? `RM ${item.calculatedAmount}` : 'N/A'}</TableCell>
                      <TableCell>{new Date(item.claimDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            data-testid={`button-view-${item.id}`}
                            onClick={() => handleView(item)}
                            title="Lihat Maklumat"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(() => {
                            const actions = getAvailableActions(item);
                            return (
                              <>
                                {actions.canApprove && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-600 hover:bg-green-50" 
                                    data-testid={`button-approve-${item.id}`}
                                    onClick={() => handleApprove(item.id)}
                                    disabled={approveMutation.isPending}
                                    title="Lulus"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {actions.canReject && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-600 hover:bg-red-50" 
                                    data-testid={`button-reject-${item.id}`}
                                    onClick={() => handleReject(item.id)}
                                    disabled={rejectMutation.isPending}
                                    title="Tolak"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
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
  };

  const renderReportTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">
          {selectedCategory === "financial" ? "Claim Application Report" : "Claim Application Report"}
        </h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Period</label>
          <Input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="text-sm" 
          />
        </div>
        <div>
          <Input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="text-sm mt-6" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Pilih department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All department</SelectItem>
              {departments.map((dept: string) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <Select value={filters.employee} onValueChange={(value) => handleFilterChange('employee', value)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Pilih pekerja">
                {filters.employee === 'all' ? 'All employee' : getEmployeeName(filters.employee)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employee</SelectItem>
              {Array.isArray(employeesData) && employeesData.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedCategory === "financial" ? "Claim Type" : "Overtime Status"}
          </label>
          <Select value={filters.claimType} onValueChange={(value) => handleFilterChange('claimType', value)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder={selectedCategory === "financial" ? "Pilih jenis claim" : "Pilih status overtime"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {selectedCategory === "financial" ? "All claim type" : "All overtime status"}
              </SelectItem>
              {selectedCategory === "financial" ? (
                <>
                  {Array.isArray(financialPoliciesData) && financialPoliciesData.map((policy: any) => (
                    <SelectItem key={policy.id} value={policy.claimName}>
                      {policy.claimName}
                    </SelectItem>
                  ))}
                </>
              ) : (
                <>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="rest_day">Rest Day</SelectItem>  
                  <SelectItem value="public_holiday">Public Holiday</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            data-testid="button-reset-filter"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search:"
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-64"
            data-testid="input-search-report"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>No.</TableHead>
              {selectedCategory === "financial" ? (
                <>
                  <TableHead>Requestor</TableHead>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Claim For</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Total Hour</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedCategory === "financial" ? (
              filteredFinancialClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No processed financial claims available
                  </TableCell>
                </TableRow>
              ) : (
                filteredFinancialClaims.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{getEmployeeName(item.employeeId)}</TableCell>
                    <TableCell>{item.financialPolicyName || item.claimType || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.particulars || item.reason || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{item.amount ? `RM ${item.amount}` : 'N/A'}</TableCell>
                    <TableCell>{new Date(item.claimDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )
            ) : (
              filteredOvertimeClaims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No processed overtime claims available
                  </TableCell>
                </TableRow>
              ) : (
                filteredOvertimeClaims.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{getEmployeeName(item.employeeId)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.startTime} - {item.endTime}</TableCell>
                    <TableCell className="font-medium">{item.calculatedAmount ? `RM ${item.calculatedAmount}` : 'N/A'}</TableCell>
                    <TableCell>{new Date(item.claimDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {((selectedCategory === "financial" && filteredFinancialClaims.length > 0) || 
        (selectedCategory === "overtime" && filteredOvertimeClaims.length > 0)) && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Menunjukkan 1 hingga {selectedCategory === "financial" ? filteredFinancialClaims.length : filteredOvertimeClaims.length} daripada {selectedCategory === "financial" ? filteredFinancialClaims.length : filteredOvertimeClaims.length} rekod
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" disabled data-testid="button-previous-report">
              Previous
            </Button>
            <Button variant="outline" className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white" data-testid="button-page-1">
              1
            </Button>
            <Button variant="outline" disabled data-testid="button-next-report">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSummaryTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">
          {selectedCategory === "financial" ? "Claim Application Summary" : "Overtime Application Summary"}
        </h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Period</label>
          <Input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="text-sm" 
          />
        </div>
        <div>
          <Input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="text-sm mt-6" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Pilih department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All department</SelectItem>
              {departments.map((dept: string) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <Select value={filters.employee} onValueChange={(value) => handleFilterChange('employee', value)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Pilih pekerja">
                {filters.employee === 'all' ? 'All employee' : getEmployeeName(filters.employee)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employee</SelectItem>
              {Array.isArray(employeesData) && employeesData.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end space-x-2">
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            data-testid="button-reset-filter-summary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search:"
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
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
              <TableHead>Pending Claim</TableHead>
              <TableHead>Approved Claim</TableHead>
              <TableHead>Total Amount Claim</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoadingFinancial || isLoadingOvertime || !employeesData) ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Memuat data summary...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : summaryData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="text-gray-500">
                    Tiada data summary untuk kategori {selectedCategory === 'financial' ? 'kewangan' : 'overtime'}.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              summaryData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell 
                    className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline"
                    onClick={() => handleViewEmployeeSummary(item.name, item.employeeId || '')}
                    data-testid={`link-employee-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {item.name}
                  </TableCell>
                  <TableCell>{item.pendingClaim}</TableCell>
                  <TableCell>{item.approvedClaim}</TableCell>
                  <TableCell className="font-medium">{item.totalAmountClaim}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {summaryData.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Menunjukkan 1 hingga {summaryData.length} daripada {summaryData.length} rekod
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
      )}
    </div>
  );

  const getPageTitle = () => {
    if (!selectedCategory) return "Approval for Claim";
    
    const categoryName = selectedCategory === "financial" ? "Financial" : "Overtime";
    switch (activeTab) {
      case "approval":
        return `Manage ${categoryName} Claim Approval`;
      case "report":
        return `Manage ${categoryName} Claim Report`;
      case "summary":
        return `Manage ${categoryName} Claim Summary`;
      default:
        return `Manage ${categoryName} Claim Approval`;
    }
  };

  const getBreadcrumb = () => {
    if (!selectedCategory) return "Home > Claim > Approval";
    
    const categoryName = selectedCategory === "financial" ? "Financial" : "Overtime";
    switch (activeTab) {
      case "approval":
        return `Home > Claim > ${categoryName} > Approval`;
      case "report":
        return `Home > Claim > ${categoryName} > Report`;
      case "summary":
        return `Home > Claim > ${categoryName} > Summary`;
      default:
        return `Home > Claim > ${categoryName} > Approval`;
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
          {selectedCategory && (
            <Button 
              variant="outline" 
              onClick={handleBackToCategories}
              data-testid="button-back-to-categories"
            >
              Back to Categories
            </Button>
          )}
        </div>

        {/* Content */}
        {!selectedCategory ? (
          renderCategorySelection()
        ) : (
          <div className="space-y-6">
            {renderTabNavigation()}
            
            {activeTab === "approval" && renderApprovalTab()}
            {activeTab === "report" && renderReportTab()}
            {activeTab === "summary" && renderSummaryTab()}
          </div>
        )}

        {/* Employee Summary Detail Modal */}
        {summaryDetailModalOpen && selectedEmployeeForSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto" role="dialog" aria-labelledby="summary-detail-title" aria-describedby="summary-detail-description">
              <div className="flex justify-between items-center mb-6">
                <h2 id="summary-detail-title" className="text-2xl font-bold">Senarai Lengkap Claim - {selectedEmployeeForSummary.name}</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSummaryDetailModalOpen(false)}
                  data-testid="button-close-summary-detail"
                >
                  ✕
                </Button>
              </div>
              
              <div id="summary-detail-description" className="sr-only">
                Modal yang menunjukkan senarai lengkap claim untuk pekerja terpilih
              </div>
              {employeeClaimsDetail.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Tiada claim dijumpai untuk pekerja ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Bil</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Jenis</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Polisi/Sebab</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Tarikh</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          {selectedCategory === 'overtime' ? 'Masa Overtime' : 'Amaun'}
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          {selectedCategory === 'overtime' ? 'Jam' : 'Status'}
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          {selectedCategory === 'overtime' ? 'Amaun' : 'Dokumen'}
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          {selectedCategory === 'overtime' ? 'Status' : ''}
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          {selectedCategory === 'overtime' ? 'Dokumen' : ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeClaimsDetail.map((claim, index) => (
                        <tr key={claim.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {claim.type === 'financial' ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                Kewangan
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                Overtime
                              </span>
                            )}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {claim.type === 'financial' 
                              ? (claim.financialPolicyName || claim.claimType || 'N/A')
                              : (claim.reason || 'Kerja Lebih Masa')
                            }
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {claim.type === 'financial' 
                              ? new Date(claim.claimDate).toLocaleDateString('ms-MY')
                              : new Date(claim.date).toLocaleDateString('ms-MY')
                            }
                          </td>
                          
                          {/* Different columns for overtime vs financial */}
                          {selectedCategory === 'overtime' ? (
                            <>
                              {/* Masa Overtime */}
                              <td className="border border-gray-300 px-4 py-2">
                                {claim.type === 'overtime' ? `${claim.startTime} - ${claim.endTime}` : 'N/A'}
                              </td>
                              {/* Jam */}
                              <td className="border border-gray-300 px-4 py-2">
                                {claim.type === 'overtime' ? `${claim.totalHours || 0} jam` : 'N/A'}
                              </td>
                              {/* Amaun */}
                              <td className="border border-gray-300 px-4 py-2 font-medium">
                                {claim.type === 'financial' 
                                  ? `RM ${claim.amount}`
                                  : `RM ${claim.amount || '0.00'}`
                                }
                              </td>
                              {/* Status */}
                              <td className="border border-gray-300 px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  claim.status === 'firstLevelApproved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {claim.status === 'pending' ? 'Menunggu' :
                                   claim.status === 'approved' ? 'Diluluskan' :
                                   claim.status === 'rejected' ? 'Ditolak' :
                                   claim.status === 'firstLevelApproved' ? 'Lulus Tahap 1' :
                                   claim.status}
                                </span>
                              </td>
                              {/* Dokumen */}
                              <td className="border border-gray-300 px-4 py-2">
                                {claim.type === 'financial' ? (
                                  // Handle financial claim documents
                                  claim.supportingDocuments && claim.supportingDocuments.length > 0 ? (
                                    <div className="space-y-1">
                                      {claim.supportingDocuments.map((doc: any, docIndex: number) => (
                                        <Button
                                          key={docIndex}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(doc.url || doc, '_blank')}
                                          data-testid={`button-view-doc-${claim.id}-${docIndex}`}
                                          className="text-xs"
                                        >
                                          📎 Dokumen {docIndex + 1}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Tiada</span>
                                  )
                                ) : (
                                  // Handle overtime claim documents
                                  claim.supportingDocument ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(claim.supportingDocument, '_blank')}
                                      data-testid={`button-view-doc-${claim.id}`}
                                      className="text-xs"
                                    >
                                      📎 Lihat Dokumen
                                    </Button>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Tiada</span>
                                  )
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Financial layout - Amaun */}
                              <td className="border border-gray-300 px-4 py-2 font-medium">
                                {claim.type === 'financial' 
                                  ? `RM ${claim.amount}`
                                  : `RM ${claim.amount || '0.00'}`
                                }
                              </td>
                              {/* Status */}
                              <td className="border border-gray-300 px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  claim.status === 'firstLevelApproved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {claim.status === 'pending' ? 'Menunggu' :
                                   claim.status === 'approved' ? 'Diluluskan' :
                                   claim.status === 'rejected' ? 'Ditolak' :
                                   claim.status === 'firstLevelApproved' ? 'Lulus Tahap 1' :
                                   claim.status}
                                </span>
                              </td>
                              {/* Dokumen */}
                              <td className="border border-gray-300 px-4 py-2">
                                {claim.type === 'financial' ? (
                                  // Handle financial claim documents
                                  claim.supportingDocuments && claim.supportingDocuments.length > 0 ? (
                                    <div className="space-y-1">
                                      {claim.supportingDocuments.map((doc: any, docIndex: number) => (
                                        <Button
                                          key={docIndex}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(doc.url || doc, '_blank')}
                                          data-testid={`button-view-doc-${claim.id}-${docIndex}`}
                                          className="text-xs"
                                        >
                                          📎 Dokumen {docIndex + 1}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Tiada</span>
                                  )
                                ) : (
                                  // Handle overtime claim documents
                                  claim.supportingDocument ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(claim.supportingDocument, '_blank')}
                                      data-testid={`button-view-doc-${claim.id}`}
                                      className="text-xs"
                                    >
                                      📎 Lihat Dokumen
                                    </Button>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Tiada</span>
                                  )
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSummaryDetailModalOpen(false)}
                  data-testid="button-close-summary-detail-bottom"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Claim Modal */}
        {viewModalOpen && selectedClaimForView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" role="dialog" aria-labelledby="view-claim-title" aria-describedby="view-claim-description">
              <div className="flex justify-between items-center mb-4">
                <h2 id="view-claim-title" className="text-2xl font-bold">Maklumat Permohonan</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setViewModalOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div id="view-claim-description" className="sr-only">
                Modal yang menunjukkan maklumat lengkap permohonan claim terpilih
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-gray-700">Pemohon:</label>
                  <p className="text-gray-900">
                    {getEmployeeName(selectedClaimForView.employeeId)}
                  </p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Jenis Permohonan:</label>
                  <p className="text-gray-900">
                    {selectedCategory === 'financial' ? selectedClaimForView.claimType : 'Overtime'}
                  </p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Status:</label>
                  <p className="text-gray-900">
                    {selectedClaimForView.status === 'pending' ? 'Menunggu' : 
                     selectedClaimForView.status === 'approved' ? 'Diluluskan' :
                     selectedClaimForView.status === 'rejected' ? 'Ditolak' : selectedClaimForView.status}
                  </p>
                </div>
                
                <div>
                  <label className="font-medium text-gray-700">Tarikh Permohonan:</label>
                  <p className="text-gray-900">
                    {new Date(selectedClaimForView.claimDate).toLocaleDateString('ms-MY')}
                  </p>
                </div>
                
                {selectedCategory === 'financial' ? (
                  <>
                    <div>
                      <label className="font-medium text-gray-700">Polisi Tuntutan:</label>
                      <p className="text-gray-900">
                        {selectedClaimForView.financialPolicyName || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="font-medium text-gray-700">Jumlah:</label>
                      <p className="text-gray-900 font-bold text-lg">
                        RM {selectedClaimForView.amount || '0.00'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="font-medium text-gray-700">Sebab:</label>
                      <p className="text-gray-900">
                        {selectedClaimForView.reason || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="font-medium text-gray-700">Masa:</label>
                      <p className="text-gray-900">
                        {selectedClaimForView.startTime} - {selectedClaimForView.endTime}
                      </p>
                    </div>
                    
                    <div>
                      <label className="font-medium text-gray-700">Jumlah Jam:</label>
                      <p className="text-gray-900">
                        {selectedClaimForView.totalHours || 0} jam
                      </p>
                    </div>
                    
                    <div>
                      <label className="font-medium text-gray-700">Amaun:</label>
                      <p className="text-gray-900 font-bold text-lg">
                        RM {selectedClaimForView.calculatedAmount || '0.00'}
                      </p>
                    </div>
                  </>
                )}
                
                {selectedClaimForView.reason && selectedCategory === 'financial' && (
                  <div className="col-span-2">
                    <label className="font-medium text-gray-700">Catatan:</label>
                    <p className="text-gray-900">
                      {selectedClaimForView.reason}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setViewModalOpen(false)}
                >
                  Tutup
                </Button>
                {selectedClaimForView.status === 'pending' && (
                  <>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        handleApprove(selectedClaimForView.id);
                        setViewModalOpen(false);
                      }}
                      disabled={approveMutation.isPending}
                    >
                      Lulus
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        handleReject(selectedClaimForView.id);
                        setViewModalOpen(false);
                      }}
                      disabled={rejectMutation.isPending}
                    >
                      Tolak
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}