import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Eye, FileSpreadsheet, Trash2, Check, X } from "lucide-react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Removed jsPDF - now using server-side Puppeteer for PDF generation

// Salary Payroll Approval Card Component
function SalaryPayrollApprovalCard({ payrollDocument, currentUser }: { payrollDocument: any; currentUser: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment approval settings
  const { data: paymentApprovalSettings } = useQuery({
    queryKey: ["/api/approval-settings/payment"],
  });

  // Fetch current user's employee data
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
  });

  // Fetch approval employee details
  const { data: firstLevelApprover } = useQuery({
    queryKey: ["/api/employees", paymentApprovalSettings?.firstLevelApprovalId],
    enabled: !!paymentApprovalSettings?.firstLevelApprovalId,
  });

  const { data: secondLevelApprover } = useQuery({
    queryKey: ["/api/employees", paymentApprovalSettings?.secondLevelApprovalId],
    enabled: !!paymentApprovalSettings?.secondLevelApprovalId,
  });

  // Approve payroll mutation
  const approvePayrollMutation = useMutation({
    mutationFn: async ({ documentId, approverId }: { documentId: string; approverId: string }) => {
      const response = await apiRequest('POST', `/api/payroll/documents/${documentId}/approve`, { approverId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dokumen Diluluskan",
        description: "Dokumen payroll telah berjaya diluluskan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal meluluskan dokumen",
        variant: "destructive",
      });
    },
  });

  // Reject payroll mutation
  const rejectPayrollMutation = useMutation({
    mutationFn: async ({ documentId, rejectorId, reason }: { documentId: string; rejectorId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/payroll/documents/${documentId}/reject`, { rejectorId, reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dokumen Ditolak",
        description: "Dokumen payroll telah ditolak",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menolak dokumen",
        variant: "destructive",
      });
    },
  });

  // Check if user has approval privileges
  const hasApprovalPrivilege = () => {
    if (!currentUser?.id || !paymentApprovalSettings) return false;
    
    if (!paymentApprovalSettings.enableApproval) return false;
    
    const userEmployeeId = currentUserEmployee?.id;
    const isFirstLevelApprover = paymentApprovalSettings.firstLevelApprovalId === currentUser.id || 
                                 paymentApprovalSettings.firstLevelApprovalId === userEmployeeId;
    const isSecondLevelApprover = paymentApprovalSettings.secondLevelApprovalId === currentUser.id ||
                                  paymentApprovalSettings.secondLevelApprovalId === userEmployeeId;
    
    return isFirstLevelApprover || isSecondLevelApprover;
  };

  const handleApprove = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "User ID tidak dijumpai. Sila login semula.",
        variant: "destructive",
      });
      return;
    }
    
    approvePayrollMutation.mutate({ 
      documentId: payrollDocument.id, 
      approverId: currentUser.id 
    });
  };

  const handleReject = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "User ID tidak dijumpai. Sila login semula.",
        variant: "destructive",
      });
      return;
    }
    
    const reason = prompt("Sila masukkan sebab penolakan:");
    if (reason) {
      rejectPayrollMutation.mutate({ 
        documentId: payrollDocument.id, 
        rejectorId: currentUser.id, 
        reason 
      });
    }
  };

  // Only show approval card if user has approval privilege and document is pending
  if (!hasApprovalPrivilege() || !['pending', 'PendingApproval'].includes(payrollDocument.status)) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm mt-6">
      <div className="p-4 border-b bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-t-lg">
        <h3 className="text-lg font-semibold">Salary Payroll Approval</h3>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Approver profiles */}
          <div className="flex items-center space-x-6">
            {firstLevelApprover && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {firstLevelApprover.profileImageUrl ? (
                    <img 
                      src={firstLevelApprover.profileImageUrl} 
                      alt={firstLevelApprover.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-cyan-500 flex items-center justify-center text-white font-semibold">
                      {firstLevelApprover.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{firstLevelApprover.fullName}</p>
                  <p className="text-sm text-gray-600">{firstLevelApprover.role}</p>
                  <p className="text-xs text-gray-500">First Level Approver</p>
                </div>
              </div>
            )}

            {secondLevelApprover && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {secondLevelApprover.profileImageUrl ? (
                    <img 
                      src={secondLevelApprover.profileImageUrl} 
                      alt={secondLevelApprover.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-cyan-500 flex items-center justify-center text-white font-semibold">
                      {secondLevelApprover.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{secondLevelApprover.fullName}</p>
                  <p className="text-sm text-gray-600">{secondLevelApprover.role}</p>
                  <p className="text-xs text-gray-500">Second Level Approver</p>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleApprove}
              disabled={approvePayrollMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              data-testid="button-approve-payroll"
            >
              <Check className="w-4 h-4 mr-2" />
              {approvePayrollMutation.isPending ? "Approving..." : "Approve"}
            </Button>
            
            <Button
              onClick={handleReject}
              disabled={rejectPayrollMutation.isPending}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 px-6"
              data-testid="button-reject-payroll"
            >
              <X className="w-4 h-4 mr-2" />
              {rejectPayrollMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("payroll-details");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch payroll document details
  const { data: payrollDocument, isLoading: isLoadingDocument } = useQuery({
    queryKey: ["/api/payroll/documents", id],
    enabled: !!id,
  });

  // Fetch payroll items (individual payslips)
  const { data: payrollItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/payroll/documents", id, "items"],
    enabled: !!id,
  });

  // Fetch current user data for approval section
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });



  const handleDeletePayroll = async () => {
    if (!currentUser?.id) {
      alert('Sila log masuk semula');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/payroll/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete payroll document');
      }

      alert('Data payslip untuk bulan ini telah berjaya dipadam!');
      // Navigate back to payroll list
      window.location.href = "/payment/salary-payroll";
    } catch (error) {
      console.error('Error deleting payroll:', error);
      alert('Gagal memadam data payslip. Sila cuba lagi.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };



  const handleBackToList = () => {
    window.location.href = "/payment/salary-payroll";
  };

  const handleViewPayslip = async (employeeId: string, employeeName: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeName(employeeName);
    setActiveTab("payslip");
    
    // Generate PDF preview
    await generatePdfPreview(employeeId, employeeName);
  };

  const generatePdfPreview = async (employeeId: string, employeeName: string) => {
    setIsGeneratingPreview(true);
    try {
      // Use HTML preview instead of PDF for better browser compatibility
      const previewUrl = `/api/payroll/payslip/${employeeId}/preview?documentId=${id}&token=${localStorage.getItem('utamahr_token')}`;
      setPdfPreviewUrl(previewUrl);
      console.log('HTML preview URL set:', previewUrl);
    } catch (error) {
      console.error('Error generating HTML preview:', error);
      alert('Gagal menghasilkan preview slip gaji. Sila cuba lagi.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };



  const handleGeneratePDF = async (employeeId: string, employeeName: string) => {
    try {
      const response = await fetch(`/api/payroll/payslip/${employeeId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        },
        body: JSON.stringify({ documentId: id })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF payslip');
      }

      // Server now returns the PDF buffer directly
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Payslip_${employeeName.replace(/\s+/g, '_')}_7_2025.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('PDF payslip generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal menghasilkan slip gaji PDF. Sila cuba lagi.');
    }
  };

  const handleGenerateExcel = async (itemId: string, employeeName: string) => {
    try {
      const response = await fetch(`/api/payroll/payslip/${itemId}/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        },
        body: JSON.stringify({ documentId: id })
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel payslip');
      }

      // Server returns the Excel buffer directly
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get current date for filename
      const currentDate = new Date();
      const month = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();
      const year = currentDate.getFullYear();
      
      link.download = `Payslip_${employeeName.replace(/\s+/g, '_')}_${month}_${year}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Excel payslip generated and downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel payslip:', error);
      alert('Failed to generate Excel payslip. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { className: "bg-yellow-100 text-yellow-800", text: "Pending" },
      approved: { className: "bg-green-100 text-green-800", text: "Approved" },
      rejected: { className: "bg-red-100 text-red-800", text: "Rejected" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.text}
      </Badge>
    );
  };

  if (isLoadingDocument) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading payroll document...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToList}
              className="flex items-center space-x-2"
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Salary Payroll</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payroll Details - {(payrollDocument as any)?.month} {(payrollDocument as any)?.year}
              </h1>
              <p className="text-sm text-gray-600">
                Payment Date: {(payrollDocument as any)?.paymentDate ? new Date((payrollDocument as any).paymentDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 py-6">
          {/* Step 1: Update & Review */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              ✓
            </div>
            <span className="text-sm text-green-600 font-medium">Update & Review</span>
            {(payrollDocument as any)?.status !== 'approved' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
            )}
          </div>
          
          {/* Step 2: Approval - Show based on document status */}
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              (payrollDocument as any)?.status === 'approved' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {(payrollDocument as any)?.status === 'approved' ? '✓' : '2'}
            </div>
            <span className={`text-sm font-medium ${
              (payrollDocument as any)?.status === 'approved' 
                ? 'text-green-600' 
                : 'text-gray-600'
            }`}>
              Approval
            </span>
            {(payrollDocument as any)?.status === 'approved' && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
            )}
          </div>
          
          {/* Step 3: Payment & Close */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm text-gray-600">Payment & Close</span>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex space-x-4 border-b">
            <TabsList className="grid w-auto grid-cols-2 bg-transparent">
              <TabsTrigger 
                value="payroll-details" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 px-6 border-b-2 border-transparent data-[state=active]:border-cyan-600"
              >
                Payroll Details
              </TabsTrigger>
              <TabsTrigger 
                value="payslip" 
                className="data-[state=active]:bg-gray-200 data-[state=active]:text-gray-900 px-6 border-b-2 border-transparent data-[state=active]:border-cyan-600"
              >
                Payslip
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Payroll Details Tab */}
          <TabsContent value="payroll-details" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payroll Month: {(payrollDocument as any)?.month} {(payrollDocument as any)?.year}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Search:</span>
                  <input 
                    type="text" 
                    placeholder="Search employees..."
                    className="px-3 py-1 border rounded-md text-sm"
                    data-testid="input-search-employees"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                Payroll Date: {(payrollDocument as any)?.paymentDate ? new Date((payrollDocument as any).paymentDate).toLocaleDateString() : 'N/A'}
              </div>

              {/* Employee Payroll Table */}
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-sm min-w-[1400px]">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-medium text-gray-900 min-w-[120px]">Name</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[80px]">Salary</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[80px]">Additional</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[80px]">Gross</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[80px]">Deduction</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[100px]">Contribution</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-cyan-100 min-w-[60px]">EPF</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-cyan-100 min-w-[60px]">SOCSO</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-cyan-100 min-w-[60px]">EIS</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-cyan-100 min-w-[60px]">PCB</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-yellow-100 min-w-[60px]">EPF</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-yellow-100 min-w-[60px]">SOCSO</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-yellow-100 min-w-[60px]">EIS</th>
                      <th className="text-center p-3 font-medium text-gray-900 bg-yellow-100 min-w-[60px]">HRDF</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[90px]">Net Salary</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[80px]">Status</th>
                      <th className="text-center p-3 font-medium text-gray-900 min-w-[80px]">Action</th>
                    </tr>
                    <tr className="bg-gray-50 border-b text-xs">
                      <th className="p-1"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600 bg-cyan-50"></th>
                      <th className="text-center p-1 text-gray-600 bg-cyan-50 whitespace-nowrap" colSpan={2}>Employee Contribution</th>
                      <th className="text-center p-1 text-gray-600 bg-cyan-50"></th>
                      <th className="text-center p-1 text-gray-600 bg-yellow-50"></th>
                      <th className="text-center p-1 text-gray-600 bg-yellow-50 whitespace-nowrap" colSpan={2}>Employer Contribution</th>
                      <th className="text-center p-1 text-gray-600 bg-yellow-50"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                      <th className="text-center p-1 text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingItems ? (
                      <tr>
                        <td colSpan={17} className="p-8 text-center text-gray-500">
                          Loading payroll items...
                        </td>
                      </tr>
                    ) : (payrollItems as any[]).length > 0 ? (
                      (payrollItems as any[]).map((item: any) => {
                        // Parse employee snapshot and salary data
                        const employeeSnapshot = JSON.parse(item.employeeSnapshot || '{}');
                        const salaryData = JSON.parse(item.salary || '{}');
                        const deductionsData = JSON.parse(item.deductions || '{}');
                        const contributionsData = JSON.parse(item.contributions || '{}');
                        
                        // Calculate totals
                        const basicSalary = parseFloat(salaryData.basic || '0');
                        const grossSalary = parseFloat(salaryData.gross || '0');
                        
                        // Calculate total additional items from salary.additional array
                        const totalAdditional = (() => {
                          let total = 0;
                          
                          // Add fixed allowance if exists
                          total += parseFloat(salaryData.fixedAllowance || '0');
                          
                          // Add all additional items from array
                          if (salaryData.additional && Array.isArray(salaryData.additional)) {
                            salaryData.additional.forEach((item: any) => {
                              total += parseFloat(item.amount || '0');
                            });
                          }
                          
                          return total;
                        })();
                        
                        // Calculate total deductions from all deduction items
                        const totalDeductions = (() => {
                          let total = 0;
                          
                          // Standard deductions
                          total += parseFloat(deductionsData.epfEmployee || '0');
                          total += parseFloat(deductionsData.socsoEmployee || '0');
                          total += parseFloat(deductionsData.eisEmployee || '0');
                          
                          // Additional deductions
                          total += parseFloat(deductionsData.advance || '0');
                          total += parseFloat(deductionsData.unpaidLeave || '0');
                          total += parseFloat(deductionsData.pcb38 || '0');
                          total += parseFloat(deductionsData.pcb39 || '0');
                          total += parseFloat(deductionsData.zakat || '0');
                          
                          // Other deductions (including MTD/PCB)
                          if (typeof deductionsData.other === 'number') {
                            total += deductionsData.other;
                          } else if (typeof deductionsData.other === 'string' && deductionsData.other !== '') {
                            total += parseFloat(deductionsData.other);
                          } else if (Array.isArray(deductionsData.other)) {
                            deductionsData.other.forEach((item: any) => {
                              total += parseFloat(item.amount || '0');
                            });
                          }
                          
                          return total;
                        })();
                        const totalContributions = parseFloat(contributionsData.epfEmployer || '0') + 
                                                  parseFloat(contributionsData.socsoEmployer || '0') + 
                                                  parseFloat(contributionsData.eisEmployer || '0');
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-900 font-medium">{employeeSnapshot.name || 'N/A'}</td>
                            <td className="p-3 text-center text-gray-600">RM {basicSalary.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600">RM {totalAdditional.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600">RM {grossSalary.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600">RM {totalDeductions.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600">RM {totalContributions.toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-cyan-50">RM {parseFloat(deductionsData.epfEmployee || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-cyan-50">RM {parseFloat(deductionsData.socsoEmployee || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-cyan-50">RM {parseFloat(deductionsData.eisEmployee || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-cyan-50">RM {parseFloat(deductionsData.pcb38 || deductionsData.pcb39 || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-yellow-50">RM {parseFloat(contributionsData.epfEmployer || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-yellow-50">RM {parseFloat(contributionsData.socsoEmployer || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-yellow-50">RM {parseFloat(contributionsData.eisEmployer || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 bg-yellow-50">RM {parseFloat(contributionsData.hrdf || '0').toFixed(2)}</td>
                            <td className="p-3 text-center text-gray-600 font-medium">RM {parseFloat(item.netPay || '0').toFixed(2)}</td>
                            <td className="p-3 text-center">
                              {getStatusBadge(item.status || 'pending')}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-1 h-7 w-7 border-gray-300"
                                  onClick={() => handleViewPayslip(item.employeeId, employeeSnapshot.name || 'N/A')}
                                  data-testid={`button-view-payslip-${item.employeeId}`}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-1 h-7 w-7 border-gray-300"
                                  onClick={() => handleGeneratePDF(item.employeeId, employeeSnapshot.name || 'N/A')}
                                  data-testid={`button-download-pdf-${item.employeeId}`}
                                  title="Download PDF"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-1 h-7 w-7 border-gray-300"
                                  onClick={() => handleGenerateExcel(item.id, employeeSnapshot.name || 'N/A')}
                                  data-testid={`button-download-excel-${item.employeeId}`}
                                  title="Download Excel"
                                >
                                  <FileSpreadsheet className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={17} className="p-8 text-center text-gray-500">
                          No payroll items found. Click "Generate Items" to create payroll for all employees.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6">
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      data-testid="button-delete-payroll"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Padam Data Payslip</AlertDialogTitle>
                      <AlertDialogDescription>
                        Adakah anda pasti mahu memadam keseluruhan data payslip untuk bulan ini? 
                        <br/><br/>
                        <strong>Amaran:</strong> Tindakan ini akan memadam semua data payslip pekerja untuk bulan {payrollDocument?.month}/{payrollDocument?.year} dan tidak boleh dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePayroll}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isDeleting ? "Mempadam..." : "Ya, Padam"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button
                  className={`text-white ${
                    (payrollDocument as any)?.status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                  data-testid="button-submit-payroll"
                >
                  {(payrollDocument as any)?.status === 'approved' ? 'Payment Complete' : 'Submit Payment'}
                </Button>
              </div>


            </div>
          </TabsContent>

          {/* Payslip Tab */}
          <TabsContent value="payslip" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Individual Payslips</h3>
                
                {/* Employee Selection Dropdown */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Select Employee:</span>
                  <Select
                    value={selectedEmployeeId || ""}
                    onValueChange={(value) => {
                      const selectedItem = (payrollItems as any[]).find((item: any) => item.employeeId === value);
                      if (selectedItem) {
                        const employeeSnapshot = JSON.parse(selectedItem.employeeSnapshot || '{}');
                        handleViewPayslip(value, employeeSnapshot.name || 'N/A');
                      }
                    }}
                  >
                    <SelectTrigger className="w-64" data-testid="select-employee-payslip">
                      <SelectValue placeholder="Choose an employee to preview payslip" />
                    </SelectTrigger>
                    <SelectContent>
                      {(payrollItems as any[]).map((item: any) => {
                        const employeeSnapshot = JSON.parse(item.employeeSnapshot || '{}');
                        return (
                          <SelectItem key={item.employeeId} value={item.employeeId}>
                            {employeeSnapshot.name || 'N/A'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {selectedEmployeeId && (
                    <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                      {selectedEmployeeName}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Always show content area regardless of selection */}
              <div className="space-y-4">
                {selectedEmployeeId ? (
                  <>
                    {/* PDF Preview Section */}
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Payslip Preview</h4>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generatePdfPreview(selectedEmployeeId, selectedEmployeeName)}
                            disabled={isGeneratingPreview}
                          >
                            {isGeneratingPreview ? "Generating..." : "Refresh Preview"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleGeneratePDF(selectedEmployeeId, selectedEmployeeName)}
                            className="bg-blue-900 hover:bg-blue-800 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                      </div>

                      {isGeneratingPreview ? (
                        <div className="flex justify-center items-center h-96 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2">Generating PDF preview...</p>
                          </div>
                        </div>
                      ) : pdfPreviewUrl ? (
                        <div className="bg-white rounded-lg border shadow-sm">
                          <div className="p-4 border-b bg-gray-50">
                            <h5 className="font-medium text-gray-800">Payslip Preview</h5>
                          </div>
                          <div className="p-0 bg-white" style={{ height: '800px' }}>
                            <iframe
                              src={pdfPreviewUrl}
                              width="100%"
                              height="100%"
                              style={{ border: 'none' }}
                              title="Payslip Preview"
                              allow="fullscreen"
                              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                          </div>
                        </div>

                      ) : (
                        <div className="flex justify-center items-center h-96 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-gray-600">Click "Refresh Preview" to generate PDF preview</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back to List */}
                    <div className="flex justify-start">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployeeId(null);
                          setSelectedEmployeeName("");
                          setPdfPreviewUrl(null);
                          setActiveTab("payroll-details");
                        }}
                      >
                        Back to Payroll Details
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    <p className="mb-2">Use the dropdown above to select an employee and preview their payslip</p>
                    <p className="text-sm">Or select an employee from the Payroll Details tab</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Salary Payroll Approval Card */}
        {payrollDocument && (
          <SalaryPayrollApprovalCard 
            payrollDocument={payrollDocument}
            currentUser={currentUser}
          />
        )}
      </div>
    </DashboardLayout>
  );
}