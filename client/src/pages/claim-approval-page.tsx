import { useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClaimForView, setSelectedClaimForView] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Helper function to get employee name by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employeesData.find((emp: any) => emp.id === employeeId);
    return employee ? employee.fullName : `Unknown Employee (${employeeId.slice(0, 8)}...)`;
  };

  // Approve claim mutation
  const approveMutation = useMutation({
    mutationFn: async ({ claimId }: { claimId: string }) => {
      const token = localStorage.getItem('utamahr_token');
      
      // Find current user's employee record to get employee ID
      const currentEmployee = employeesData.find((emp: any) => emp.userId === (currentUser as any).id);
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
  });

  // Reject claim mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      const token = localStorage.getItem('utamahr_token');
      
      // Find current user's employee record to get employee ID
      const currentEmployee = employeesData.find((emp: any) => emp.userId === (currentUser as any).id);
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
  });

  // Check if user has financial approval rights
  const hasFinancialApprovalRights = () => {
    if (!currentUser || !approvalSettings || !employeesData) return false;
    
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
    if (!currentUser || !overtimeApprovalSettings || !employeesData) return false;
    
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

  // Check if user can see different types of claims
  const userCanApproveFinancial = hasFinancialApprovalRights();
  const userCanApproveOvertime = hasOvertimeApprovalRights();
  
  // Filter claims based on user approval rights AND status 
  // Approval tab: only pending claims (requires approval rights)
  // Report tab: processed claims (accessible to all users for transparency)
  const filteredFinancialClaims = activeTab === 'approval' 
    ? (userCanApproveFinancial ? (financialClaimsData || []).filter((claim: any) => claim.status === 'pending') : [])
    : (financialClaimsData || []).filter((claim: any) => {
        console.log('Financial claim filtering:', { claimId: claim.id, status: claim.status, activeTab });
        return ['firstLevelApproved', 'secondLevelApproved', 'approved', 'rejected', 'awaitingSecondApproval'].includes(claim.status);
      });
      
  const filteredOvertimeClaims = activeTab === 'approval'
    ? (userCanApproveOvertime ? (overtimeClaimsFromDB || []).filter((claim: any) => claim.status === 'pending') : [])
    : (overtimeClaimsFromDB || []).filter((claim: any) => {
        console.log('Overtime claim filtering:', { claimId: claim.id, status: claim.status, activeTab });
        return ['firstLevelApproved', 'secondLevelApproved', 'approved', 'rejected', 'awaitingSecondApproval'].includes(claim.status);
      });

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

  // Summary data
  const summaryData = [
    {
      id: 1,
      name: "SITI NADIAH SABRI",
      pendingClaim: "RM 0.00",
      approvedClaim: "0/0",
      totalAmountClaim: "RM 0.00"
    },
    {
      id: 2,
      name: "madrah samsi",
      pendingClaim: "RM 0.00",
      approvedClaim: "0/0",
      totalAmountClaim: "RM 0.00"
    }
  ];

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
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Awaiting Second Approval</Badge>;
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Claim */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-cyan-500 to-teal-500 text-white border-0"
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
          className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-cyan-500 to-teal-500 text-white border-0"
          onClick={() => handleCategorySelect("overtime")}
          data-testid="card-overtime-claim"
        >
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Overtime Claim</h3>
          </CardContent>
        </Card>

        {/* Coming Soon */}
        <Card className="opacity-50 cursor-not-allowed bg-gray-100 border-gray-200">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-500">Coming Soon</h3>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTabNavigation = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      <Button
        variant={activeTab === "approval" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "approval" ? "bg-cyan-600 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("approval")}
        data-testid="tab-claim-approval"
      >
        Claim Approval
      </Button>
      <Button
        variant={activeTab === "report" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "report" ? "bg-cyan-600 text-white" : "text-gray-600"}`}
        onClick={() => setActiveTab("report")}
        data-testid="tab-claim-report"
      >
        Claim Report
      </Button>
      <Button
        variant={activeTab === "summary" ? "default" : "ghost"}
        className={`flex-1 ${activeTab === "summary" ? "bg-cyan-600 text-white" : "text-gray-600"}`}
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
        <div className="bg-cyan-600 text-white p-4 rounded-lg">
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
                      <TableCell>{item.claimType}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.financialPolicyName || item.reason}</TableCell>
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
      <div className="bg-cyan-600 text-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold">
          {selectedCategory === "financial" ? "Claim Application Report" : "Claim Application Report"}
        </h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedCategory === "financial" ? "Claim Type" : "Overtime Status"}
          </label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {selectedCategory === "financial" ? "All claim type" : "All overtime status"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-filter">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" data-testid="button-reset-filter">
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
                    <TableCell>{item.claimType}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.financialPolicyName || item.reason}</TableCell>
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
                    <TableCell className="font-medium">{item.amount ? `RM ${item.amount}` : 'N/A'}</TableCell>
                    <TableCell>{new Date(item.claimDate).toLocaleDateString()}</TableCell>
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
        <h3 className="text-lg font-semibold">
          {selectedCategory === "financial" ? "Claim Application Summary" : "Overtime Application Summary"}
        </h3>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {selectedCategory === "financial" ? "Claim Type" : "Claim Type"}
          </label>
          <Select defaultValue="all">
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {selectedCategory === "financial" ? "All claim type" : "All claim type"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-filter-summary">
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
              <TableHead>Pending Claim</TableHead>
              <TableHead>Approved Claim</TableHead>
              <TableHead>Total Amount Claim</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.pendingClaim}</TableCell>
                <TableCell>{item.approvedClaim}</TableCell>
                <TableCell className="font-medium">{item.totalAmountClaim}</TableCell>
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

        {/* View Claim Modal */}
        {viewModalOpen && selectedClaimForView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Maklumat Permohonan</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setViewModalOpen(false)}
                >
                  ✕
                </Button>
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
                        RM {selectedClaimForView.amount || '0.00'}
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