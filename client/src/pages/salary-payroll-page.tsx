import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Download, Eye, FileSpreadsheet, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Salary Payroll Record Item Component
function PayrollRecordItem({ payrollItem, onViewPayslip, onDownloadPDF, onDownloadExcel }: {
  payrollItem: any;
  onViewPayslip: (item: any) => void;
  onDownloadPDF: (item: any) => void;
  onDownloadExcel: (item: any) => void;
}) {
  // Parse salary and net pay data
  const salaryData = payrollItem.salary ? JSON.parse(payrollItem.salary) : {};
  const netPay = parseFloat(payrollItem.netPay || '0');
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Closed':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
      case 'PendingApproval':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Payroll info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {payrollItem.document?.month}/{payrollItem.document?.year} Payslip
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Generated: {new Date(payrollItem.createdAt).toLocaleDateString()}
                </span>
                <span className="font-medium text-green-600">
                  Net Pay: RM {netPay.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex items-center space-x-3">
            <div className="text-right mr-4">
              {getStatusBadge(payrollItem.document?.status || 'pending')}
              {payrollItem.document?.status === 'Closed' && (
                <p className="text-xs text-gray-500 mt-1">Payment Completed</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onViewPayslip(payrollItem)}
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                data-testid={`button-view-payslip-${payrollItem.id}`}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              
              <Button
                onClick={() => onDownloadPDF(payrollItem)}
                size="sm"
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                data-testid={`button-download-pdf-${payrollItem.id}`}
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
              
              <Button
                onClick={() => onDownloadExcel(payrollItem)}
                size="sm"
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50"
                data-testid={`button-download-excel-${payrollItem.id}`}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalaryPayrollPage() {
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const { toast } = useToast();

  // Get current user's employee data
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
    retry: false,
  });

  // Fetch user's payroll records
  const { data: payrollItems = [], isLoading } = useQuery({
    queryKey: ["/api/payroll/employee", (currentUserEmployee as any)?.id],
    enabled: !!(currentUserEmployee as any)?.id,
  });

  // Handle view payslip
  const handleViewPayslip = async (payrollItem: any) => {
    setSelectedPayrollItem(payrollItem);
    setIsGeneratingPreview(true);
    setPdfPreviewUrl(null);

    try {
      const response = await fetch(`/api/payroll/items/${payrollItem.id}/preview-html`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Error",
        description: "Gagal menjana preview payslip",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Handle download PDF
  const handleDownloadPDF = async (payrollItem: any) => {
    try {
      const response = await fetch(`/api/payroll/items/${payrollItem.id}/download-pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get employee name from payroll item for filename
      const employeeData = payrollItem.employeeSnapshot ? JSON.parse(payrollItem.employeeSnapshot) : {};
      const fileName = `Payslip_${employeeData.name?.replace(/\s+/g, '_') || 'Employee'}_${payrollItem.document?.month || 'X'}_${payrollItem.document?.year || 'XXXX'}.pdf`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF payslip berjaya dimuat turun",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Gagal memuat turun PDF payslip",
        variant: "destructive",
      });
    }
  };

  // Handle download Excel
  const handleDownloadExcel = async (payrollItem: any) => {
    try {
      const response = await fetch(`/api/payroll/items/${payrollItem.id}/download-excel`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('utamahr_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download Excel');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get employee name from payroll item for filename
      const employeeData = payrollItem.employeeSnapshot ? JSON.parse(payrollItem.employeeSnapshot) : {};
      const fileName = `Payslip_${employeeData.name?.replace(/\s+/g, '_') || 'Employee'}_${payrollItem.document?.month || 'X'}_${payrollItem.document?.year || 'XXXX'}.xlsx`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Excel payslip berjaya dimuat turun",
      });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({
        title: "Error",
        description: "Gagal memuat turun Excel payslip",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payroll records...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentUserEmployee) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Record Not Found</h3>
              <p className="text-gray-600">Please contact your HR administrator to set up your employee profile.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Salary Payroll</h1>
          <p className="text-gray-600">View and download your monthly payroll statements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Payroll list */}
          <div className="lg:col-span-2">
            {payrollItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payroll Records Found</h3>
                  <p className="text-gray-600">Your payroll records will appear here once they are generated by HR.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payroll History ({payrollItems.length} records)
                </h2>
                {payrollItems.map((item: any) => (
                  <PayrollRecordItem
                    key={item.id}
                    payrollItem={item}
                    onViewPayslip={handleViewPayslip}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadExcel={handleDownloadExcel}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right side - Preview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedPayrollItem ? 'Payslip Preview' : 'Select Payslip to Preview'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Generating preview...</p>
                    </div>
                  </div>
                ) : pdfPreviewUrl ? (
                  <div className="h-96 border rounded">
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full h-full rounded"
                      title="Payslip Preview"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded">
                    <div className="text-center">
                      <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click "View" on any payroll item to see preview</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}