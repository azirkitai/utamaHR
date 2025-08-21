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
import { Search, Edit, ChevronDown, Download } from "lucide-react";
import { LeavePolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LeavePolicyModal } from "./LeavePolicyModal";
import { IndividualLeaveAdjustmentModal } from "./IndividualLeaveAdjustmentModal";


interface LeavePolicyTabProps {
  employeeId: string;
}

export function LeavePolicyTab({ employeeId }: LeavePolicyTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingPolicy, setAdjustingPolicy] = useState<any | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current logged-in user data for role-based access control
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch current user's employee data to get role
  const { data: currentUserEmployee } = useQuery({
    queryKey: ["/api/user/employee"],
    enabled: !!currentUser?.id,
  });

  // Check if current logged-in user has privileged access (Super Admin, Admin, HR Manager only)
  const hasPrivilegedAccess = () => {
    const currentUserRole = currentUserEmployee?.role || currentUser?.role;
    const privilegedRoles = ['Super Admin', 'Admin', 'HR Manager'];
    const hasAccess = privilegedRoles.includes(currentUserRole);
    
    // Debug logging
    console.log("Current user role (LeavePolicyTab):", currentUserRole);
    console.log("Has privileged access (LeavePolicyTab):", hasAccess);
    
    return hasAccess;
  };

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
  const { data: employmentData } = useQuery<{ designation?: string }>({
    queryKey: ["/api/employment", employeeId],
    enabled: !!employeeId,
  });

  // Fetch enabled company leave types (this determines what leave types are "switched on" for the company)
  const { data: enabledCompanyLeaveTypes = [] } = useQuery<Array<{ leaveType: string; enabled: boolean }>>({
    queryKey: ['/api/company-leave-types/enabled'],
  });

  // Fetch all group policy settings
  const { data: allGroupSettings = [] } = useQuery<Array<{ leaveType: string; role: string }>>({
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
      (companyType) => companyType.leaveType === leaveType && companyType.enabled
    );
  };

  // Helper function to check if employee is allowed for a leave type based on role
  const isLeaveTypeAllowedForRole = (leaveType: string) => {
    if (!leaveType || !employeeRole) return true; // Allow if no restrictions set
    
    // Get group settings for this leave type
    const leaveTypeSettings = allGroupSettings.filter((setting) => 
      setting.leaveType === leaveType
    );
    
    // If no group settings exist for this leave type, allow access
    if (leaveTypeSettings.length === 0) return true;
    
    // Check if employee's role is in the allowed roles
    return leaveTypeSettings.some((setting) => setting.role === employeeRole);
  };

  // Filter policies based on search only - show all leave types but control access through company/role settings
  const filteredPolicies = leavePolicies.filter((policy) => {
    const matchesSearch = policy.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Helper function to check if a leave policy should be accessible (both company enabled and role allowed)
  const isPolicyAccessible = (policy: any) => {
    // If policy has isRestricted flag, respect it
    if (policy.isRestricted) return false;
    
    const isEnabledForCompany = isLeaveTypeEnabledForCompany(policy.leaveType || "");
    const hasRoleAccess = isLeaveTypeAllowedForRole(policy.leaveType || "");
    return isEnabledForCompany && hasRoleAccess;
  };

  const handleEdit = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
  };

  const handleEditAdjustment = (policy: any) => {
    setAdjustingPolicy(policy);
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setAdjustingPolicy(null);
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
        <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
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
        <CardHeader className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 text-white">
          <div className="flex items-center justify-between">
            <CardTitle>Leave Policies</CardTitle>
            <Badge variant="secondary" className="bg-white text-cyan-600">
              System Policies
            </Badge>
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        {searchTerm ? "No leave policies found matching your search." : "No data available in table"}
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy) => {
                      const isAccessible = isPolicyAccessible(policy);
                      return (
                        <tr key={policy.id} className={`hover:bg-gray-50 ${!isAccessible ? 'opacity-60 bg-gray-50' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
                              {policy.leaveType || "N/A"}
                              {!isAccessible && (
                                <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                  Not Available
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
                              {policy.entitlement ? `${policy.entitlement} days` : "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
                              {policy.balance !== null && policy.balance !== undefined 
                                ? `${policy.balance} days` 
                                : "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`text-sm max-w-xs truncate ${isAccessible ? 'text-gray-900' : 'text-gray-500'}`}>
                              {policy.remarks || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                            {isAccessible && hasPrivilegedAccess() ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAdjustment(policy)}
                                className="text-xs"
                                data-testid={`button-edit-${policy.id}`}
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                {!hasPrivilegedAccess() ? "Access Restricted" : "Not Available"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Switch
                                checked={policy.included || false}
                                onCheckedChange={(checked) => handleStatusToggle(policy.id, checked)}
                                disabled={updateStatusMutation.isPending || !isAccessible || !hasPrivilegedAccess()}
                                data-testid={`switch-included-${policy.id}`}
                              />
                              <span className={`ml-2 text-sm ${isAccessible && hasPrivilegedAccess() ? 'text-gray-600' : 'text-gray-400'}`}>
                                {!hasPrivilegedAccess() 
                                  ? "Access Restricted" 
                                  : isAccessible 
                                    ? (policy.included ? "Yes" : "No") 
                                    : "Restricted"
                                }
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredPolicies.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div>
                Showing {filteredPolicies.length} of {filteredPolicies.length} entries 
                ({filteredPolicies.filter(policy => isPolicyAccessible(policy)).length} accessible)
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

      {/* Individual Leave Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <IndividualLeaveAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={handleCloseAdjustmentModal}
          employeeId={employeeId}
          leavePolicy={adjustingPolicy}
        />
      )}

    </>
  );
}