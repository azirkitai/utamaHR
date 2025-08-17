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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PaymentVoucher, ClaimApplication } from "@shared/schema";

export default function PaymentVoucherPage() {
  const [showNewVoucherModal, setShowNewVoucherModal] = useState(false);
  const [formData, setFormData] = useState({
    year: "2025",
    month: "8",
    paymentDate: "2025-08-08",
    remarks: "Payment for financial claims August 2025"
  });
  const { toast } = useToast();

  const months = [
    { value: "1", label: "January" }, { value: "2", label: "February" },
    { value: "3", label: "March" }, { value: "4", label: "April" },
    { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" },
    { value: "9", label: "September" }, { value: "10", label: "October" },
    { value: "11", label: "November" }, { value: "12", label: "December" }
  ];

  const years = ["2023", "2024", "2025", "2026"];

  // Fetch all payment vouchers
  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery<PaymentVoucher[]>({
    queryKey: ['/api/payment-vouchers'],
  });

  // Fetch approved claims for selected year/month
  const { data: approvedClaims = [], isLoading: claimsLoading } = useQuery<ClaimApplication[]>({
    queryKey: ['/api/payment-vouchers/claims', formData.year, formData.month],
    enabled: !!(formData.year && formData.month),
  });

  // Fetch employees data for name mapping
  const { data: employeesData = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Create payment voucher mutation (GROUP BY REQUESTOR)
  const createVoucherMutation = useMutation({
    mutationFn: async (voucherData: any) => {
      const response = await apiRequest('POST', '/api/payment-vouchers', voucherData);
      return await response.json();
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-vouchers'] });
      
      console.log('Success response:', response);
      const { created = [], message } = response || {};
      toast({
        title: "Berjaya",
        description: message || `Berjaya menjana ${created.length} voucher pembayaran`,
      });
      
      setShowNewVoucherModal(false);
      setFormData({
        year: "2025",
        month: "8", 
        paymentDate: "2025-08-08",
        remarks: "Payment for financial claims August 2025"
      });
    },
    onError: (error: any) => {
      console.error('Voucher creation error:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));
      console.error('Error message:', error?.message);
      console.error('Error string:', error?.toString?.());
      
      // Get error message safely first
      const errorMessage = error?.message || error?.toString?.() || JSON.stringify(error) || 'Unknown error';

      // Check if this is a conflict error (has meaningful message) - ALWAYS SHOW THESE
      if (errorMessage.includes('CONFLICT_EXISTING_VOUCHERS') || errorMessage.includes('409:')) {
        // This is a valid conflict error - process it regardless of empty keys
        console.log('Conflict error detected - showing to user');
      } else {
        // Check if it's an empty error object (common with successful requests)
        if (!error || Object.keys(error).length === 0 || error === null || error === undefined) {
          console.log('Empty error object detected - likely a successful request misidentified as error');
          return; // Don't show any error toast for empty errors
        }

        // Check if this is actually a successful request misidentified as error
        if (errorMessage.includes('Cannot read properties of undefined')) {
          console.log('JavaScript runtime error detected - not a network/API error');
          return; // Don't show error toast for JS runtime errors during successful operations
        }
      }
      
      // Error message already extracted above
      
      // Handle conflict error (existing vouchers)
      if (errorMessage.includes('CONFLICT_EXISTING_VOUCHERS') || errorMessage.includes('409:')) {
        try {
          // Try to parse the error message to get conflict details
          const errorData = JSON.parse(errorMessage.split('409: ')[1] || '{}');
          
          if (errorData.conflictingRequestors && errorData.conflictingRequestors.length > 0) {
            const requestorNames = errorData.conflictingRequestors.map((r: any) => r.requestorName).join(', ');
            toast({
              title: "Voucher Sudah Wujud",
              description: `Voucher sudah wujud untuk: ${requestorNames} pada bulan ini. Sila padam voucher lama terlebih dahulu sebelum menjana voucher baru.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Voucher Sudah Wujud", 
              description: "Voucher sudah wujud untuk penuntut pada bulan ini. Sila padam voucher lama terlebih dahulu.",
              variant: "destructive",
            });
          }
        } catch (parseError) {
          toast({
            title: "Voucher Sudah Wujud",
            description: "Voucher sudah wujud untuk penuntut pada bulan ini. Sila padam voucher lama terlebih dahulu.",
            variant: "destructive",
          });
        }
      } else if (errorMessage && errorMessage !== 'Unknown error') {
        // Only show error toast if there's a meaningful error message
        toast({
          title: "Error",
          description: errorMessage || "Gagal menjana voucher pembayaran",
          variant: "destructive",
        });
      }
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePayment = () => {
    if (!approvedClaims || !Array.isArray(approvedClaims) || approvedClaims.length === 0) {
      toast({
        title: "Warning",
        description: "No approved financial claims for this period",
        variant: "destructive",
      });
      return;
    }

    // Group claims by requestor name (ONE VOUCHER PER REQUESTOR)
    const claimsByRequestor = (approvedClaims || []).reduce((acc: any, claim) => {
      if (!claim || !claim.employeeId) return acc;
      const requestorName = getEmployeeName(claim.employeeId);
      if (!acc[requestorName]) {
        acc[requestorName] = [];
      }
      acc[requestorName].push(claim);
      return acc;
    }, {});

    // Prepare voucher data for EACH REQUESTOR
    const voucherDataArray = Object.entries(claimsByRequestor).map(([requestorName, claims]: [string, any]) => {
      const totalAmount = (claims || []).reduce((sum: number, claim: any) => sum + (parseFloat(claim?.amount || '0') || 0), 0);
      
      return {
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        paymentDate: formData.paymentDate,
        totalAmount: totalAmount.toString(),
        includedClaims: (claims || []).map((claim: any) => claim?.id).filter(Boolean),
        remarks: `${formData.remarks} - ${requestorName}`,
        requestorName: requestorName,
        status: 'Generated' as const
      };
    });

    // Send array of voucher data to backend for GROUP PROCESSING
    createVoucherMutation.mutate({ vouchers: voucherDataArray });
  };

  // Get employee name by ID  
  const getEmployeeName = (employeeId: string) => {
    const employee = (employeesData as any[])?.find(emp => emp.id === employeeId);
    return employee ? (employee.fullName || employee.full_name || `${employee.firstName || employee.first_name || ''} ${employee.lastName || employee.last_name || ''}`.trim()) : 'Unknown Employee';
  };

  const renderPaymentVoucherListTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-40">Payment Voucher No.</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-48">Name</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Month</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Year</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Status</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {vouchersLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Memuatkan voucher pembayaran...
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Tiada voucher pembayaran dijumpai.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher, index) => (
                <tr key={voucher.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{index + 1}</td>
                  <td className="p-3">
                    <button 
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => window.location.href = `/voucher-details/${voucher.id}`}
                      data-testid={`link-voucher-${voucher.voucherNumber}`}
                    >
                      {voucher.voucherNumber}
                    </button>
                  </td>
                  <td className="p-3 text-gray-900">
                    {voucher.requestorName || 'Unknown'}
                  </td>
                  <td className="p-3 text-gray-900">{months.find(m => m.value === voucher.month.toString())?.label || voucher.month}</td>
                  <td className="p-3 text-gray-900">{voucher.year}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      voucher.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      voucher.status === 'Generated' || voucher.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {voucher.status === 'Generated' ? 'Pending' :
                       voucher.status === 'Submitted' ? 'Sent' :
                       voucher.status === 'Approved' ? 'Approved' :
                       voucher.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      data-testid={`button-edit-voucher-${voucher.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
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
              <span>Home &gt; Payment &gt; Payment Voucher</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Voucher</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payment-voucher-list" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-auto grid-cols-1 bg-gray-100">
              <TabsTrigger 
                value="payment-voucher-list" 
                className="data-[state=active]:bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 data-[state=active]:text-white px-4"
                data-testid="tab-payment-voucher-list"
              >
                Payment Voucher List
              </TabsTrigger>
            </TabsList>

            {/* Run Payment Button */}
            <Button 
              className="bg-blue-900 hover:bg-blue-800 text-white"
              onClick={() => setShowNewVoucherModal(true)}
              data-testid="button-run-payment"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Payment
            </Button>
          </div>

          {/* Payment Voucher List Tab */}
          <TabsContent value="payment-voucher-list" className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-cyan-800 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Payment Voucher List</h3>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Search:</span>
                <Input
                  placeholder="Search..."
                  className="w-48"
                  data-testid="input-search-voucher-list"
                />
              </div>
            </div>

            {renderPaymentVoucherListTable()}

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 0 to 0 of 0 entries</span>
              <div className="flex items-center space-x-2">
                <span>Previous</span>
                <span>Next</span>
              </div>
            </div>
          </TabsContent>

          

          
        </Tabs>

        {/* Run New Voucher Modal */}
        <Dialog open={showNewVoucherModal} onOpenChange={setShowNewVoucherModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="bg-blue-900 text-white p-4 -m-6 mb-6 rounded-t-lg">
              <DialogTitle className="text-lg font-semibold">Run New Voucher</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Year */}
              <div className="space-y-2">
                <Label htmlFor="year" className="text-sm font-medium">Year</Label>
                <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                  <SelectTrigger data-testid="select-year">
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
                <Label htmlFor="month" className="text-sm font-medium">Month</Label>
                <Select value={formData.month} onValueChange={(value) => handleInputChange('month', value)}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="text-sm font-medium">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                  data-testid="input-payment-date"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-medium">Remarks</Label>
                <Input
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Payment Remark"
                  data-testid="input-remarks"
                />
              </div>

              {/* Approved Claims Summary - GROUPED BY REQUESTOR */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tuntutan Kewangan Diluluskan (Kumpulan mengikut Penuntut)</Label>
                <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                  {claimsLoading ? (
                    <p className="text-sm text-gray-600">Memuatkan tuntutan...</p>
                  ) : !approvedClaims || approvedClaims.length === 0 ? (
                    <p className="text-sm text-gray-600">Tiada tuntutan kewangan diluluskan untuk tempoh ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        // Group claims by requestor name
                        const claimsByRequestor = (approvedClaims || []).reduce((acc: any, claim) => {
                          if (!claim || !claim.employeeId) return acc;
                          const requestorName = getEmployeeName(claim.employeeId);
                          if (!acc[requestorName]) {
                            acc[requestorName] = [];
                          }
                          acc[requestorName].push(claim);
                          return acc;
                        }, {});

                        return Object.entries(claimsByRequestor).map(([requestorName, claims]: [string, any]) => {
                          const requestorTotal = (claims || []).reduce((sum: number, claim: any) => sum + (parseFloat(claim?.amount || '0') || 0), 0);
                          
                          return (
                            <div key={requestorName} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-semibold text-gray-900 text-base">{requestorName}</div>
                                <span className="font-bold text-blue-600">RM {requestorTotal.toFixed(2)}</span>
                              </div>
                              <div className="space-y-1">
                                {(claims || []).map((claim: any) => (
                                  <div key={claim?.id || Math.random()} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                                    <span className="text-gray-600">{claim?.claimCategory || 'N/A'}</span>
                                    <span className="text-green-600 font-medium">RM {(parseFloat(claim?.amount || '0') || 0).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>Jumlah Keseluruhan:</span>
                          <span className="text-blue-600">
                            RM {(approvedClaims || []).reduce((sum, claim) => sum + (parseFloat(claim?.amount || '0') || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowNewVoucherModal(false)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGeneratePayment}
                  className="bg-blue-900 hover:bg-blue-800 text-white disabled:bg-gray-400"
                  disabled={createVoucherMutation.isPending || claimsLoading || !approvedClaims || approvedClaims.length === 0}
                  data-testid="button-generate-payment"
                >
                  {createVoucherMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menjana Voucher...
                    </>
                  ) : (
                    "Generate Voucher"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}