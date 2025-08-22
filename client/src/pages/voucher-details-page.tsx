import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Printer, Trash2, Check, X, Send } from "lucide-react";
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
import type { PaymentVoucher, ClaimApplication } from "@shared/schema";

// Payment Voucher Approval Card Component
function PaymentVoucherApprovalCard({ voucher, currentUser }: { voucher: any; currentUser: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment approval settings
  const { data: paymentApprovalSettings } = useQuery({
    queryKey: ["/api/approval-settings/payment"],
  });

  // Fetch current user's employee data
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
    retry: false, // Don't retry on 404 - user might not have employee record
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch approval employee details
  const { data: firstLevelApprover } = useQuery({
    queryKey: ["/api/employees", (paymentApprovalSettings as any)?.firstLevelApprovalId],
    enabled: !!(paymentApprovalSettings as any)?.firstLevelApprovalId,
  });

  const { data: secondLevelApprover } = useQuery({
    queryKey: ["/api/employees", (paymentApprovalSettings as any)?.secondLevelApprovalId],
    enabled: !!(paymentApprovalSettings as any)?.secondLevelApprovalId,
  });

  // Approve voucher mutation
  const approveVoucherMutation = useMutation({
    mutationFn: async ({ voucherId, approverId }: { voucherId: string; approverId: string }) => {
      const response = await apiRequest('PUT', `/api/payment-vouchers/${voucherId}`, { 
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date().toISOString()
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Voucher Approved",
        description: "Payment voucher telah successfully diluluskan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-vouchers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal meluluskan voucher",
        variant: "destructive",
      });
    },
  });

  // Reject voucher mutation
  const rejectVoucherMutation = useMutation({
    mutationFn: async ({ voucherId, rejectorId, reason }: { voucherId: string; rejectorId: string; reason: string }) => {
      const response = await apiRequest('PUT', `/api/payment-vouchers/${voucherId}`, { 
        status: 'Rejected',
        rejectedBy: rejectorId,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Voucher Rejected",
        description: "Payment voucher telah ditolak",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-vouchers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menolak voucher",
        variant: "destructive",
      });
    },
  });

  // Check if user has approval privileges
  const hasApprovalPrivilege = () => {
    if (!currentUser?.id || !paymentApprovalSettings) return false;
    
    if (!(paymentApprovalSettings as any).enableApproval) return false;
    
    const userEmployeeId = (currentUserEmployee as any)?.id;
    const isFirstLevelApprover = (paymentApprovalSettings as any).firstLevelApprovalId === currentUser.id || 
                                 (paymentApprovalSettings as any).firstLevelApprovalId === userEmployeeId;
    const isSecondLevelApprover = (paymentApprovalSettings as any).secondLevelApprovalId === currentUser.id ||
                                  (paymentApprovalSettings as any).secondLevelApprovalId === userEmployeeId;
    
    return isFirstLevelApprover || isSecondLevelApprover;
  };

  const handleApprove = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Sila login semula.",
        variant: "destructive",
      });
      return;
    }
    
    approveVoucherMutation.mutate({ 
      voucherId: voucher.id, 
      approverId: currentUser.id 
    });
  };

  const handleReject = () => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Sila login semula.",
        variant: "destructive",
      });
      return;
    }
    
    const reason = prompt("Sila masukkan sebab penolakan:");
    if (reason) {
      rejectVoucherMutation.mutate({ 
        voucherId: voucher.id, 
        rejectorId: currentUser.id, 
        reason 
      });
    }
  };

  // Only show approval card if user has approval privilege and voucher is generated
  if (!hasApprovalPrivilege() || !['Generated', 'Pending'].includes(voucher.status)) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm mt-6">
      <div className="p-4 border-b bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white rounded-t-lg">
        <h3 className="text-lg font-semibold">Payment Voucher Approval</h3>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Approver profiles */}
          <div className="flex items-center space-x-6">
            {firstLevelApprover && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {(firstLevelApprover as any)?.profileImageUrl ? (
                    <img 
                      src={(firstLevelApprover as any)?.profileImageUrl} 
                      alt={(firstLevelApprover as any)?.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 flex items-center justify-center text-white font-semibold">
                      {(firstLevelApprover as any)?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{(firstLevelApprover as any)?.fullName}</p>
                  <p className="text-sm text-gray-600">{(firstLevelApprover as any)?.role}</p>
                  <p className="text-xs text-gray-500">First Level Approver</p>
                </div>
              </div>
            )}

            {secondLevelApprover && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {(secondLevelApprover as any)?.profileImageUrl ? (
                    <img 
                      src={(secondLevelApprover as any)?.profileImageUrl} 
                      alt={(secondLevelApprover as any)?.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 flex items-center justify-center text-white font-semibold">
                      {(secondLevelApprover as any)?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{(secondLevelApprover as any)?.fullName}</p>
                  <p className="text-sm text-gray-600">{(secondLevelApprover as any)?.role}</p>
                  <p className="text-xs text-gray-500">Second Level Approver</p>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Action buttons (only visible to approvers) */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleApprove}
              disabled={approveVoucherMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
              data-testid="button-approve-voucher"
            >
              <Check className="w-4 h-4 mr-2" />
              {approveVoucherMutation.isPending ? "Approving..." : "Approve"}
            </Button>
            
            <Button
              onClick={handleReject}
              disabled={rejectVoucherMutation.isPending}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 px-6"
              data-testid="button-reject-voucher"
            >
              <X className="w-4 h-4 mr-2" />
              {rejectVoucherMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoucherDetailsPage() {
  const { voucherId } = useParams();
  const [, setLocation] = useLocation();
  
  // Check if this is being accessed for PDF generation
  const urlParams = new URLSearchParams(window.location.search);
  const isPdfMode = urlParams.get('pdf') === 'true';
  const initialTab = urlParams.get('tab') || 'details';
  
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch voucher details
  const { data: voucher, isLoading: voucherLoading } = useQuery<PaymentVoucher>({
    queryKey: ['/api/payment-vouchers', voucherId],
    enabled: !!voucherId,
  });

  // Fetch claims for this voucher
  const { data: voucherClaims = [], isLoading: claimsLoading } = useQuery<ClaimApplication[]>({
    queryKey: ['/api/payment-vouchers', voucherId, 'claims'],
    enabled: !!voucherId,
  });

  // Fetch employees data for name mapping
  const { data: employeesData = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch company settings for voucher header
  const { data: companySettings } = useQuery({
    queryKey: ['/api/company-settings'],
  });

  // Fetch current user data for approval section
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete voucher mutation
  const deleteVoucherMutation = useMutation({
    mutationFn: async (voucherId: string) => {
      const response = await apiRequest('DELETE', `/api/payment-vouchers/${voucherId}`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment voucher telah successfully dipadam",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-vouchers"] });
      setLocation('/payment/voucher');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memadam voucher",
        variant: "destructive",
      });
    },
  });

  // Submit voucher mutation
  const submitVoucherMutation = useMutation({
    mutationFn: async (voucherId: string) => {
      const response = await apiRequest('PUT', `/api/payment-vouchers/${voucherId}`, { 
        status: 'Submitted',
        submittedAt: new Date().toISOString()
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment voucher telah successfully dihantar. Status claim berkaitan telah dikemas kini kepada 'Paid'",
      });
      // Invalidate payment vouchers cache
      queryClient.invalidateQueries({ queryKey: ["/api/payment-vouchers"] });
      // Invalidate claim applications cache to reflect status changes
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications"] });
      // Invalidate my-record specific claim cache
      queryClient.invalidateQueries({ queryKey: ["/api/claim-applications/my-record"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghantar voucher",
        variant: "destructive",
      });
    },
  });

  // Get employee name by ID  
  const getEmployeeName = (employeeId: string) => {
    const employee = (employeesData as any[])?.find(emp => emp.id === employeeId);
    return employee ? employee.fullName : 'Unknown Employee';
  };

  const getEmployeeNRIC = (employeeId: string): string => {
    const employee = (employeesData as any[])?.find(emp => emp.id === employeeId);
    return employee?.nric || 'Not Stated';
  };

  const getEmployeeBankInfo = (employeeId: string): string => {
    const employee = (employeesData as any[])?.find(emp => emp.id === employeeId);
    return employee?.bankAccountNumber || 'Not Stated';
  };

  const convertToWords = (amount: number): string => {
    if (amount === 0) return 'ZERO';
    
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
                  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 
                  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    const convert = (num: number): string => {
      if (num === 0) return '';
      else if (num < 20) return ones[num];
      else if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      else if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
      else if (num < 1000000) return convert(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
      else return convert(Math.floor(num / 1000000)) + ' MILLION' + (num % 1000000 !== 0 ? ' ' + convert(num % 1000000) : '');
    };
    
    const wholePart = Math.floor(amount);
    const decimalPart = Math.round((amount - wholePart) * 100);
    
    let result = convert(wholePart);
    if (decimalPart > 0) {
      result += ' AND ' + convert(decimalPart) + ' CENTS';
    }
    
    return result + ' ONLY';
  };

  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" },
    { value: "3", label: "March" }, { value: "4", label: "April" },
    { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" },
    { value: "9", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  const handleBack = () => {
    setLocation('/payment/voucher');
  };

  const handlePrint = () => {
    try {
      // Switch to voucher tab if not already there
      if (activeTab !== 'voucher') {
        setActiveTab('voucher');
        // Wait for tab to switch before printing
        setTimeout(() => {
          window.print();
        }, 100);
      } else {
        window.print();
      }
    } catch (error) {
      console.error('Error printing voucher:', error);
    }
  };

  // VOUCHER DOWNLOAD: Using improved method like payslip system
  const handleDownload = async () => {
    try {
      console.log('VOUCHER DOWNLOAD: Using improved fetch + blob approach');
      
      const response = await fetch(`/api/payment-vouchers/${voucherId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`,
        },
      });

      console.log('VOUCHER Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Convert to blob without checking content-type first
      const blob = await response.blob();
      console.log('VOUCHER Blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Empty file received');
      }
      
      // Force download using object URL
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Payment_Voucher_${voucher?.voucherNumber || voucherId}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('VOUCHER: PDF downloaded successfully');
      toast({
        title: "Berjaya",
        description: "Payment voucher PDF successfully dimuat turun!",
      });
      
    } catch (error) {
      console.error('VOUCHER Download Error:', error);
      toast({
        title: "Error",
        description: "Gagal memuat turun voucher. Cuba lagi.",
        variant: "destructive",
      });
      
      // Fallback to browser print as backup
      if (activeTab !== 'voucher') {
        setActiveTab('voucher');
        setTimeout(() => window.print(), 100);
      } else {
        window.print();
      }
    }
  };

  if (voucherLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading voucher information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!voucher) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Voucher not found</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payment Voucher
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const monthName = months.find(m => m.value === voucher.month.toString())?.label || voucher.month;

  // If in PDF mode, render only the voucher preview content
  if (isPdfMode && activeTab === 'voucher') {
    return (
      <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
        <style>
          {`
            @media print {
              body { margin: 0; padding: 0; }
              * { print-color-adjust: exact; }
            }
            @page { 
              margin: 10mm; 
              size: A4 portrait; 
            }
          `}
        </style>
        
        {/* Company Header */}
        <div className="text-center mb-8">
          <div className="text-lg font-bold text-gray-900 mb-2">
            {companySettings?.companyName || 'UTAMA MEDGROUP'}
          </div>
          {companySettings?.address && (
            <div className="text-sm text-gray-600 mb-1">{companySettings.address}</div>
          )}
          {companySettings?.email && (
            <div className="text-sm text-gray-600">Email: {companySettings.email}</div>
          )}
        </div>

        {/* Voucher Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900">PAYMENT VOUCHER</h2>
        </div>

        {/* Voucher Header Info */}
        <div className="flex justify-between mb-8">
          <div className="space-y-2">
            <div className="flex">
              <span className="w-32 text-sm">Voucher No:</span>
              <span className="font-medium text-sm">{voucher.voucherNumber}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-sm">Date:</span>
              <span className="font-medium text-sm">{new Date(voucher.paymentDate).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* PAY TO Section */}
        <div className="mb-6">
          <div className="flex">
            <span className="text-sm font-medium w-16">PAY TO:</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-medium border-b border-gray-400 pb-1">
              {voucherClaims.length > 0 ? getEmployeeName(voucherClaims[0].employeeId) : 'Employee Name'}
            </div>
          </div>
        </div>

        {/* Employee Details Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Side */}
          <div>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="w-32">Name:</span>
                <span>{voucherClaims.length > 0 ? getEmployeeName(voucherClaims[0].employeeId) : 'Employee Name'}</span>
              </div>
              <div className="flex">
                <span className="w-32">NRIC:</span>
                <span>{voucherClaims.length > 0 ? getEmployeeNRIC(voucherClaims[0].employeeId) : 'Not Stated'}</span>
              </div>
              <div className="flex">
                <span className="w-32">Bank / Cheque No:</span>
                <span>{voucherClaims.length > 0 ? getEmployeeBankInfo(voucherClaims[0].employeeId) : 'Not Stated'}</span>
              </div>
            </div>
          </div>

          {/* Right Side - Voucher Details */}
          <div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Payment Voucher No:</span>
                <span className="font-medium">{voucher.voucherNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <span className="font-medium">{new Date(voucher.paymentDate).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span>Month:</span>
                <span className="font-medium">{monthName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Table */}
        <div className="mb-8">
          <table className="w-full border border-gray-400">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="border-r border-gray-400 px-2 py-2 text-left text-sm font-medium">No.</th>
                <th className="border-r border-gray-400 px-2 py-2 text-left text-sm font-medium">Description</th>
                <th className="border-r border-gray-400 px-2 py-2 text-left text-sm font-medium">Claim Type</th>
                <th className="px-2 py-2 text-right text-sm font-medium">Amount (RM)</th>
              </tr>
            </thead>
            <tbody>
              {voucherClaims.map((claim, index) => (
                <tr key={claim.id} className="border-b border-gray-400">
                  <td className="border-r border-gray-400 px-2 py-2 text-sm">{index + 1}</td>
                  <td className="border-r border-gray-400 px-2 py-2 text-sm">{claim.claimCategory.toUpperCase()}</td>
                  <td className="border-r border-gray-400 px-2 py-2 text-sm">financial</td>
                  <td className="px-2 py-2 text-sm text-right">{(parseFloat(claim.amount || '0') || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Total Line */}
          <div className="border border-gray-400 border-t-0 p-2 bg-gray-50 font-bold text-sm">
            <div className="flex justify-between">
              <span>MALAYSIA RINGGIT : TOTAL</span>
              <span>{voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Amount in Words */}
          <div className="mt-4 border border-gray-400 p-2 text-sm font-bold">
            MALAYSIA RINGGIT : {convertToWords(voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-16">
          <div className="text-center">
            <div className="border-t border-gray-400 w-48 mb-2"></div>
            <div className="text-xs">Prepared By</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-48 mb-2"></div>
            <div className="text-xs">Checked By</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-48 mb-2"></div>
            <div className="text-xs">Approved By</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBack}
              variant="outline"
              size="sm"
              data-testid="button-back-to-voucher-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payment Voucher
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voucher Details</h1>
              <p className="text-gray-600">{voucher.voucherNumber} - {monthName} {voucher.year}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handlePrint}
              variant="outline"
              size="sm"
              data-testid="button-print-voucher"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              onClick={handleDownload}
              variant="outline" 
              size="sm"
              data-testid="button-download-voucher"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" data-testid="tab-voucher-details">
              Voucher Details
            </TabsTrigger>
            <TabsTrigger value="voucher" data-testid="tab-voucher-preview">
              Voucher Preview
            </TabsTrigger>
          </TabsList>

          {/* Voucher Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                <CardTitle className="text-lg">
                  Voucher {monthName} - {voucher.voucherNumber}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
                        <th className="text-left p-3 font-medium text-gray-900 min-w-48">Type of Claim</th>
                        <th className="text-left p-3 font-medium text-gray-900 min-w-32">Date Claim</th>
                        <th className="text-right p-3 font-medium text-gray-900 min-w-24">Amount (RM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimsLoading ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            Loading claim information...
                          </td>
                        </tr>
                      ) : voucherClaims.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No claim information found.
                          </td>
                        </tr>
                      ) : (
                        voucherClaims.map((claim, index) => (
                          <tr key={claim.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-900">{index + 1}</td>
                            <td className="p-3 text-gray-900">
                              <div className="font-medium">{claim.claimCategory}</div>
                              <div className="text-xs text-gray-500">
                                {getEmployeeName(claim.employeeId)}
                              </div>
                            </td>
                            <td className="p-3 text-gray-900">
                              {new Date(claim.claimDate).toLocaleDateString('ms-MY')}
                            </td>
                            <td className="p-3 text-right text-gray-900 font-medium">
                              RM {(parseFloat(claim.amount || '0') || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                      {voucherClaims.length > 0 && (
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan={3} className="p-3 text-right text-gray-900">
                            Total Amount:
                          </td>
                          <td className="p-3 text-right text-gray-900">
                            RM {voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons Bottom Right */}
                <div className="flex justify-end space-x-4 mt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 px-6"
                        data-testid="button-delete-voucher"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Voucher
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Payment Voucher</AlertDialogTitle>
                        <AlertDialogDescription>
                          Adakah anda pasti mahu memadamkan payment voucher ini? Tindakan ini tidak boleh dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteVoucherMutation.mutate(voucher.id)}
                          disabled={deleteVoucherMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteVoucherMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    onClick={() => submitVoucherMutation.mutate(voucher.id)}
                    disabled={submitVoucherMutation.isPending || voucher.status === 'Submitted' || voucher.status === 'Approved'}
                    className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700 text-white px-6"
                    data-testid="button-submit-voucher"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitVoucherMutation.isPending ? "Submitting..." : "Submit Voucher"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voucher Preview Tab */}
          <TabsContent value="voucher" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
                <CardTitle className="text-lg">Voucher Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white min-h-96 border rounded-lg p-8" data-testid="voucher-preview-content" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Company Header */}
                  <div className="text-center mb-8">
                    <div className="text-lg font-bold text-gray-900 mb-2">
                      {companySettings?.companyName?.toUpperCase() || 'COMPANY NAME'}
                    </div>
                    {companySettings?.address && (
                      <div className="text-sm text-gray-700 mb-1">{companySettings.address}</div>
                    )}
                    {companySettings?.city && companySettings?.state && companySettings?.postalCode && (
                      <div className="text-sm text-gray-700 mb-1">
                        {companySettings.postalCode} {companySettings.city}, {companySettings.state}
                      </div>
                    )}
                    {(companySettings?.phone || companySettings?.fax) && (
                      <div className="text-sm text-gray-700 mb-1">
                        {companySettings.phone && `Tel: ${companySettings.phone}`}
                        {companySettings.phone && companySettings.fax && ' | '}
                        {companySettings.fax && `Fax: ${companySettings.fax}`}
                      </div>
                    )}
                    {companySettings?.email && (
                      <div className="text-sm text-gray-700 mb-6">Email: {companySettings.email}</div>
                    )}
                    
                    <div className="text-2xl font-bold text-gray-900 mb-4">PAYMENT VOUCHER</div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Left Side - PAID TO */}
                    <div>
                      <div className="mb-4">
                        <div className="font-bold text-gray-900 mb-3">PAID TO:</div>
                        {voucherClaims.length > 0 && (
                          <div className="space-y-1 text-sm">
                            <div>Name: {getEmployeeName(voucherClaims[0].employeeId)}</div>
                            <div>NRIC: {getEmployeeNRIC(voucherClaims[0].employeeId)}</div>
                            <div>Bank / Cheque No.: {getEmployeeBankInfo(voucherClaims[0].employeeId)}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-8">
                        <div className="font-bold text-gray-900 mb-3 border-b border-gray-400 pb-1">PAYMENT FOR:</div>
                        <div className="space-y-1 text-sm">
                          <div className="font-bold">AMOUNT (RM)</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Voucher Details */}
                    <div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Payment Voucher No:</span>
                          <span className="font-medium">{voucher.voucherNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Date:</span>
                          <span className="font-medium">{new Date(voucher.paymentDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Month:</span>
                          <span className="font-medium">{monthName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mb-8">
                    {voucherClaims.map((claim, index) => (
                      <div key={claim.id} className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-sm">{claim.claimCategory.toUpperCase()}</span>
                        <span className="font-medium">{(parseFloat(claim.amount || '0') || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    
                    {/* Total Line */}
                    <div className="flex justify-between py-3 border-b-2 border-gray-400 font-bold">
                      <span>MALAYSIA RINGGIT : TOTAL</span>
                      <span>{voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0).toFixed(2)}</span>
                    </div>
                    
                    {/* Amount in Words */}
                    <div className="mt-4 text-sm">
                      <div className="font-bold">MALAYSIA RINGGIT : {convertToWords(voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0))}</div>
                    </div>
                  </div>

                  

                  {/* Footer */}
                  <div className="flex justify-between items-end mt-16">
                    <div className="text-center">
                      <div className="border-t border-gray-400 w-48 mb-2"></div>
                      <div className="text-xs">Prepared By</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-400 w-48 mb-2"></div>
                      <div className="text-xs">Checked By</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-400 w-48 mb-2"></div>
                      <div className="text-xs">Approved By</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Voucher Approval Card */}
        <PaymentVoucherApprovalCard voucher={voucher} currentUser={currentUser} />
      </div>
    </DashboardLayout>
  );
}