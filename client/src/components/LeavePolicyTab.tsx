import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Edit, ChevronDown, Download, Settings } from "lucide-react";
import { LeavePolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LeavePolicyModal } from "./LeavePolicyModal";
import { GroupPolicyDialog } from "./GroupPolicyDialog";

interface LeavePolicyTabProps {
  employeeId: string;
}

export function LeavePolicyTab({ employeeId }: LeavePolicyTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [groupPolicyOpen, setGroupPolicyOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leave policies data
  const { data: leavePolicies = [], isLoading } = useQuery<LeavePolicy[]>({
    queryKey: ["/api/leave-policies", employeeId],
    enabled: !!employeeId,
  });

  // Fetch employee data to get role information
  const { data: employeeData } = useQuery({
    queryKey: ["/api/employees", employeeId],
    enabled: !!employeeId,
  });

  // Fetch employment data to get the employee's role
  const { data: employmentData } = useQuery({
    queryKey: ["/api/employment", employeeId],
    enabled: !!employeeId,
  });

  // Fetch enabled company leave types (this determines what leave types are "switched on" for the company)
  const { data: enabledCompanyLeaveTypes = [] } = useQuery({
    queryKey: ['/api/company-leave-types/enabled'],
  });

  // Fetch all group policy settings
  const { data: allGroupSettings = [] } = useQuery({
    queryKey: ["/api/group-policy-settings"],
  });

  // Update policy status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ policyId, included }: { policyId: string; included: boolean }) => {
      await apiRequest(`/api/leave-policies/${policyId}`, "PUT", { included });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies", employeeId] });
      toast({
        title: "Berjaya",
        description: "Status polisi cuti berjaya dikemaskini",
      });
    },
    onError: () => {
      toast({
        title: "Ralat",
        description: "Gagal mengemaskini status polisi",
        variant: "destructive",
      });
    },
  });

  // Get employee role
  const employeeRole = employmentData?.designation || null;

  // Helper function to check if a leave type is enabled for the company
  const isLeaveTypeEnabledForCompany = (leaveType: string) => {
    return enabledCompanyLeaveTypes.some(
      (companyType: any) => companyType.leaveType === leaveType && companyType.enabled
    );
  };

  // Helper function to check if employee is allowed for a leave type based on role
  const isLeaveTypeAllowedForRole = (leaveType: string) => {
    if (!leaveType || !employeeRole) return true; // Allow if no restrictions set
    
    // Get group settings for this leave type
    const leaveTypeSettings = allGroupSettings.filter((setting: any) => 
      setting.leaveType === leaveType
    );
    
    // If no group settings exist for this leave type, allow access
    if (leaveTypeSettings.length === 0) return true;
    
    // Check if employee's role is in the allowed roles
    return leaveTypeSettings.some((setting: any) => setting.role === employeeRole);
  };

  // Filter policies based on search, company-wide enabled types, and role-based access
  const filteredPolicies = leavePolicies.filter((policy) => {
    const matchesSearch = policy.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if leave type is enabled for the company (switched on in system settings)
    const isEnabledForCompany = isLeaveTypeEnabledForCompany(policy.leaveType || "");
    
    // Check if employee has role-based access
    const hasRoleAccess = isLeaveTypeAllowedForRole(policy.leaveType || "");
    
    return matchesSearch && isEnabledForCompany && hasRoleAccess;
  });

  const handleEdit = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
  };

  const handleGroupPolicy = (leaveType: string) => {
    setSelectedLeaveType(leaveType);
    setGroupPolicyOpen(true);
  };

  const handleStatusToggle = (policyId: string, included: boolean) => {
    updateStatusMutation.mutate({ policyId, included });
  };

  const handleExportExcel = () => {
    toast({
      title: "Export Excel",
      description: "Memuat turun fail Excel...",
    });
    // TODO: Implement Excel export
  };

  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "Memuat turun fail PDF...",
    });
    // TODO: Implement PDF export
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
          <CardTitle>Leave Policies</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>Leave Policies</CardTitle>
            <div className="flex items-center gap-2">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-white text-teal-600 hover:bg-gray-100"
                    size="sm"
                    data-testid="button-export-leave-policies"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel} data-testid="option-export-excel">
                    <Download className="w-4 h-4 mr-2" />
                    Download as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} data-testid="option-export-pdf">
                    <Download className="w-4 h-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Button */}
              <Button
                onClick={handleAddNew}
                className="bg-white text-teal-600 hover:bg-gray-100"
                size="sm"
                data-testid="button-add-leave-policy"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex justify-end mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-leave-policies"
              />
            </div>
          </div>

          {/* Leave Policies Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entitlement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Policy
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Included
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        {searchTerm ? "No leave policies found matching your search." : "No data available in table"}
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy) => (
                      <tr key={policy.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {policy.leaveType || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {policy.entitlement ? `${policy.entitlement} days` : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {policy.balance !== null && policy.balance !== undefined 
                              ? `${policy.balance} days` 
                              : "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {policy.remarks || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGroupPolicy(policy.leaveType || "")}
                            className="text-purple-600 hover:text-purple-700"
                            data-testid={`button-group-policy-${policy.id}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(policy)}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`button-edit-leave-policy-${policy.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Switch
                              checked={policy.included || false}
                              onCheckedChange={(checked) => handleStatusToggle(policy.id, checked)}
                              disabled={updateStatusMutation.isPending}
                              data-testid={`switch-included-${policy.id}`}
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {policy.included ? "Yes" : "No"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredPolicies.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div>
                Showing {filteredPolicies.length} of {leavePolicies.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Policy Modal */}
      {isModalOpen && (
        <LeavePolicyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          employeeId={employeeId}
          leavePolicy={editingPolicy}
        />
      )}

      {/* Group Policy Dialog */}
      <GroupPolicyDialog
        open={groupPolicyOpen}
        onOpenChange={setGroupPolicyOpen}
        leaveType={selectedLeaveType}
      />
    </>
  );
}