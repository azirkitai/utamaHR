import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("payroll-details");

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

  const handleBackToList = () => {
    window.location.href = "/payment/salary-payroll";
  };

  const handleViewPayslip = (employeeId: string) => {
    // This would open individual payslip modal or navigate to detailed view
    console.log("View payslip for employee:", employeeId);
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
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-submit-payment"
          >
            Submit Payment
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 py-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              ✓
            </div>
            <span className="text-sm text-green-600 font-medium">Update & Review</span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">In Progress</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm text-gray-600">Approval</span>
          </div>
          
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-medium text-gray-900">Name</th>
                      <th className="text-left p-3 font-medium text-gray-900">Salary</th>
                      <th className="text-left p-3 font-medium text-gray-900">Additional</th>
                      <th className="text-left p-3 font-medium text-gray-900">Gross</th>
                      <th className="text-left p-3 font-medium text-gray-900">Deduction</th>
                      <th className="text-left p-3 font-medium text-gray-900">Contribution</th>
                      <th className="text-left p-3 font-medium text-gray-900">Status</th>
                      <th className="text-center p-3 font-medium text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingItems ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
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
                        const totalDeductions = parseFloat(deductionsData.epfEmployee || '0') + 
                                              parseFloat(deductionsData.socsoEmployee || '0') + 
                                              parseFloat(deductionsData.eisEmployee || '0');
                        const totalContributions = parseFloat(contributionsData.epfEmployer || '0') + 
                                                  parseFloat(contributionsData.socsoEmployer || '0') + 
                                                  parseFloat(contributionsData.eisEmployer || '0');
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-900">{employeeSnapshot.name || 'N/A'}</td>
                            <td className="p-3 text-gray-600">RM {basicSalary.toFixed(2)}</td>
                            <td className="p-3 text-gray-600">RM {parseFloat(salaryData.fixedAllowance || '0').toFixed(2)}</td>
                            <td className="p-3 text-gray-600">RM {grossSalary.toFixed(2)}</td>
                            <td className="p-3 text-gray-600">RM {totalDeductions.toFixed(2)}</td>
                            <td className="p-3 text-gray-600">RM {totalContributions.toFixed(2)}</td>
                            <td className="p-3">
                              {getStatusBadge(item.status || 'pending')}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-1 h-7 w-7 border-gray-300"
                                  onClick={() => handleViewPayslip(item.employeeId)}
                                  data-testid={`button-view-payslip-${item.employeeId}`}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-1 h-7 w-7 border-gray-300"
                                  data-testid={`button-download-payslip-${item.employeeId}`}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No payroll items found. Click "Generate Items" to create payroll for all employees.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  data-testid="button-delete-payroll"
                >
                  Delete
                </Button>
                <Button
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                  data-testid="button-submit-payroll"
                >
                  Submit Payment
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Payslip Tab */}
          <TabsContent value="payslip" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Payslips</h3>
              <div className="text-gray-500 text-center py-8">
                Select an employee from the Payroll Details tab to view their individual payslip
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}