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
    remarks: "Pembayaran untuk tuntutan kewangan bulan Ogos 2025"
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

  // Create payment voucher mutation
  const createVoucherMutation = useMutation({
    mutationFn: async (voucherData: any) => {
      return await apiRequest(`/api/payment-vouchers`, {
        method: 'POST',
        body: JSON.stringify(voucherData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-vouchers'] });
      toast({
        title: "Berjaya",
        description: "Voucher pembayaran berjaya dicipta",
      });
      setShowNewVoucherModal(false);
      setFormData({
        year: "2025",
        month: "8", 
        paymentDate: "2025-08-08",
        remarks: "Pembayaran untuk tuntutan kewangan"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mencipta voucher pembayaran",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePayment = () => {
    if (!approvedClaims.length) {
      toast({
        title: "Amaran",
        description: "Tiada tuntutan kewangan yang diluluskan untuk tempoh ini",
        variant: "destructive",
      });
      return;
    }

    // Calculate total amount from approved claims
    const totalAmount = approvedClaims.reduce((sum, claim) => sum + (claim.amount || 0), 0);

    const voucherData = {
      year: parseInt(formData.year),
      month: parseInt(formData.month),
      paymentDate: formData.paymentDate,
      totalAmount,
      claimIds: approvedClaims.map(claim => claim.id),
      remarks: formData.remarks,
      status: 'Pending' as const
    };

    createVoucherMutation.mutate(voucherData);
  };

  const renderPaymentVoucherListTable = () => (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-3 font-medium text-gray-900 w-16">No</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-40">Payment Voucher No.</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Year</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Month</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Payment Date</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-24">Status</th>
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Remarks</th>
              <th className="text-center p-3 font-medium text-gray-900 min-w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {vouchersLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Memuatkan voucher pembayaran...
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Tiada voucher pembayaran dijumpai.
                </td>
              </tr>
            ) : (
              vouchers.map((voucher, index) => (
                <tr key={voucher.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-900">{index + 1}</td>
                  <td className="p-3 font-medium text-blue-600">{voucher.voucherNumber}</td>
                  <td className="p-3 text-gray-900">{voucher.year}</td>
                  <td className="p-3 text-gray-900">{months.find(m => m.value === voucher.month.toString())?.label || voucher.month}</td>
                  <td className="p-3 text-gray-900">{new Date(voucher.paymentDate).toLocaleDateString('ms-MY')}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      voucher.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {voucher.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-900 max-w-48 truncate" title={voucher.remarks || ''}>
                    {voucher.remarks || '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-testid={`button-view-voucher-${voucher.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        data-testid={`button-edit-voucher-${voucher.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        data-testid={`button-delete-voucher-${voucher.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Payment Date</th>
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
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">Payment Date</th>
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
            <TabsList className="grid w-auto grid-cols-3 bg-gray-100">
              <TabsTrigger 
                value="payment-voucher-list" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white px-4"
                data-testid="tab-payment-voucher-list"
              >
                Payment Voucher List
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
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
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

          {/* Task Tab */}
          <TabsContent value="task" className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Payment Voucher Task</h3>
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
              <h3 className="text-lg font-semibold">Payment Voucher Report List</h3>
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

              {/* Approved Claims Summary */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tuntutan Kewangan Diluluskan</Label>
                <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                  {claimsLoading ? (
                    <p className="text-sm text-gray-600">Memuatkan tuntutan...</p>
                  ) : approvedClaims.length === 0 ? (
                    <p className="text-sm text-gray-600">Tiada tuntutan kewangan diluluskan untuk tempoh ini.</p>
                  ) : (
                    <div className="space-y-2">
                      {approvedClaims.map((claim, index) => (
                        <div key={claim.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">
                            {claim.employeeId} - {claim.claimCategory}
                          </span>
                          <span className="font-medium">
                            RM {(claim.amount || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center text-sm font-semibold">
                          <span>Jumlah Keseluruhan:</span>
                          <span className="text-blue-600">
                            RM {approvedClaims.reduce((sum, claim) => sum + (claim.amount || 0), 0).toFixed(2)}
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
                  disabled={createVoucherMutation.isPending || claimsLoading || approvedClaims.length === 0}
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