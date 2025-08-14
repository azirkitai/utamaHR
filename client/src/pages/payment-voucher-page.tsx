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
  Trash2
} from "lucide-react";

export default function PaymentVoucherPage() {
  const [showNewVoucherModal, setShowNewVoucherModal] = useState(false);
  const [formData, setFormData] = useState({
    year: "2025",
    month: "August",
    paymentDate: "2025-08-08",
    remarks: "Payment Remark"
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = ["2023", "2024", "2025", "2026"];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePayment = () => {
    // Handle generate payment logic here
    console.log("Generate Payment:", formData);
    setShowNewVoucherModal(false);
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
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">
                No data available in table
              </td>
            </tr>
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
                      <SelectItem key={month} value={month}>
                        {month}
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
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-generate-payment"
                >
                  Generate Payment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}