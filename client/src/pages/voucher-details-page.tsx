import { useState } from "react";
import { useParams } from "wouter";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PaymentVoucher, ClaimApplication } from "@shared/schema";

export default function VoucherDetailsPage() {
  const { voucherId } = useParams();
  const [activeTab, setActiveTab] = useState("details");

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

  // Get employee name by ID  
  const getEmployeeName = (employeeId: string) => {
    const employee = (employeesData as any[])?.find(emp => emp.id === employeeId);
    return employee ? employee.fullName : 'Unknown Employee';
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
    window.location.href = '/payment-voucher';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementation for downloading voucher
    console.log('Download voucher:', voucherId);
  };

  if (voucherLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuatkan maklumat voucher...</p>
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
            <p className="text-gray-600 text-lg mb-4">Voucher tidak dijumpai</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Payment Voucher
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const monthName = months.find(m => m.value === voucher.month.toString())?.label || voucher.month;

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
              Kembali ke Payment Voucher
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
              Download
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
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
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
                            Memuatkan maklumat tuntutan...
                          </td>
                        </tr>
                      ) : voucherClaims.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            Tiada maklumat tuntutan dijumpai.
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
                            Jumlah Keseluruhan:
                          </td>
                          <td className="p-3 text-right text-gray-900">
                            RM {voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voucher Preview Tab */}
          <TabsContent value="voucher" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
                <CardTitle className="text-lg">Voucher Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white min-h-96 border rounded-lg p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
                  {/* Voucher Header */}
                  <div className="text-center mb-8">
                    <div className="text-2xl font-bold text-gray-900 mb-2">PAYMENT VOUCHER</div>
                    <div className="text-lg text-gray-700">{voucher.voucherNumber}</div>
                  </div>

                  {/* Voucher Info */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="font-medium w-24">Voucher No:</span>
                          <span>{voucher.voucherNumber}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-24">Month:</span>
                          <span>{monthName}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-24">Year:</span>
                          <span>{voucher.year}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="font-medium w-32">Payment Date:</span>
                          <span>{new Date(voucher.paymentDate).toLocaleDateString('ms-MY')}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-32">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            voucher.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            voucher.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            voucher.status === 'Generated' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {voucher.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Claims Table */}
                  <div className="mb-8">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left font-medium">No</th>
                          <th className="border border-gray-300 p-2 text-left font-medium">Employee Name</th>
                          <th className="border border-gray-300 p-2 text-left font-medium">Claim Type</th>
                          <th className="border border-gray-300 p-2 text-right font-medium">Amount (RM)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucherClaims.map((claim, index) => (
                          <tr key={claim.id}>
                            <td className="border border-gray-300 p-2">{index + 1}</td>
                            <td className="border border-gray-300 p-2">{getEmployeeName(claim.employeeId)}</td>
                            <td className="border border-gray-300 p-2">{claim.claimCategory}</td>
                            <td className="border border-gray-300 p-2 text-right">
                              {(parseFloat(claim.amount || '0') || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-100 font-bold">
                          <td colSpan={3} className="border border-gray-300 p-2 text-right">Total Amount:</td>
                          <td className="border border-gray-300 p-2 text-right">
                            RM {voucherClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount || '0') || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks */}
                  {voucher.remarks && (
                    <div className="mb-8">
                      <div className="font-medium text-gray-900 mb-2">Remarks:</div>
                      <div className="text-gray-700 border border-gray-300 p-3 rounded">
                        {voucher.remarks}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-end mt-16">
                    <div className="text-center">
                      <div className="border-t border-gray-400 w-48 mb-2"></div>
                      <div className="text-sm">Prepared By</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-gray-400 w-48 mb-2"></div>
                      <div className="text-sm">Approved By</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}